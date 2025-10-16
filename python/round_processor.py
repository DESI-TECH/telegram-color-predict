"""
round_processor.py

- Processes real-money rounds (global) and demo-mode rounds (per-user with 80% win rate).
- Updates users' balances, inserts bets and transactions, writes round result.
- Requires pymongo and a MongoDB connection string.
"""

import os
import random
from typing import Dict, List
from decimal import Decimal, ROUND_DOWN
from pymongo import MongoClient, ReturnDocument
from datetime import datetime

# -----------------------------
# Configuration
# -----------------------------
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "color_predict")
MULTIPLIERS = {
    "red": 1.8,
    "green": 1.8,
    "gradient": 4.5
}
# Demo win probability per user
DEMO_WIN_PCT = 0.8

# Rounding helper
def money_round(x):
    # round down to 2 decimals
    return float(Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_DOWN))


# -----------------------------
# DB Setup
# -----------------------------
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections:
# - bets_pending: incoming bets for the round (not yet processed)
# - bets: resolved bets (with result, payout)
# - users: user documents { user_id, balance, demo_balance, locked_balance, unlocked_balance, ... }
# - transactions: transaction log
# - rounds: round results log

# -----------------------------
# Utility functions
# -----------------------------
def compute_probs_from_multipliers(multipliers: Dict[str, float]) -> Dict[str, float]:
    inv = {c: 1.0 / m for c, m in multipliers.items()}
    s = sum(inv.values())
    return {c: v / s for c, v in inv.items()}

def pick_winner_by_probs(probs: Dict[str, float]) -> str:
    r = random.random()
    cum = 0.0
    for c, p in probs.items():
        cum += p
        if r <= cum:
            return c
    return list(probs.keys())[-1]

def aggregate_global_bets(round_id: str) -> Dict[str, float]:
    pipeline = [
        {"$match": {"round_id": round_id, "mode": "real"}},
        {"$group": {"_id": "$color", "total": {"$sum": "$amount"}}}
    ]
    res = db.bets_pending.aggregate(pipeline)
    totals = {doc["_id"]: float(doc["total"]) for doc in res}
    # ensure all keys
    return {c: totals.get(c, 0.0) for c in MULTIPLIERS.keys()}

def total_amount(bets_list: List[dict]) -> float:
    return sum(float(b["amount"]) for b in bets_list)

# -----------------------------
# Core: process real-money global round
# -----------------------------
def process_global_round(round_id: str) -> dict:
    """
    - Reads bets from bets_pending with given round_id and mode == "real"
    - Aggregates global bets per color
    - Computes probabilities (1/multiplier normalized)
    - Picks winner using those probabilities
    - Pays winners at multiplier, updates users' balances, writes resolved bet docs and transactions
    - Returns summary dict
    """
    # fetch pending real bets for round
    pending = list(db.bets_pending.find({"round_id": round_id, "mode": "real"}))
    if not pending:
        return {"error": "no bets for round", "round_id": round_id}

    # aggregate totals
    totals = aggregate_global_bets(round_id)
    grand_total = sum(totals.values())

    # compute probabilities and expected payout info
    probs = compute_probs_from_multipliers(MULTIPLIERS)
    # expected payout per unit (for debug / monitoring)
    expected_payout_per_unit = sum(probs[c] * MULTIPLIERS[c] for c in MULTIPLIERS.keys())
    house_edge_fraction = max(0.0, 1.0 - expected_payout_per_unit)

    # pick winner
    winner = pick_winner_by_probs(probs)

    # process each bet: compute payout, update user balances, insert resolved bet and transaction
    total_payout = 0.0
    user_payouts = {}  # user_id -> amount paid
    resolved_bets = []

    for b in pending:
        user_id = b["user_id"]
        color = b["color"]
        amount = float(b["amount"])

        if color == winner:
            payout = money_round(amount * MULTIPLIERS[color])
            result = "WIN"
        else:
            payout = 0.0
            result = "LOSE"

        total_payout += payout
        user_payouts[user_id] = user_payouts.get(user_id, 0.0) + payout

        # write resolved bet
        resolved = {
            "round_id": round_id,
            "user_id": user_id,
            "color": color,
            "amount": amount,
            "mode": "real",
            "result": result,
            "payout": payout,
            "timestamp": datetime.utcnow()
        }
        resolved_bets.append(resolved)

    # Now atomically update user balances and write transactions & resolved bets.
    # Note: MongoDB transactions require replica set; if not available we do best-effort updates.
    for rb in resolved_bets:
        uid = rb["user_id"]
        payout = rb["payout"]
        amount = rb["amount"]
        # update user's real balance: credit payout (if any), bets money was already deducted at bet time ideally
        if payout > 0:
            db.users.update_one({"user_id": uid}, {"$inc": {"balance": payout}})
            db.transactions.insert_one({
                "user_id": uid,
                "type": "Bet Win",
                "amount": payout,
                "status": "SUCCESS",
                "round_id": round_id,
                "timestamp": datetime.utcnow()
            })
        else:
            db.transactions.insert_one({
                "user_id": uid,
                "type": "Bet Loss",
                "amount": amount,
                "status": "N/A",
                "round_id": round_id,
                "timestamp": datetime.utcnow()
            })
        # insert resolved bet
        db.bets.insert_one(rb)

    # remove pending bets for this round
    db.bets_pending.delete_many({"round_id": round_id, "mode": "real"})

    # log round result
    round_doc = {
        "round_id": round_id,
        "mode": "real",
        "winner": winner,
        "totals": totals,
        "grand_total": grand_total,
        "probabilities": probs,
        "total_payout": money_round(total_payout),
        "house_take": money_round(grand_total - total_payout),
        "expected_payout_per_unit": round(expected_payout_per_unit, 6),
        "house_edge_fraction": round(house_edge_fraction, 6),
        "timestamp": datetime.utcnow()
    }
    db.rounds.insert_one(round_doc)

    return round_doc

# -----------------------------
# Demo: per-user 80% win rounds (independent)
# -----------------------------
def process_demo_rounds(round_id: str) -> dict:
    """
    Process all demo bets for a given round_id.
    Each user bet processed independently with DEMO_WIN_PCT chance to win.
    If win: they are paid at multiplier for their chosen color.
    If lose: payout = 0
    """
    pending = list(db.bets_pending.find({"round_id": round_id, "mode": "demo"}))
    if not pending:
        return {"error": "no demo bets", "round_id": round_id}

    summary = {
        "round_id": round_id,
        "mode": "demo",
        "processed": 0,
        "total_payout": 0.0,
        "total_bets": 0.0,
        "details": []
    }

    for b in pending:
        uid = b["user_id"]
        color = b["color"]
        amount = float(b["amount"])
        summary["total_bets"] += amount

        # determine win by chance
        win = random.random() < DEMO_WIN_PCT
        if win:
            payout = money_round(amount * MULTIPLIERS[color])
            result = "WIN"
            # credit demo balance or demoBalance field
            db.users.update_one({"user_id": uid}, {"$inc": {"demo_balance": payout}})
            db.transactions.insert_one({
                "user_id": uid,
                "type": "Demo Bet Win",
                "amount": payout,
                "status": "N/A",
                "round_id": round_id,
                "timestamp": datetime.utcnow()
            })
        else:
            payout = 0.0
            result = "LOSE"
            db.transactions.insert_one({
                "user_id": uid,
                "type": "Demo Bet Loss",
                "amount": amount,
                "status": "N/A",
                "round_id": round_id,
                "timestamp": datetime.utcnow()
            })

        # record resolved bet in bets
        db.bets.insert_one({
            "round_id": round_id,
            "user_id": uid,
            "color": color,
            "amount": amount,
            "mode": "demo",
            "result": result,
            "payout": payout,
            "timestamp": datetime.utcnow()
        })

        summary["processed"] += 1
        summary["total_payout"] += payout
        summary["details"].append({"user_id": uid, "color": color, "amount": amount, "result": result, "payout": payout})

    # delete pending demo bets
    db.bets_pending.delete_many({"round_id": round_id, "mode": "demo"})
    summary["total_payout"] = money_round(summary["total_payout"])
    return summary

# -----------------------------
# Helper: place bet (should be called when user places a bet)
# -----------------------------
def place_bet(user_id: int, round_id: str, color: str, amount: float, mode: str = "real") -> dict:
    """
    Validates and inserts a pending bet. For real-money bets, deducts from user's locked_balance/totalBalance
    according to your unlocking rules (if you use locked/unlocked scheme).
    This function does NOT resolve the bet; it just registers it for the round.
    """
    color = color.lower()
    if color not in MULTIPLIERS:
        return {"error": "invalid color"}

    if amount <= 0:
        return {"error": "invalid amount"}

    # For real: ensure user has funds (use your locked/unlocked scheme)
    user = db.users.find_one({"user_id": user_id})
    if not user:
        # create skeleton user if needed
        user = {"user_id": user_id, "balance": 0.0, "demo_balance": 0.0, "locked_balance": 0.0, "unlocked_balance": 0.0}
        db.users.insert_one(user)

    if mode == "real":
        # Example deduction: reduce locked_balance by amount and increase unlocked_balance by amount
        locked = float(user.get("locked_balance", 0.0))
        if amount > locked:
            return {"error": "insufficient locked balance to place bet"}

        # Deduct from locked and total (assuming totalBalance tracked separately)
        db.users.update_one({"user_id": user_id}, {"$inc": {"locked_balance": -amount, "unlocked_balance": amount}})
        # You may also deduct from total balance field if you maintain it (not shown here)
    else:
        # demo: ensure demo balance or allow placing demo bets without balance (depends on setup)
        pass

    # insert into bets_pending
    db.bets_pending.insert_one({
        "round_id": round_id,
        "user_id": user_id,
        "color": color,
        "amount": float(amount),
        "mode": mode,
        "timestamp": datetime.utcnow()
    })

    return {"success": True, "message": "bet placed"}

# -----------------------------
# Example usage in script mode
# -----------------------------
if __name__ == "__main__":
    # small demo: insert some pending bets (only for example)
    # WARNING: running multiple times will insert duplicates; use carefully.
    rnd = "round-1001"
    # clear example pending (uncomment if you want fresh start)
    # db.bets_pending.delete_many({"round_id": rnd})

    # place some example real bets (assumes users exist and have locked_balance)
    # db.bets_pending.insert_many([
    #     {"round_id": rnd, "user_id": 1, "color": "red", "amount": 100.0, "mode": "real", "timestamp": datetime.utcnow()},
    #     {"round_id": rnd, "user_id": 2, "color": "green", "amount": 700.0, "mode": "real", "timestamp": datetime.utcnow()},
    #     {"round_id": rnd, "user_id": 3, "color": "gradient", "amount": 300.0, "mode": "real", "timestamp": datetime.utcnow()},
    # ])

    print("Processing real round:", rnd)
    result = process_global_round(rnd)
    print(result)

    # Demo processing example:
    # print("Processing demo round:", rnd)
    # demo_result = process_demo_rounds(rnd)
    # print(demo_result)

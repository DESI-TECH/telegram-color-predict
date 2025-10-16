import sys
import json
from datetime import datetime
import random
from pymongo import MongoClient
import os

MONGO_URI = os.environ.get("MONGO_URI")
OWNER_ID = os.environ.get("OWNER_ID")  # Owner's wallet ID

client = MongoClient(MONGO_URI)
db = client.get_database()

def process_bet(userId, color, amount):
    user = db.users.find_one({"userId": userId})
    if not user:
        db.users.insert_one({"userId": userId, "balance": 0, "locked": 0, "unlocked": 0})
        user = db.users.find_one({"userId": userId})

    if amount > user.get("unlocked", 0):
        return {"error": "Not enough unlocked balance"}

    # Deduct from unlocked
    user["unlocked"] -= amount
    user["locked"] -= amount
    user["balance"] -= amount

    # House edge 50%
    owner_edge = amount * 0.5
    db.users.update_one({"userId": OWNER_ID}, {"$inc": {"balance": owner_edge}})

    # 80% loss
    lose_chance = random.randint(1, 100)
    if lose_chance <= 80:
        result = "LOSE"
        win_amount = 0
    else:
        result = "WIN"
        if color.upper() == "GRADIENT":
            win_amount = int(amount * 4.5)
        else:
            win_amount = int(amount * 1.8)
        user["balance"] += win_amount
        user["unlocked"] += win_amount

    # Update user
    db.users.update_one({"userId": userId}, {"$set": {
        "balance": user["balance"],
        "locked": user["locked"],
        "unlocked": user["unlocked"]
    }})

    # Log bet
    db.bets.insert_one({
        "userId": userId,
        "color": color,
        "amount": amount,
        "amountWonLoss": win_amount,
        "result": result,
        "timestamp": datetime.utcnow()
    })

    return {"result": result, "amountWonLoss": win_amount}

# Read input from stdin
try:
    input_data = json.loads(sys.stdin.read())
    userId = input_data.get("userId")
    color = input_data.get("color")
    amount = input_data.get("amount")
    response = process_bet(userId, color, amount)
    print(json.dumps(response))
except Exception as e:
    print(json.dumps({"error": str(e)}))

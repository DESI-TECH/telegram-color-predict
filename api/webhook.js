const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Utils for DB simulation
const dbPath = path.join(__dirname, "../utils/database.json");
function readDB() {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}
function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Probability + house edge logic
function processBet(user, color, amount) {
    if (amount > user.balance.locked + user.balance.unlocked) {
        return { success: false, error: "Insufficient balance" };
    }

    // Deduct from locked balance first
    let remaining = amount;
    if (user.balance.unlocked >= remaining) {
        user.balance.unlocked -= remaining;
    } else {
        remaining -= user.balance.unlocked;
        user.balance.unlocked = 0;
        user.balance.locked -= remaining;
    }

    // 80% loss chance
    let loseChance = Math.random() < 0.8;

    // Gradient color multiplier
    let multiplier = color === "gradient" ? 4.5 : 1.8;

    let wonAmount = 0;
    let result = "loss";

    if (!loseChance) {
        wonAmount = Math.floor(amount * multiplier);
        result = "win";
    }

    // Update balances
    // 50% house edge goes to owner
    const houseEdge = Math.floor(amount * 0.5);
    const owner = db.users.find(u => u.role === "owner");
    owner.balance.unlocked += houseEdge;

    // 1% unlock per bet
    const unlock = Math.floor(amount * 0.01);
    user.balance.unlocked += unlock;

    // Record bet history
    const betRecord = {
        userId: user.id,
        color,
        amount,
        result,
        amountWonLoss: wonAmount,
        timestamp: Date.now()
    };
    db.bets.push(betRecord);

    if (result === "win") user.balance.unlocked += wonAmount;

    writeDB(db);

    return { success: true, bet: betRecord };
}

// Webhook endpoint
router.post("/", (req, res) => {
    const { userId, color, amount } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.id == userId);
    if (!user) return res.json({ success: false, er

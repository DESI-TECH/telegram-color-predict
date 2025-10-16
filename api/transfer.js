const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../utils/database.json");

function readDB() {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

router.post("/", (req, res) => {
    const { fromUserId, toUserId, amount } = req.body;
    const db = readDB();

    const sender = db.users.find(u => u.id == fromUserId);
    const receiver = db.users.find(u => u.id == toUserId);

    if (!sender || !receiver) return res.json({ success: false, error: "User not found" });

    const withdrawable = sender.balance.unlocked;
    if (amount > withdrawable) {
        return res.json({ success: false, error: `Not enough unlocked balance. Max transferable: ${withdrawable}` });
    }

    // Deduct from sender unlocked
    sender.balance.unlocked -= amount;

    // Add to receiver locked balance
    receiver.balance.locked += amount;

    // Record transaction
    db.transactions.push({
        userId: sender.id,
        type: "Transfer",
        amount,
        status: "SUCCESS",
        timestamp: Date.now(),
        toUserId: receiver.id
    });

    writeDB(db);

    res.json({ success: true, message: `Transfer successful`, senderBalance: sender.balance, receiverBalance: receiver.balance });
});

module.exports = router;

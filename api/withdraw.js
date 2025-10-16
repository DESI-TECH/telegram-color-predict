import express from "express";
import { getDb, connectDb } from "../utils/database.js";

const router = express.Router();

// Withdraw endpoint
router.post("/", async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount < 1200) {
    return res.status(400).json({ message: "Invalid withdraw (min 1200)" });
  }

  await connectDb();
  const db = getDb();
  const users = db.collection("users");

  const user = await users.findOne({ userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  const maxWithdrawable = user.unlocked;

  if (amount > maxWithdrawable) {
    return res.status(400).json({ message: "Not enough unlocked balance" });
  }

  // Deduct from balance/unlocked
  await users.updateOne(
    { userId },
    {
      $inc: { balance: -amount, unlocked: -amount },
    }
  );

  res.json({ message: "Withdraw successful", amount });
});

export default router;

import express from "express";
import { getDb, connectDb } from "../utils/database.js";

const router = express.Router();

// Get transactions for user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  await connectDb();
  const db = getDb();
  const transactions = db.collection("transactions");

  const userTransactions = await transactions
    .find({ userId })
    .sort({ timestamp: -1 })
    .toArray();

  res.json({ transactions: userTransactions });
});

export default router;

import express from "express";
import { getDb, connectDb } from "../utils/database.js";

const router = express.Router();

// Owner-only: get global stats
router.get("/stats", async (req, res) => {
  const { ownerKey } = req.query;
  if (ownerKey !== process.env.OWNER_KEY) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await connectDb();
  const db = getDb();
  const users = db.collection("users");
  const transactions = db.collection("transactions");

  const totalUsers = await users.countDocuments();
  const totalBalance = await users.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]).toArray();
  const totalTransactions = await transactions.countDocuments();

  res.json({
    totalUsers,
    totalBalance: totalBalance[0]?.total || 0,
    totalTransactions,
  });
});

export default router;

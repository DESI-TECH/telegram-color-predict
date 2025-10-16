import express from "express";
import { getDb } from "../utils/database.js";

const router = express.Router();

// GET /api/balance?userId=...
router.get("/", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = await getDb();
  const user = await db.collection("users").findOne({ userId });

  if (!user) {
    await db.collection("users").insertOne({ userId, balance: 0, locked: 0, unlocked: 0 });
    return res.json({ balance: 0, locked: 0, unlocked: 0 });
  }

  res.json({
    balance: user.balance || 0,
    locked: user.locked || 0,
    unlocked: user.unlocked || 0
  });
});

export default router;

import express from "express";
import { getDb } from "../utils/database.js";

const router = express.Router();

// GET /api/history?userId=...
router.get("/", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const db = await getDb();
  const bets = await db.collection("bets")
    .find({ userId })
    .sort({ timestamp: -1 })
    .limit(30)
    .toArray();

  res.json(bets);
});

export default router;


import express from "express";
import { getDb } from "../utils/database.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, amount } = req.body;
  if (amount < 100) return res.status(400).json({ error: "Minimum deposit is 100" });

  const db = getDb();
  await db.collection("users").updateOne(
    { userId },
    { $inc: { balance: amount, locked: amount } },
    { upsert: true }
  );

  res.json({ success: true });
});

export default router;

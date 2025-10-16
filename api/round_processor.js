import { getDb } from "../utils/database.js";

const OWNER_ID = process.env.OWNER_ID;

export async function processBet(userId, color, amount) {
  const db = getDb();
  let user = await db.collection("users").findOne({ userId });

  if (!user) {
    await db.collection("users").insertOne({
      userId,
      balance: 0,
      locked: 0,
      unlocked: 0,
    });
    user = await db.collection("users").findOne({ userId });
  }

  if (amount > user.unlocked) {
    return { error: "Not enough unlocked balance" };
  }

  // Deduct from unlocked
  user.unlocked -= amount;
  user.locked -= amount;
  user.balance -= amount;

  // House edge 50% goes to owner
  const ownerEdge = amount * 0.5;
  await db.collection("users").updateOne(
    { userId: OWNER_ID },
    { $inc: { balance: ownerEdge } }
  );

  // 80% chance to lose
  const loseChance = Math.random() * 100;
  let result, winAmount = 0;

  if (loseChance <= 80) {
    result = "LOSE";
  } else {
    result = "WIN";
    if (color.toUpperCase() === "GRADIENT") {
      winAmount = amount * 4.5;
    } else {
      winAmount = amount * 1.8;
    }
    user.balance += winAmount;
    user.unlocked += winAmount;
  }

  // Update user
  await db.collection("users").updateOne(
    { userId },
    { $set: { balance: user.balance, locked: user.locked, unlocked: user.unlocked } }
  );

  // Log bet
  await db.collection("bets").insertOne({
    userId,
    color,
    amount,
    amountWonLoss: winAmount,
    result,
    timestamp: new Date(),
  });

  return { result, amountWonLoss: winAmount };
}

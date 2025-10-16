import { getUser, saveUser, getGlobalStats, saveGlobalStats } from '../utils/database.js';

export default async function handler(req, res) {
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { telegramId, amount } = req.body;

  const user = await getUser(telegramId);
  if(!user) return res.status(404).json({ error: "User not found" });

  const globalStats = getGlobalStats();
  const blockedAmount = amount * 0.9;
  const playableAmount = amount * 0.1;

  user.playable_balance += playableAmount;
  user.blocked_balance += blockedAmount;
  user.bonus_balance += amount * 0.05;

  globalStats.total_deposits_today += amount;
  globalStats.owner_earnings_target = globalStats.total_deposits_today * 0.5;

  await saveUser(user);
  saveGlobalStats(globalStats);

  res.status(200).json({ success: true, balances: user });
}

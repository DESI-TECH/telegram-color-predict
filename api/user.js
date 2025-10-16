import { getUser, saveUser } from '../utils/database.js';

export default async function handler(req, res) {
  const { telegramId } = req.body;
  if(!telegramId) return res.status(400).json({ error: "Telegram ID required" });

  if(req.method === "GET") {
    const user = await getUser(telegramId);
    if(!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({
      playable_balance: user.playable_balance,
      blocked_balance: user.blocked_balance,
      bonus_balance: user.bonus_balance,
      demo_balance: user.demo_balance
    });
  }

  if(req.method === "POST") {
    const { userData } = req.body;
    await saveUser(userData);
    res.status(200).json({ success: true });
  }
}

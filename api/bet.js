import { getUser, saveUser, getGlobalStats, saveGlobalStats } from '../utils/database.js';
import { controlledRandom } from '../utils/random.js';

export default async function handler(req, res) {
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { telegramId, betAmount, chosenColor, mode } = req.body;
  const user = await getUser(telegramId);
  if(!user) return res.status(404).json({ error: "User not found" });

  const globalStats = getGlobalStats();
  let outcome, payout;

  if(mode === "demo") {
    outcome = Math.random() < 0.8 ? chosenColor : ["red","green","gradient"].filter(c=>c!==chosenColor)[Math.floor(Math.random()*2)];
    payout = outcome === chosenColor ? betAmount * 0.8 : -betAmount;
    user.demo_balance += payout;
  } else {
    const normalWinProb = 0.5;
    const remainingGoal = globalStats.owner_earnings_target - globalStats.current_owner_earnings;
    const winProb = remainingGoal > 0 ? Math.max(0.1, normalWinProb * (remainingGoal / globalStats.total_bets_today || 1)) : normalWinProb;

    outcome = controlledRandom(winProb, chosenColor);
    payout = outcome === chosenColor ? betAmount * 1.8 : 0;

    if(betAmount <= user.playable_balance) {
      user.playable_balance += payout - betAmount;
    } else {
      let fromPlayable = user.playable_balance;
      let fromBlocked = betAmount - fromPlayable;
      user.playable_balance = 0;
      user.blocked_balance -= fromBlocked;
      user.playable_balance += payout;
    }

    globalStats.current_owner_earnings += betAmount - payout;
    globalStats.total_bets_today += betAmount;
    saveGlobalStats(globalStats);
  }

  await saveUser(user);
  res.status(200).json({ outcome, payout, balances: user });
}

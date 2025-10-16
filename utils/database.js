let usersDB = {};
let globalStats = { total_deposits_today:0, total_bets_today:0, current_owner_earnings:0, owner_earnings_target:0, date: new Date().toLocaleDateString() };

export async function getUser(telegramId) {
  if(!usersDB[telegramId]) usersDB[telegramId] = { playable_balance:0, blocked_balance:0, bonus_balance:0, demo_balance:5000 };
  return usersDB[telegramId];
}

export async function saveUser(user) {
  usersDB[user.telegramId] = user;
}

export function getGlobalStats() { return globalStats; }
export function saveGlobalStats(stats) { globalStats = stats; }
export function resetDailyStats() { globalStats.total_deposits_today=0; globalStats.total_bets_today=0; globalStats.current_owner_earnings=0; globalStats.date=new Date().toLocaleDateString(); }

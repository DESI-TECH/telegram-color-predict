// utils/database.js
// Simple in-memory database for demo and testing
// In production, replace with MongoDB, Firebase, or PostgreSQL

// Users stored by Telegram ID
let usersDB = {};

// Global stats
let globalStats = {
  total_deposits_today: 0,
  total_bets_today: 0,
  current_owner_earnings: 0,
  owner_earnings_target: 0,
  date: new Date().toLocaleDateString()
};

/**
 * Get user by Telegram ID
 * If user doesn't exist, create a new one
 */
export async function getUser(telegramId) {
  if (!usersDB[telegramId]) {
    usersDB[telegramId] = {
      telegramId,
      playable_balance: 0,
      blocked_balance: 0,
      bonus_balance: 0,
      demo_balance: 5000  // default demo balance
    };
  }
  return usersDB[telegramId];
}

/**
 * Save/update user
 */
export async function saveUser(user) {
  usersDB[user.telegramId] = user;
}

/**
 * Get global stats
 */
export function getGlobalStats() {
  // Reset stats if a new day
  const today = new Date().toLocaleDateString();
  if (globalStats.date !== today) {
    resetDailyStats();
  }
  return globalStats;
}

/**
 * Save global stats
 */
export function saveGlobalStats(stats) {
  globalStats = stats;
}

/**
 * Reset daily stats
 */
export function resetDailyStats() {
  globalStats.total_deposits_today = 0;
  globalStats.total_bets_today = 0;
  globalStats.current_owner_earnings = 0;
  globalStats.owner_earnings_target = 0;
  globalStats.date = new Date().toLocaleDateString();
}

/**
 * Optional: Get all users (for admin reports)
 */
export function getAllUsers() {
  return Object.values(usersDB);
}

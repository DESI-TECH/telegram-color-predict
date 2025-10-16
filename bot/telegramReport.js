import fetch from 'node-fetch';
import { getGlobalStats } from '../utils/database.js';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;

export async function sendDailyHouseEdgeReport() {
  const stats = getGlobalStats();
  const message = `📊 Daily House Edge Report\nDeposits: ${stats.total_deposits_today}\nBets: ${stats.total_bets_today}\nOwner Earnings: ${stats.current_owner_earnings}`;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ chat_id: OWNER_TELEGRAM_ID, text: message })
  });
}

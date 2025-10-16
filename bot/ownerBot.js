import TelegramBot from 'node-telegram-bot-api';
import { getGlobalStats, resetDailyStats } from '../utils/database.js';
import { getCriticalEventsSummary } from './critical.js';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_TELEGRAM_ID = process.env.OWNER_TELEGRAM_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling:true });

const ownerButtons = [
  [{ text: "Daily Report", callback_data:"daily_report" }],
  [{ text: "Critical Alerts", callback_data:"critical_alerts" }],
  [{ text: "Global Stats", callback_data:"global_stats" }],
  [{ text: "Reset Stats", callback_data:"reset_stats" }]
];

bot.on('message', msg=>{
  if(msg.chat.id != OWNER_TELEGRAM_ID) return;
  bot.sendMessage(OWNER_TELEGRAM_ID, "Owner Panel:", { reply_markup:{ inline_keyboard: ownerButtons } });
});

bot.on('callback_query', async query=>{
  const chatId = query.message.chat.id;
  if(chatId != OWNER_TELEGRAM_ID) return;

  switch(query.data){
    case "daily_report":
      const stats = getGlobalStats();
      bot.sendMessage(chatId, `📊 Daily Report\nDeposits: ${stats.total_deposits_today}\nBets: ${stats.total_bets_today}\nOwner Earnings: ${stats.current_owner_earnings}`);
      break;
    case "critical_alerts":
      const alerts = await getCriticalEventsSummary();
      bot.sendMessage(chatId, `⚠️ Critical Alerts:\n${alerts.join("\n") || "No alerts today."}`);
      break;
    case "global_stats":
      const g = getGlobalStats();
      bot.sendMessage(chatId, `🌐 Global Stats:\nDeposits: ${g.total_deposits_today}\nBets: ${g.total_bets_today}\nOwner Earnings: ${g.current_owner_earnings}`);
      break;
    case "reset_stats":
      resetDailyStats();
      bot.sendMessage(chatId, "✅ Daily stats reset.");
      break;
  }
});

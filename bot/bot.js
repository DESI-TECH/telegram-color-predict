import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { getDb } from "../utils/database.js";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = parseInt(process.env.OWNER_ID);
const API_URL = process.env.API_URL; // e.g., https://your-vercel-app.vercel.app/api

if (!BOT_TOKEN) throw new Error("BOT_TOKEN not set in .env");
if (!OWNER_ID) throw new Error("OWNER_ID not set in .env");
if (!API_URL) throw new Error("API_URL not set in .env");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const ownerKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "Total Bets", callback_data: "owner_total_bets" }],
      [{ text: "House Edge", callback_data: "owner_house_edge" }],
      [{ text: "Critical Reports", callback_data: "owner_critical_reports" }],
    ],
  },
};

const colorsKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Red", callback_data: "bet_red" },
        { text: "Green", callback_data: "bet_green" },
        { text: "Gradient", callback_data: "bet_gradient" },
      ],
    ],
  },
};

const amountKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "10", callback_data: "amt_10" },
        { text: "50", callback_data: "amt_50" },
        { text: "100", callback_data: "amt_100" },
      ],
    ],
  },
};

const userStates = {}; // temp store selected color/amount

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (msg.from.id === OWNER_ID) {
    bot.sendMessage(chatId, "Welcome, Owner!", ownerKeyboard);
  } else {
    bot.sendMessage(chatId, "Welcome! Select a color to bet:", colorsKeyboard);
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const userId = query.from.id.toString();

  if (query.from.id === OWNER_ID) {
    // Owner actions
    if (data === "owner_total_bets") {
      const db = await getDb();
      const totalBets = await db.collection("bets").countDocuments();
      bot.sendMessage(chatId, `Total Bets Placed: ${totalBets}`);
    } else if (data === "owner_house_edge") {
      const db = await getDb();
      const agg = await db
        .collection("users")
        .aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }])
        .toArray();
      const totalHouseEdge = agg[0]?.total || 0;
      bot.sendMessage(chatId, `Total House Edge: ${totalHouseEdge}`);
    } else if (data === "owner_critical_reports") {
      const db = await getDb();
      const reports = await db
        .collection("critical_reports")
        .find()
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray();
      if (reports.length === 0) {
        bot.sendMessage(chatId, "No critical reports yet.");
      } else {
        let msgText = "Last 5 Critical Reports:\n\n";
        reports.forEach((r) => {
          msgText += `${r.timestamp.toLocaleString()}: ${r.message}\n`;
        });
        bot.sendMessage(chatId, msgText);
      }
    }
    return;
  }

  // User actions
  if (data.startsWith("bet_")) {
    const color = data.split("_")[1];
    userStates[userId] = { ...userStates[userId], color };
    bot.sendMessage(chatId, `Selected color: ${color}. Now select amount:`, amountKeyboard);
  } else if (data.startsWith("amt_")) {
    const amount = parseInt(data.split("_")[1]);
    const color = userStates[userId]?.color;
    if (!color) {
      bot.sendMessage(chatId, "Please select a color first.", colorsKeyboard);
      return;
    }

    // Call API to place bet
    try {
      const res = await fetch(`${API_URL}/round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, color, amount }),
      });
      const result = await res.json();
      if (result.error) {
        bot.sendMessage(chatId, `❌ Error: ${result.error}`);
      } else {
        bot.sendMessage(
          chatId,
          `Bet Result: ${result.result}\nAmount Won/Loss: ${result.amountWonLoss}`
        );
      }
    } catch (err) {
      bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }
});

console.log("🤖 Telegram bot is running...");

export default bot;

import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  const update = req.body;

  if (!update.message) return res.sendStatus(200);

  const chatId = update.message.chat.id;
  const text = update.message.text;

  if (text === "/start") {
    await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: "🎮 Welcome to Color Prediction Game! Click below to start.",
      reply_markup: {
        inline_keyboard: [
          [{ text: "▶️ Open Game", web_app: { url: "https://your-vercel-app.vercel.app" } }]
        ]
      }
    });
  }

  res.sendStatus(200);
});

export default router;

const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token);
bot.setWebHook(`${process.env.VERCEL_URL}/api/webhook`);

const app = express();
app.use(bodyParser.json());

app.post("/api/webhook", (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.listen(3000, () => console.log("Webhook server is running"));

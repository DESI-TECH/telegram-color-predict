const TelegramBot = require('node-telegram-bot-api');
function betConfirmKeyboard(userId) {
return {
reply_markup: {
inline_keyboard: [[{ text: '💰 Place Bet', callback_data: `bet_${userId}` }]]
}
};
}


// --- Handlers ---
bot.onText(/\/start/, (msg) => {
bot.sendMessage(msg.chat.id, `🎨 Welcome to Color Prediction Game!\nSelect a color:`, colorKeyboard());
});


// Temporary user state for demo
let userStates = {}; // { userId: { color: 'red', amount: 10, mode: 'demo' } }


bot.on('callback_query', (query) => {
const userId = query.from.id;
const data = query.data;


if (!userStates[userId]) userStates[userId] = { mode: 'demo' }; // default demo mode


if (data.startsWith('color_')) {
const color = data.split('_')[1];
userStates[userId].color = color;
bot.sendMessage(userId, `Selected color: ${COLOR_DOTS[color]}\nNow select amount:`, amountKeyboard());
} else if (data.startsWith('amount_')) {
const amount = parseInt(data.split('_')[1]);
userStates[userId].amount = amount;
bot.sendMessage(userId, `Selected amount: ${amount}\nPress below to confirm bet:`, betConfirmKeyboard(userId));
} else if (data.startsWith('bet_')) {
if (!bettingOpen) {
bot.answerCallbackQuery(query.id, { text: '❌ Betting is closed for this round.' });
return;
}
const uid = parseInt(data.split('_')[1]);
const state = userStates[uid];
if (!state || !state.color || !state.amount) {
bot.answerCallbackQuery(query.id, { text: '❌ Please select color and amount first.' });
return;
}
bets[uid] = state;
bot.answerCallbackQuery(query.id, { text: `✅ Bet placed: ${COLOR_DOTS[state.color]} - ${state.amount}` });
bot.sendMessage(uid, `✅ Bet confirmed! Waiting for result...`);
}
});


// --- Express Webhook for Vercel ---
app.post('/api/webhook', (req, res) => {
bot.processUpdate(req.body);
res.sendStatus(200);
});


app.get('/', (req, res) => res.send('Bot is running'));


// --- Start Server and Initial Round ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
startNewRound();
});

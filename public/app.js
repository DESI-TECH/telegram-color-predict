import { getUser, saveUser, getGlobalStats, saveGlobalStats } from '../utils/database.js';
import { demoOutcome, realOutcome } from '../utils/random.js';
import { convertAmount, formatCurrency } from '../utils/currency.js';

let mode = "demo"; // "demo" or "real"
let demoBalance = 5000;
let timer = 10;

// Simulated user country (replace with actual detection)
let userCountry = window.USER_COUNTRY || "IN"; // e.g., "IN", "US", "NP"

// Elements
const balanceEl = document.getElementById('balance');
const timerEl = document.getElementById('timer');
const resultEl = document.getElementById('result');

// Format balance for display
function displayBalance(amount) {
  const converted = convertAmount(amount, userCountry);
  return formatCurrency(converted, userCountry);
}

// Update balance display
async function updateBalance() {
  if (mode === "demo") {
    balanceEl.innerText = `Balance: ${displayBalance(demoBalance)} (Demo)`;
  } else {
    const user = await getUser(window.USER_TELEGRAM_ID);
    balanceEl.innerText = `Balance: ${displayBalance(user.playable_balance)}`;
  }
}

// Timer countdown
setInterval(() => {
  timer--;
  if (timer <= 0) {
    timer = 10;
    resultEl.innerText = "Time's up! Make your choice.";
  }
  timerEl.innerText = `Time: ${timer}s`;
}, 1000);

// Play function
async function play(chosenColor) {
  let outcome, payout;

  if (mode === "demo") {
    outcome = demoOutcome(chosenColor); // 80% win
    payout = outcome === chosenColor ? 100 : -50;
    demoBalance += payout;
    resultEl.innerText = `You chose ${chosenColor}, outcome: ${outcome}, payout: ${displayBalance(payout)}`;
    updateBalance();
  } else {
    const user = await getUser(window.USER_TELEGRAM_ID);
    if (user.playable_balance < 10) {
      resultEl.innerText = "Insufficient balance!";
      return;
    }

    // Controlled outcome based on house edge
    const stats = getGlobalStats();
    const ownerTarget = stats.owner_earnings_target || 0.5; // 50% default
    const winProb = 1 - ownerTarget; // User chance to win

    outcome = realOutcome(chosenColor, winProb);

    // Payout calculation
    if (chosenColor === "gradient") {
      payout = outcome === chosenColor ? 40 : -10;
    } else {
      payout = outcome === chosenColor ? 18 : -10;
    }

    // Update user balances
    user.playable_balance += payout - 10; // deduct bet
    await saveUser(user);

    // Update global stats
    stats.total_bets_today += 10;
    stats.current_owner_earnings += outcome === chosenColor ? -payout + 10 : 10;
    saveGlobalStats(stats);

    resultEl.innerText = `You chose ${chosenColor}, outcome: ${outcome}, payout: ${displayBalance(payout)}`;
    updateBalance();
  }
}

// Attach buttons
document.querySelectorAll('#colors button').forEach(btn => {
  btn.addEventListener('click', () => play(btn.className));
});

// Initialize display
updateBalance();

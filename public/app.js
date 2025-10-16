const API_URL = "/api"; // Vercel deployment will route properly

let selectedColor = null;
let selectedAmount = null;
let balance = 0;
let isOwner = false; // Set true if userId === OWNER_ID

const balanceEl = document.getElementById("balance");
const ownerDashboardBtn = document.getElementById("owner-dashboard-btn");
const placeBetBtn = document.getElementById("place-bet-btn");
const betHistoryEl = document.getElementById("bet-history");
const timerEl = document.getElementById("timer");

// Color selection
document.querySelectorAll(".color-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedColor = btn.dataset.color;
    checkBetReady();
  });
});

// Amount selection
document.querySelectorAll(".amount-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedAmount = parseInt(btn.dataset.amount);
    checkBetReady();
  });
});

// Enable place bet if color & amount selected
function checkBetReady() {
  placeBetBtn.disabled = !(selectedColor && selectedAmount);
}

// Place Bet
placeBetBtn.addEventListener("click", async () => {
  if (!selectedColor || !selectedAmount) return;
  try {
    const res = await fetch(`${API_URL}/round`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: localStorage.getItem("userId") || Math.floor(Math.random()*1000000),
        color: selectedColor,
        amount: selectedAmount
      })
    });
    const data = await res.json();
    if (data.error) {
      alert("Error: " + data.error);
    } else {
      balance += data.amountWonLoss; // update for demo; real value comes from API
      updateBalance();
      addBetHistory(data.result, selectedColor, selectedAmount, data.amountWonLoss);
    }
  } catch(e) {
    console.error(e);
  }
  // Reset selections
  selectedColor = null;
  selectedAmount = null;
  placeBetBtn.disabled = true;
});

// Update balance
function updateBalance() {
  balanceEl.innerText = balance;
}

// Add to bet history
function addBetHistory(result, color, amount, wonLoss) {
  const li = document.createElement("li");
  li.innerText = `${result} | Color: ${color} | Bet: ${amount} | Won/Loss: ${wonLoss}`;
  betHistoryEl.prepend(li);
}

// Owner dashboard button
if (isOwner) ownerDashboardBtn.style.display = "inline-block";

// Round timer
let countdown = 30;
setInterval(() => {
  countdown--;
  if (countdown < 0) countdown = 30;
  const minutes = Math.floor(countdown/60).toString().padStart(2,"0");
  const seconds = (countdown%60).toString().padStart(2,"0");
  timerEl.innerText = `${minutes}:${seconds}`;
}, 1000);

// Initial fetch wallet & history
async function fetchWallet() {
  const userId = localStorage.getItem("userId") || Math.floor(Math.random()*1000000);
  localStorage.setItem("userId", userId);
  try {
    const res = await fetch(`${API_URL}/balance?userId=${userId}`);
    const data = await res.json();
    balance = data.balance || 0;
    updateBalance();
  } catch(e) {
    console.error(e);
  }
}

fetchWallet();


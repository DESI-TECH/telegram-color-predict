import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

// Import API routes
import depositRoute from "./api/deposit.js";
import withdrawRoute from "./api/withdraw.js";
import transactionsRoute from "./api/transactions.js";
import ownerRoute from "./api/owner.js";
import roundRoute from "./api/round_processor.js";

// Import Telegram bot
import bot from "./bot/bot.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Serve front-end

// Routes
app.use("/api/deposit", depositRoute);
app.use("/api/withdraw", withdrawRoute);
app.use("/api/transactions", transactionsRoute);
app.use("/api/owner", ownerRoute);
app.use("/api/round", async (req, res) => {
  // Use round_processor.js function
  const { userId, color, amount } = req.body;
  try {
    const result = await roundRoute.processBet(userId, color, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

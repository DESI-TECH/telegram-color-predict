import express from "express";
import { spawn } from "child_process";

const router = express.Router();

// POST /api/round
// body: { userId: "123", color: "RED", amount: 100 }
router.post("/", async (req, res) => {
  const { userId, color, amount } = req.body;

  if (!userId || !color || !amount) {
    return res.status(400).json({ error: "userId, color, and amount are required" });
  }

  // Spawn Python process
  const py = spawn("python3", ["./api/round_processor.py"]);

  let output = "";
  let errorOutput = "";

  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  py.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  py.on("close", (code) => {
    if (errorOutput) {
      return res.status(500).json({ error: errorOutput });
    }

    try {
      const result = JSON.parse(output);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Invalid Python output" });
    }
  });

  // Send input to Python
  const input = JSON.stringify({ userId, color, amount });
  py.stdin.write(input);
  py.stdin.end();
});

export default router;

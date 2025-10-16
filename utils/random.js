// utils/random.js

/**
 * Returns a controlled random outcome
 * @param {number} winProb - Probability of user winning (0 to 1)
 * @param {string} chosenColor - The color user chose ("red","green","gradient")
 * @returns {string} outcome color
 */
export function controlledRandom(winProb, chosenColor) {
  const rand = Math.random();
  
  // User wins
  if (rand < winProb) {
    return chosenColor;
  }

  // User loses → pick one of the other colors
  const others = ["red", "green", "gradient"].filter(c => c !== chosenColor);
  return others[Math.floor(Math.random() * others.length)];
}

/**
 * Returns a random color (for demo/test purposes)
 */
export function randomColor() {
  const colors = ["red", "green", "gradient"];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Demo mode probability helper
 * User wins ~80% of the time
 */
export function demoOutcome(chosenColor) {
  return controlledRandom(0.8, chosenColor);
}

/**
 * Real-money mode probability helper
 * Adjust probability dynamically based on house edge or owner target
 * @param {string} chosenColor 
 * @param {number} winProb - e.g., 0.5 for 50%
 */
export function realOutcome(chosenColor, winProb = 0.5) {
  return controlledRandom(winProb, chosenColor);
}


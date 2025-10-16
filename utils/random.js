export function controlledRandom(winProb, chosenColor) {
  const rand = Math.random();
  if(rand < winProb) return chosenColor;
  const others = ["red","green","gradient"].filter(c=>c!==chosenColor);
  return others[Math.floor(Math.random()*2)];
}

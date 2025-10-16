let demoBalance = 5000;
let timer = 10;
function play(color){
  let outcome = Math.random()<0.8 ? color : ["red","green","gradient"].filter(c=>c!==color)[Math.floor(Math.random()*2)];
  let payout = outcome===color ? 100 : -50;
  demoBalance += payout;
  document.getElementById('balance').innerText = `Balance: ${demoBalance}`;
  document.getElementById('result').innerText = `You chose ${color}, outcome: ${outcome}, payout: ${payout}`;
}
setInterval(()=>{ timer--; if(timer<=0) timer=10; document.getElementById('timer').innerText=`Time: ${timer}s`; },1000);

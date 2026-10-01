const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. In fetchRealBalance, keep exact formatEther string and store numeric with full float
code = code.replace(
  'const formatted = parseFloat(formatEther(rawBalance));',
  'const exactEtherStr = formatEther(rawBalance); const formatted = parseFloat(exactEtherStr);'
);

// 2. In L1 GAS display, show 5 decimal places so 45.08467 MON matches MonadVision exactly!
code = code.replace(
  '{onchainWalletBalance.toFixed(4)} MON',
  '{onchainWalletBalance.toFixed(5)} MON'
);

// 3. In PERP MARGIN and Cockpit, also display with 5 decimal places for full exactness
code = code.replace(
  '{userBalance.toFixed(4)} MON',
  '{userBalance.toFixed(5)} MON'
);

code = code.replace(
  'BAL: {userBalance.toFixed(4)} MON',
  'BAL: {userBalance.toFixed(5)} MON'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated decimal places to 5 (45.08467 MON)!');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace .toFixed(2) with .toFixed(4) for exact precision matching blockchain explorers
code = code.replace(
  '{onchainWalletBalance.toFixed(2)} MON',
  '{onchainWalletBalance.toFixed(4)} MON'
);

code = code.replace(
  '{userBalance.toFixed(typeof userBalance === \'number\' && userBalance < 10 ? 4 : 2)} MON',
  '{userBalance.toFixed(4)} MON'
);

code = code.replace(
  'BAL: {userBalance.toFixed(typeof userBalance === \'number\' && userBalance < 10 ? 4 : 2)} MON',
  'BAL: {userBalance.toFixed(4)} MON'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated balance display to 4 decimal precision!');

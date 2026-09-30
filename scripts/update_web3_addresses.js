const fs = require('fs');
const path = require('path');

const web3Path = path.join(__dirname, '..', 'frontend', 'lib', 'web3.js');
let code = fs.readFileSync(web3Path, 'utf8');

// Update contract addresses to freshly deployed S-Tier addresses
code = code.replace(
  'market: process.env.NEXT_PUBLIC_MARKET_ADDRESS || "0xca45eee4bEc9B4dE2fFCD82C6d36eFB524A02176",',
  'market: process.env.NEXT_PUBLIC_MARKET_ADDRESS || "0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5",'
);

code = code.replace(
  'oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || "0x9438B88C0BcF1dD58AA0F86D5C1a7761b5D39AAC",',
  'oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || "0xc547C6f06495690cEd525EDd8Eaf4C17484b0C39",'
);

code = code.replace(
  '"MON/USD": process.env.NEXT_PUBLIC_MARKET_MON || "0xca45eee4bEc9B4dE2fFCD82C6d36eFB524A02176",',
  '"MON/USD": process.env.NEXT_PUBLIC_MARKET_MON || "0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5",'
);

fs.writeFileSync(web3Path, code, 'utf8');
console.log('Successfully updated web3.js with new S-Tier live contract addresses!');

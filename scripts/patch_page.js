const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Initial priceHistory: 24 points so bars fill nicely from the beginning
code = code.replace(
  'const [priceHistory, setPriceHistory] = useState([4.275, 4.278, 4.281, 4.285, 4.282, 4.288, 4.285]);',
  'const [priceHistory, setPriceHistory] = useState(() => Array.from({ length: 24 }, (_, i) => +(4.270 + Math.sin(i / 3) * 0.015 + (i * 0.0006)).toFixed(4)));'
);

// 2. Fix the price update and history tracking
code = code.replace(
  'setPriceHistory((hist) => [...hist.slice(-24), next]);',
  'setPriceHistory((hist) => [...hist.slice(-23), next]);'
);

// 3. Fix the price display
code = code.replace(
  '<span className="text-5xl font-mono font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">\r\n                    \r\n                  </span>',
  '<span className="text-5xl font-mono font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">\r\n                    {"$" + monPrice.toFixed(4)}\r\n                  </span>'
);
code = code.replace(
  '<span className="text-5xl font-mono font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">\n                    \n                  </span>',
  '<span className="text-5xl font-mono font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">\n                    {"$" + monPrice.toFixed(4)}\n                  </span>'
);

// 4. Dynamic min/max height calculation for the sparkline bars
// Notice in the file: heightPercent: Math.min(100, Math.max(18, ((val - 4.27) / 0.03) * 100))
code = code.replace(
  'const heightPercent = Math.min(100, Math.max(18, ((val - 4.27) / 0.03) * 100));',
  'const minP = Math.min(...priceHistory); const maxP = Math.max(...priceHistory); const spread = Math.max(0.005, maxP - minP); const heightPercent = Math.min(95, Math.max(20, Math.round(((val - minP) / spread) * 75 + 15)));'
);

// 5. Fix Entry Price, Mark Price in HUD
code = code.replace(
  '<div className="text-slate-400 mb-1">Entry Price:</div>\r\n                  <div className="text-base font-bold text-white"></div>',
  '<div className="text-slate-400 mb-1">Entry Price:</div>\r\n                  <div className="text-base font-bold text-white">{"$" + activePosition.entryPrice.toFixed(4)}</div>'
);
code = code.replace(
  '<div className="text-slate-400 mb-1">Entry Price:</div>\n                  <div className="text-base font-bold text-white"></div>',
  '<div className="text-slate-400 mb-1">Entry Price:</div>\n                  <div className="text-base font-bold text-white">{"$" + activePosition.entryPrice.toFixed(4)}</div>'
);

code = code.replace(
  '<div className="text-slate-400 mb-1">Mark Price:</div>\r\n                  <div className="text-base font-bold text-cyan-300"></div>',
  '<div className="text-slate-400 mb-1">Mark Price:</div>\r\n                  <div className="text-base font-bold text-cyan-300">{"$" + monPrice.toFixed(4)}</div>'
);
code = code.replace(
  '<div className="text-slate-400 mb-1">Mark Price:</div>\n                  <div className="text-base font-bold text-cyan-300"></div>',
  '<div className="text-slate-400 mb-1">Mark Price:</div>\n                  <div className="text-base font-bold text-cyan-300">{"$" + monPrice.toFixed(4)}</div>'
);

// 6. Fix Position Notional, Est Liq Long, Est Liq Short in Cockpit
code = code.replace(
  '<span className="text-slate-400">Position Notional:</span>\r\n                  <span className="font-bold text-white"> USD</span>',
  '<span className="text-slate-400">Position Notional:</span>\r\n                  <span className="font-bold text-white">{"$" + (notionalSize * monPrice).toFixed(2) + " USD"}</span>'
);
code = code.replace(
  '<span className="text-slate-400">Position Notional:</span>\n                  <span className="font-bold text-white"> USD</span>',
  '<span className="text-slate-400">Position Notional:</span>\n                  <span className="font-bold text-white">{"$" + (notionalSize * monPrice).toFixed(2) + " USD"}</span>'
);

code = code.replace(
  '<span className="text-slate-400">Est. Liq Price (Long):</span>\r\n                  <span className="font-bold text-emerald-400"></span>',
  '<span className="text-slate-400">Est. Liq Price (Long):</span>\r\n                  <span className="font-bold text-emerald-400">{"$" + liqPriceLong.toFixed(4)}</span>'
);
code = code.replace(
  '<span className="text-slate-400">Est. Liq Price (Long):</span>\n                  <span className="font-bold text-emerald-400"></span>',
  '<span className="text-slate-400">Est. Liq Price (Long):</span>\n                  <span className="font-bold text-emerald-400">{"$" + liqPriceLong.toFixed(4)}</span>'
);

code = code.replace(
  '<span className="text-slate-400">Est. Liq Price (Short):</span>\r\n                  <span className="font-bold text-rose-400"></span>',
  '<span className="text-slate-400">Est. Liq Price (Short):</span>\r\n                  <span className="font-bold text-rose-400">{"$" + liqPriceShort.toFixed(4)}</span>'
);
code = code.replace(
  '<span className="text-slate-400">Est. Liq Price (Short):</span>\n                  <span className="font-bold text-rose-400"></span>',
  '<span className="text-slate-400">Est. Liq Price (Short):</span>\n                  <span className="font-bold text-rose-400">{"$" + liqPriceShort.toFixed(4)}</span>'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched page.jsx');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Initialize tradeHistory with lazy initialization from localStorage
const oldTradeHistoryState = `  const [tradeHistory, setTradeHistory] = useState([
    {
      id: 881,
      type: "LONG",
      leverage: 10,
      margin: 10,
      entryPrice: 4.272,
      exitPrice: 4.285,
      funding: -0.0018,
      pnl: 3.04,
      pnlPercent: "+30.4%",
      isWin: true,
      time: "2 mins ago"
    },
    {
      id: 880,
      type: "SHORT",
      leverage: 10,
      margin: 10,
      entryPrice: 4.291,
      exitPrice: 4.272,
      funding: 0.0012,
      pnl: 4.42,
      pnlPercent: "+44.2%",
      isWin: true,
      time: "4 mins ago"
    }
  ]);`;

const newTradeHistoryState = `  const defaultHistory = [
    {
      id: 881,
      type: "LONG",
      leverage: 10,
      margin: 10,
      entryPrice: 4.272,
      exitPrice: 4.285,
      funding: -0.0018,
      pnl: 3.04,
      pnlPercent: "+30.4%",
      isWin: true,
      time: "2 mins ago"
    },
    {
      id: 880,
      type: "SHORT",
      leverage: 10,
      margin: 10,
      entryPrice: 4.291,
      exitPrice: 4.272,
      funding: 0.0012,
      pnl: 4.42,
      pnlPercent: "+44.2%",
      isWin: true,
      time: "4 mins ago"
    }
  ];

  const [tradeHistory, setTradeHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flux_trade_history");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultHistory;
  });`;

code = code.replace(oldTradeHistoryState, newTradeHistoryState);

// 2. Persist tradeHistory into localStorage whenever a trade is closed
code = code.replace(
  '    setTradeHistory((prev) => [historyEntry, ...prev.slice(0, 5)]);',
  `    setTradeHistory((prev) => {
      const updated = [historyEntry, ...prev.slice(0, 9)];
      if (typeof window !== "undefined") {
        localStorage.setItem("flux_trade_history", JSON.stringify(updated));
      }
      return updated;
    });`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully enabled persistent trade history in localStorage!');

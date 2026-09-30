const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Initialize tradeHistory with defaultHistory unconditionally (to match server HTML)
const oldInit = `  const [tradeHistory, setTradeHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flux_trade_history");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultHistory;
  });`;

const newInit = `  const [tradeHistory, setTradeHistory] = useState(defaultHistory);
  const [mounted, setMounted] = useState(false);`;

code = code.replace(oldInit, newInit);

// 2. Hydrate from localStorage safely in useEffect after mount
const oldMountEffect = `  // Auto-detect wallet if already authorized and listen to account/chain switches
  useEffect(() => {`;

const newMountEffect = `  // Hydrate persistent trade history after client mount (fixes SSR hydration mismatch)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flux_trade_history");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTradeHistory(parsed);
          }
        } catch (e) {
          console.warn("Could not parse saved history:", e);
        }
      }
    }
  }, []);

  // Auto-detect wallet if already authorized and listen to account/chain switches
  useEffect(() => {`;

code = code.replace(oldMountEffect, newMountEffect);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully eliminated hydration mismatch in page.jsx!');

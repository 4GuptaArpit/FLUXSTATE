const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Separate state for sandboxBalance and testnetBalance
code = code.replace(
  `  const [userBalance, setUserBalance] = useState(1000.0);
  const [onchainWalletBalance, setOnchainWalletBalance] = useState(null);
  const [isPilotMode, setIsPilotMode] = useState(true);
  const [is1ClickTrading, setIs1ClickTrading] = useState(true);
  const [activePosition, setActivePosition] = useState(null);`,
  `  const [userBalance, setUserBalance] = useState(1000.0);
  const [sandboxBalance, setSandboxBalance] = useState(1000.0);
  const [testnetMarginBalance, setTestnetMarginBalance] = useState(0.0);
  const [onchainWalletBalance, setOnchainWalletBalance] = useState(null);
  const [isPilotMode, setIsPilotMode] = useState(false);
  const [is1ClickTrading, setIs1ClickTrading] = useState(true);
  const [activePosition, setActivePosition] = useState(null);
  const [sandboxHistory, setSandboxHistory] = useState([]);
  const [testnetHistory, setTestnetHistory] = useState([]);`
);

// 2. Separate persistence helpers
const oldFetchLogic = `  // Fetch real onchain MON balance and synchronize persistent margin account
  const fetchRealBalance = async (address) => {
    try {
      const publicClient = getPublicClient();
      const rawBalance = await publicClient.getBalance({ address });
      const formatted = parseFloat(formatEther(rawBalance));
      setOnchainWalletBalance(formatted);
      setIsPilotMode(false);

      // Check if user already has an active trading account balance saved locally
      if (typeof window !== "undefined") {
        const savedAccountBal = localStorage.getItem("flux_margin_balance_" + address.toLowerCase());
        if (savedAccountBal !== null) {
          const parsed = parseFloat(savedAccountBal);
          if (!isNaN(parsed)) {
            setUserBalance(parsed);
            return;
          }
        }
      }
      // If first time connecting, initialize margin account with their wallet balance
      setUserBalance(formatted);
      if (typeof window !== "undefined") {
        localStorage.setItem("flux_margin_balance_" + address.toLowerCase(), formatted.toString());
      }
    } catch (err) {
      console.warn("Could not fetch onchain balance:", err);
    }
  };

  // Helper to persist updated trading margin balance
  const updateTradingBalance = (newBal) => {
    setUserBalance(newBal);
    if (typeof window !== "undefined" && walletAddress) {
      localStorage.setItem("flux_margin_balance_" + walletAddress.toLowerCase(), newBal.toString());
    } else if (typeof window !== "undefined") {
      localStorage.setItem("flux_margin_balance_pilot", newBal.toString());
    }
  };`;

const newFetchLogic = `  // Fetch real onchain MON balance and synchronize persistent margin account
  const fetchRealBalance = async (address) => {
    try {
      const publicClient = getPublicClient();
      const rawBalance = await publicClient.getBalance({ address });
      const formatted = parseFloat(formatEther(rawBalance));
      setOnchainWalletBalance(formatted);

      if (typeof window !== "undefined") {
        const savedTestnetBal = localStorage.getItem("flux_testnet_margin_" + address.toLowerCase());
        if (savedTestnetBal !== null) {
          const parsed = parseFloat(savedTestnetBal);
          if (!isNaN(parsed)) {
            setTestnetMarginBalance(parsed);
            if (!isPilotMode) setUserBalance(parsed);
            return;
          }
        }
      }
      // Default to their wallet balance for live trading
      setTestnetMarginBalance(formatted);
      if (!isPilotMode) setUserBalance(formatted);
      if (typeof window !== "undefined") {
        localStorage.setItem("flux_testnet_margin_" + address.toLowerCase(), formatted.toString());
      }
    } catch (err) {
      console.warn("Could not fetch onchain balance:", err);
    }
  };

  // Helper to persist updated trading margin balance per mode
  const updateTradingBalance = (newBal) => {
    setUserBalance(newBal);
    if (typeof window !== "undefined") {
      if (isPilotMode) {
        setSandboxBalance(newBal);
        localStorage.setItem("flux_sandbox_margin", newBal.toString());
      } else if (walletAddress) {
        setTestnetMarginBalance(newBal);
        localStorage.setItem("flux_testnet_margin_" + walletAddress.toLowerCase(), newBal.toString());
      }
    }
  };

  // Switch between Pilot Sandbox and Live Testnet modes cleanly
  const toggleMode = (targetIsPilot) => {
    setIsPilotMode(targetIsPilot);
    if (targetIsPilot) {
      setUserBalance(sandboxBalance);
    } else {
      if (walletAddress) {
        setUserBalance(testnetMarginBalance > 0 ? testnetMarginBalance : (onchainWalletBalance || 0));
        fetchRealBalance(walletAddress);
      } else {
        handleConnectWallet();
      }
    }
  };`;

code = code.replace(oldFetchLogic, newFetchLogic);

// 3. Hydrate separate histories and balances on mount
const oldHydrate = `  // Hydrate persistent trade history after client mount (fixes SSR hydration mismatch)
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
  }, []);`;

const newHydrate = `  // Hydrate persistent trade history and sandbox balances after client mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      // Hydrate sandbox balance
      const savedSandBal = localStorage.getItem("flux_sandbox_margin");
      if (savedSandBal !== null) {
        const p = parseFloat(savedSandBal);
        if (!isNaN(p)) setSandboxBalance(p);
      }

      // Hydrate sandbox history
      const savedSandHist = localStorage.getItem("flux_sandbox_history");
      if (savedSandHist) {
        try {
          const parsed = JSON.parse(savedSandHist);
          if (Array.isArray(parsed)) setSandboxHistory(parsed);
        } catch (e) {}
      } else {
        setSandboxHistory(defaultHistory);
      }

      // Hydrate testnet history
      const savedTestHist = localStorage.getItem("flux_testnet_history");
      if (savedTestHist) {
        try {
          const parsed = JSON.parse(savedTestHist);
          if (Array.isArray(parsed)) setTestnetHistory(parsed);
        } catch (e) {}
      }
    }
  }, []);`;

code = code.replace(oldHydrate, newHydrate);

// 4. Update trade saving in handleClosePosition
const oldSaveHistory = `    setTradeHistory((prev) => {
      const updated = [historyEntry, ...prev.slice(0, 9)];
      if (typeof window !== "undefined") {
        localStorage.setItem("flux_trade_history", JSON.stringify(updated));
      }
      return updated;
    });`;

const newSaveHistory = `    if (isPilotMode) {
      setSandboxHistory((prev) => {
        const updated = [historyEntry, ...prev.slice(0, 9)];
        if (typeof window !== "undefined") {
          localStorage.setItem("flux_sandbox_history", JSON.stringify(updated));
        }
        return updated;
      });
    } else {
      setTestnetHistory((prev) => {
        const updated = [historyEntry, ...prev.slice(0, 9)];
        if (typeof window !== "undefined") {
          localStorage.setItem("flux_testnet_history", JSON.stringify(updated));
        }
        return updated;
      });
    }`;

code = code.replace(oldSaveHistory, newSaveHistory);

// 5. Update Navbar Mode Toggle
const oldNavPill = `          {/* Mode Pill Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-mono text-xs cursor-pointer select-none transition-all duration-300"
            onClick={() => {
              if (isPilotMode && !walletAddress) {
                handleConnectWallet();
              } else {
                setIsPilotMode(!isPilotMode);
                if (!isPilotMode) setUserBalance(1000.0);
                else if (walletAddress) fetchRealBalance(walletAddress);
              }
            }}
            title="Click to toggle between Live Testnet and Pilot Sandbox Mode"
          >
            <span className={"w-2 h-2 rounded-full " + (isPilotMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping")} />
            <span className={isPilotMode ? "text-amber-300 font-bold" : "text-emerald-300 font-bold"}>
              {isPilotMode ? "PILOT SANDBOX" : "LIVE TESTNET"}
            </span>
          </div>`;

const newNavPill = `          {/* Mode Pill Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-mono text-xs cursor-pointer select-none transition-all duration-300"
            onClick={() => toggleMode(!isPilotMode)}
            title="Click to switch environments: Live Testnet (Onchain) vs Pilot Sandbox"
          >
            <span className={"w-2 h-2 rounded-full " + (isPilotMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping")} />
            <span className={isPilotMode ? "text-amber-300 font-bold" : "text-emerald-300 font-bold"}>
              {isPilotMode ? "PILOT SANDBOX" : "LIVE TESTNET"}
            </span>
          </div>`;

code = code.replace(oldNavPill, newNavPill);

// 6. Active ledger selection based on mode
code = code.replace(
  '{tradeHistory.map((trade, idx) => (',
  '{(isPilotMode ? sandboxHistory : testnetHistory).map((trade, idx) => ('
);

// 7. Status badge differentiation in table
code = code.replace(
  '<span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">\r\n                          SETTLED\r\n                        </span>',
  `<span className={"text-[10px] px-2 py-0.5 rounded border " + (
                          isPilotMode 
                            ? "text-amber-300 bg-amber-950/60 border-amber-500/30" 
                            : "text-emerald-300 bg-emerald-950/60 border-emerald-500/30"
                        )}>
                          {isPilotMode ? "SIMULATED" : "ONCHAIN MINED"}
                        </span>`
);
code = code.replace(
  '<span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">\n                          SETTLED\n                        </span>',
  `<span className={"text-[10px] px-2 py-0.5 rounded border " + (
                          isPilotMode 
                            ? "text-amber-300 bg-amber-950/60 border-amber-500/30" 
                            : "text-emerald-300 bg-emerald-950/60 border-emerald-500/30"
                        )}>
                          {isPilotMode ? "SIMULATED" : "ONCHAIN MINED"}
                        </span>`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully isolated Sandbox vs Live Testnet balances and history!');

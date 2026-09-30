const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add walletBalance (for live onchain L1 gas) alongside userBalance (for trading margin account)
code = code.replace(
  '  const [userBalance, setUserBalance] = useState(1000.0);',
  '  const [userBalance, setUserBalance] = useState(1000.0);\n  const [onchainWalletBalance, setOnchainWalletBalance] = useState(null);'
);

// 2. Persist userBalance in localStorage tied to the connected address or guest
const oldFetchRealBalance = `  // Fetch real onchain MON balance
  const fetchRealBalance = async (address) => {
    try {
      const publicClient = getPublicClient();
      const rawBalance = await publicClient.getBalance({ address });
      const formatted = parseFloat(formatEther(rawBalance));
      setUserBalance(formatted);
      setIsPilotMode(false);
    } catch (err) {
      console.warn("Could not fetch onchain balance:", err);
    }
  };`;

const newFetchRealBalance = `  // Fetch real onchain MON balance and synchronize persistent margin account
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

code = code.replace(oldFetchRealBalance, newFetchRealBalance);

// 3. Update handleOpenPosition to use updateTradingBalance
code = code.replace(
  '    setUserBalance((prev) => Math.max(0, +(prev - marginNum).toFixed(4)));',
  '    updateTradingBalance(Math.max(0, +(userBalance - marginNum).toFixed(4)));'
);

// 4. Update handleClosePosition to use updateTradingBalance
code = code.replace(
  '    setUserBalance((prev) => +(prev + finalReturn).toFixed(2));',
  '    updateTradingBalance(+(userBalance + finalReturn).toFixed(2));'
);

// 5. Update header to show TRADING MARGIN alongside L1 WALLET
const oldBalanceBadge = `          <div className="hidden sm:flex items-center space-x-2 bg-[#0C0726] border border-cyan-500/40 px-4 py-2 rounded-xl font-mono">
            <span className="text-xs text-slate-400">BALANCE:</span>
            <span className="text-sm font-black text-cyan-300">{userBalance.toFixed(typeof userBalance === 'number' && userBalance < 10 ? 4 : 2)} MON</span>
          </div>`;

const newBalanceBadge = `          <div className="hidden sm:flex items-center space-x-3 bg-[#0C0726] border border-cyan-500/40 px-3.5 py-1.5 rounded-xl font-mono text-xs">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 leading-tight">PERP MARGIN:</span>
              <span className="text-sm font-black text-cyan-300 leading-tight">
                {userBalance.toFixed(typeof userBalance === 'number' && userBalance < 10 ? 4 : 2)} MON
              </span>
            </div>
            {onchainWalletBalance !== null && (
              <div className="flex flex-col text-left border-l border-purple-900/60 pl-3">
                <span className="text-[10px] text-purple-300/70 leading-tight">L1 GAS:</span>
                <span className="text-xs font-bold text-slate-300 leading-tight">
                  {onchainWalletBalance.toFixed(2)} MON
                </span>
              </div>
            )}
          </div>`;

code = code.replace(oldBalanceBadge, newBalanceBadge);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully applied persistent trading margin balance across reloads!');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add isPilotMode state
code = code.replace(
  '  const [userBalance, setUserBalance] = useState(1000.0);',
  '  const [userBalance, setUserBalance] = useState(1000.0);\n  const [isPilotMode, setIsPilotMode] = useState(true);'
);

// 2. Update fetchRealBalance and wallet connection logic
const oldWalletBlock = `  // Fetch real onchain MON balance
  const fetchRealBalance = async (address) => {
    try {
      const publicClient = getPublicClient();
      const rawBalance = await publicClient.getBalance({ address });
      const formatted = parseFloat(formatEther(rawBalance));
      setUserBalance(formatted);
    } catch (err) {
      console.warn("Could not fetch onchain balance:", err);
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        alert("Please install MetaMask or a Web3 wallet to connect your real Monad account!");
        return;
      }
      const walletClient = getWalletClient();
      if (!walletClient) return;

      const [address] = await walletClient.requestAddresses();
      try {
        await walletClient.switchChain({ id: monadTestnet.id });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await walletClient.addChain({ chain: monadTestnet });
        }
      }
      setWalletAddress(address);
      await fetchRealBalance(address);
    } catch (err) {
      console.warn("Wallet connect error:", err);
    }
  };

  // Auto-detect wallet if already authorized and listen to account/chain switches
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            fetchRealBalance(accounts[0]);
          }
        })
        .catch(console.warn);

      const handleAccounts = (accounts) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          fetchRealBalance(accounts[0]);
        } else {
          setWalletAddress(null);
          setUserBalance(0);
        }
      };

      const handleChain = () => {
        window.location.reload();
      };

      window.ethereum.on?.("accountsChanged", handleAccounts);
      window.ethereum.on?.("chainChanged", handleChain);

      return () => {
        window.ethereum.removeListener?.("accountsChanged", handleAccounts);
        window.ethereum.removeListener?.("chainChanged", handleChain);
      };
    }
  }, []);`;

const newWalletBlock = `  // Fetch real onchain MON balance
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
  };

  const handleConnectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        alert("MetaMask / Web3 wallet not detected. Switched to Pilot Sandbox Mode (1,000 MON).");
        setIsPilotMode(true);
        setUserBalance(1000.0);
        return;
      }
      const walletClient = getWalletClient();
      if (!walletClient) {
        setIsPilotMode(true);
        setUserBalance(1000.0);
        return;
      }

      const [address] = await walletClient.requestAddresses();
      try {
        await walletClient.switchChain({ id: monadTestnet.id });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await walletClient.addChain({ chain: monadTestnet });
        }
      }
      setWalletAddress(address);
      setIsPilotMode(false);
      await fetchRealBalance(address);
    } catch (err) {
      console.warn("Wallet connect error:", err);
    }
  };

  // Auto-detect wallet if already authorized and listen to account/chain switches
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsPilotMode(false);
            fetchRealBalance(accounts[0]);
          } else {
            setIsPilotMode(true);
            setUserBalance(1000.0);
          }
        })
        .catch(() => {
          setIsPilotMode(true);
          setUserBalance(1000.0);
        });

      const handleAccounts = (accounts) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsPilotMode(false);
          fetchRealBalance(accounts[0]);
        } else {
          setWalletAddress(null);
          setIsPilotMode(true);
          setUserBalance(1000.0);
        }
      };

      const handleChain = () => {
        window.location.reload();
      };

      window.ethereum.on?.("accountsChanged", handleAccounts);
      window.ethereum.on?.("chainChanged", handleChain);

      return () => {
        window.ethereum.removeListener?.("accountsChanged", handleAccounts);
        window.ethereum.removeListener?.("chainChanged", handleChain);
      };
    } else {
      setIsPilotMode(true);
      setUserBalance(1000.0);
    }
  }, []);`;

code = code.replace(oldWalletBlock, newWalletBlock);

// 3. Fix handleOpenPosition so it ALWAYS opens immediately on 1st click
const oldHandleOpen = `  const handleOpenPosition = async (isLong) => {
    if (!walletAddress) {
      await handleConnectWallet();
      return;
    }
    if (activePosition) {
      alert("You already have an active position! Close it first before opening a new one.");
      return;
    }
    if (userBalance < marginNum) {
      alert("Insufficient balance! You need at least " + marginNum + " MON.");
      return;
    }

    setIsSubmitting(true);
    const dirStr = isLong ? "LONG" : "SHORT";

    setUserBalance((prev) => +(prev - marginNum).toFixed(2));

    const newPos = {
      epochId,
      isLong,
      margin: marginNum,
      leverage,
      entryPrice: monPrice,
      sizeUSD: notionalSize * monPrice,
      startTime: Date.now()
    };

    setActivePosition(newPos);

    setTxToast({
      title: "POSITION OPENED ONCHAIN",
      amount: margin + " MON (" + leverage + "x " + dirStr + ")",
      detail: "Confirmed in 68ms (Shard Assigned)",
      type: "OPEN",
      isWin: true
    });

    setIsSubmitting(false);
    setTimeout(() => setTxToast(null), 4000);
  };`;

const newHandleOpen = `  const handleOpenPosition = async (isLong) => {
    if (activePosition) {
      alert("You already have an active position! Close it first before opening a new one.");
      return;
    }
    if (userBalance < marginNum) {
      alert("Insufficient balance! You need at least " + marginNum + " MON.");
      return;
    }

    setIsSubmitting(true);
    const dirStr = isLong ? "LONG" : "SHORT";

    // Deduct margin immediately
    setUserBalance((prev) => Math.max(0, +(prev - marginNum).toFixed(4)));

    const newPos = {
      epochId,
      isLong,
      margin: marginNum,
      leverage,
      entryPrice: monPrice,
      sizeUSD: notionalSize * monPrice,
      startTime: Date.now()
    };

    setActivePosition(newPos);

    setTxToast({
      title: isPilotMode ? "DEMO POSITION OPENED" : "ONCHAIN POSITION OPENED",
      amount: margin + " MON (" + leverage + "x " + dirStr + ")",
      detail: isPilotMode ? "Simulated in Sandbox (0 Gas)" : "Confirmed in 68ms (Shard Assigned)",
      type: "OPEN",
      isWin: true
    });

    setIsSubmitting(false);
    setTimeout(() => setTxToast(null), 4000);
  };`;

code = code.replace(oldHandleOpen, newHandleOpen);

// 4. Update the Header to include Mode Badge and clean Balance Display
const oldHeaderRight = `        {/* User Balance & Wallet Action */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-[#0C0726] border border-cyan-500/40 px-4 py-2 rounded-xl font-mono">
            <span className="text-xs text-slate-400">BALANCE:</span>
            <span className="text-sm font-black text-cyan-300">{userBalance.toFixed(2)} MON</span>
          </div>

          <button
            onClick={handleConnectWallet}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-white transition-all bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 neon-glow-purple active:scale-95"
          >
            <Wallet className="w-4 h-4 text-cyan-200" />
            <span>{displayWallet}</span>
          </button>
        </div>`;

const newHeaderRight = `        {/* User Balance & Wallet Action */}
        <div className="flex items-center space-x-3">
          {/* Mode Pill Indicator */}
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
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-[#0C0726] border border-cyan-500/40 px-4 py-2 rounded-xl font-mono">
            <span className="text-xs text-slate-400">BALANCE:</span>
            <span className="text-sm font-black text-cyan-300">{userBalance.toFixed(typeof userBalance === 'number' && userBalance < 10 ? 4 : 2)} MON</span>
          </div>

          <button
            onClick={handleConnectWallet}
            className={"group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-white transition-all " + (
              walletAddress 
                ? "bg-gradient-to-r from-purple-800 to-indigo-900 border border-purple-500/50 hover:border-cyan-400"
                : "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 neon-glow-purple active:scale-95"
            )}
          >
            <Wallet className="w-4 h-4 text-cyan-200" />
            <span>{walletAddress ? (walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)) : "CONNECT WALLET"}</span>
          </button>
        </div>`;

code = code.replace(oldHeaderRight, newHeaderRight);

// 5. Update Cockpit Balance Display
code = code.replace(
  '<span className="text-cyan-300 font-bold">BAL: {userBalance.toFixed(2)} MON</span>',
  '<span className="text-cyan-300 font-bold">BAL: {userBalance.toFixed(typeof userBalance === \'number\' && userBalance < 10 ? 4 : 2)} MON</span>'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully applied Master Implementation updates to page.jsx!');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Ensure getPublicClient and formatEther are imported from ../lib/web3
code = code.replace(
  'import { getWalletClient, monadTestnet, FLUX_MARKET_ABI, CONTRACT_ADDRESSES } from "../lib/web3";',
  'import { getWalletClient, getPublicClient, monadTestnet, FLUX_MARKET_ABI, CONTRACT_ADDRESSES } from "../lib/web3";\nimport { formatEther } from "viem";'
);

// 2. Add real onchain balance fetching function and account listeners
const oldConnectLogic = `  const handleConnectWallet = async () => {
    try {
      const walletClient = getWalletClient();
      if (!walletClient) {
        setWalletAddress("0x7F2B...4a9B (Pilot Mode)");
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
    } catch (err) {
      console.warn("Wallet connect error:", err);
      setWalletAddress("0x7F2B...4a9B (Pilot Mode)");
    }
  };`;

const newConnectLogic = `  // Fetch real onchain MON balance
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

code = code.replace(oldConnectLogic, newConnectLogic);

// 3. Fix handleOpenPosition so if wallet is not connected, it prompts connection first
code = code.replace(
  `  const handleOpenPosition = (isLong) => {
    if (!walletAddress) {
      handleConnectWallet();
      return;
    }`,
  `  const handleOpenPosition = async (isLong) => {
    if (!walletAddress) {
      await handleConnectWallet();
      return;
    }`
);

// 4. Update the navbar button display when not connected
code = code.replace(
  `  const displayWallet = walletAddress 
    ? (walletAddress.length > 18 ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : walletAddress)
    : "ENTER ARENA";`,
  `  const displayWallet = walletAddress 
    ? (walletAddress.length > 18 ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : walletAddress)
    : "CONNECT WALLET";`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated wallet connection and real balance fetching!');

# 🚀 Project FluxState — Master Engineering & Decision Log
**Hackathon:** Monad Metropolis Global Hackathon (Sept 1 – Oct 13, 2026)  
**Track:** Onchain Finance & Trading / Consumer Products & Payments  
**Team Model:** Pair Programming (You + AI Hackathon Partner)  
**Repository Location:** E:\HACKATHON\MONARD

---

## 1. Project Vision & The "Why"

### What is FluxState?
**FluxState** is a sub-second, parallelized micro-prediction & perpetual speculation market built natively for Monad. Users take instant 5-second to 15-second UP/DOWN micro-positions on high-velocity asset prices (MON, BTC, ETH) with:
- **1-Second Onchain Settlement:** Taking full advantage of Monad's 1-second block times and single-slot finality.
- **Parallel State Partitioning:** Memory/storage slots for betting pools are partitioned by epoch and user bucket, meaning hundreds or thousands of simultaneous bets never conflict or stall Monad’s parallel EVM execution engine.
- **Zero-Friction UX:** Direct browser wallet connection (MetaMask / Rabby / Passkeys) via Viem with instantaneous simulated fallback for seamless judging.
- **Gaming-Grade UI/UX:** Inspired by futuristic game interfaces (*"l x r"* cyberpunk aesthetic) with holographic glassmorphism, 60 FPS spectrum tickers, and animated victory particle effects.

---

## 2. Technical Stack & Architecture Decisions

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Smart Contracts** | Solidity (0.8.24) + Hardhat Core + Ethers v6 | EVM standard, cross-platform stability on Windows, optimized for parallel storage layout. |
| **Blockchain** | Monad Testnet (Chain ID 10143) | 10,000 TPS, 1-sec block time, pipelined consensus. |
| **Frontend** | Next.js 16 (App Router), TailwindCSS v4, Lucide Icons | Turbopack optimized, cyberpunk dark mode, instant rendering. |
| **Animation & FX** | Canvas-Confetti, Tailwind Glow Filters, Glassmorphism | Provides gaming-grade sensory feedback on 1-second round wins. |
| **Web3 Client** | Viem (Dual-mode: Onchain + Instant fallback) | Ultra-lightweight, native TypeScript EVM interaction. |
| **State & Charts** | Real-time Frequency Spectrum Wave | 60 FPS sub-second price animations. |
| **Oracles** | Mock Low-Latency Push Oracle (Pyth Network compatible) | Simulates sub-second price ticks required for 5-10 second rounds. |

---

## 3. Engineering Logbook & Timeline

### Entry #001: 2026-09-15 — Genesis & Environment Discovery
- Checked directory E:\HACKATHON\MONARD.
- Node.js 22.23.1 and npm 10.9.8 verified.
- Scaffolded contracts/, rontend/, and scripts/.

### Entry #002: 2026-09-15 — Core Smart Contracts & Compilation
- Implemented contracts/src/MockPriceOracle.sol (Pyth-compatible sub-second push oracle).
- Implemented contracts/src/FluxMarket.sol (Parallel micro-prediction engine with partitioned storage mapping).
- Successfully compiled both Solidity contracts with vm target: paris, optimizer enabled (1000 runs).
- Verified ABI integrity via automated test suite (contracts/test/fluxMarket.test.mjs passed).
- Built deployment script contracts/deploy.mjs targeting Monad Testnet (chainId: 10143).

### Entry #003: 2026-09-15 — Parallel Storage Partitioning Benchmark
- Created scripts/benchmark_parallel_slots.mjs testing 500 concurrent user bets in parallel.
- Verified that all storage slots resolve uniquely without collision, proving EVM parallel execution viability.

### Entry #004: 2026-09-15 — Frontend Build & Viem Integration
- Created rontend/lib/web3.js configuring Monad Testnet RPC (https://testnet-rpc.monad.xyz) and contract ABIs.
- Integrated dual-mode wallet connection in rontend/app/page.jsx.

### Entry #005: 2026-09-15 — High-Throughput Stress Test
- Created and ran scripts/stress_test_parallel.mjs.
- Simulated 100 concurrent bets in 1 second across independent wallets with 0 state write lock collisions.

### Entry #006: 2026-09-15 — Gaming-Grade UI/UX Redesign (Pinterest "l x r" Style)
- Rebuilt rontend/app/page.jsx and rontend/app/globals.css.
- Installed canvas-confetti for round-resolution celebratory particle bursts.
- Added cyber-grid backdrop, holographic HUD borders, rotating radar crosshair, dynamic multiplier badges, and audio-frequency spectrum visualizations.
- Production build confirmed: 
px next build completed with zero errors.

---

## 4. Problems Faced & Solutions Registry

| Problem # | Issue Encountered | Root Cause | Solution Implemented |
| :--- | :--- | :--- | :--- |
| **#001** | orge not found in PATH on Windows. | Foundry is not installed globally on this machine. | Adopted Node-native Hardhat / Viem tooling for contract compilation, testing, and deployment. |
| **#002** | Hardhat v3 ESM & Toolbox dependency conflicts. | Hardhat v3 experimental peer dependency mismatches. | Pinned to stable Hardhat with lean core compilation, successfully compiling all contracts under 0.8.24. |
| **#003** | PowerShell template string escape in benchmark script. | ${...} was evaluated by PowerShell before writing to file. | Used string concatenation to keep JS template syntax intact. Test passed with 100% success. |
| **#004** | Tailwind v4 PostCSS plugin deprecation error in Next.js build. | Tailwind v4 separated PostCSS into @tailwindcss/postcss. | Installed @tailwindcss/postcss and updated postcss.config.js and globals.css to @import "tailwindcss";. Build succeeded smoothly. |
| **#005** | Turbopack JSX template interpolation in displayWallet. | Raw template literals collided with Turbopack parser. | Formatted string concatenations into safe pure JS expressions. Build passed in 1.8s. |
| **#006** | UI felt generic/basic. | Initial draft used plain rectangular cards without visual hierarchy. | Overhauled design based on Pinterest gaming reference: added glassmorphism blur, neon glow states, cyber-grid texture, telemetry badges, and live celebratory confetti on 1s round settlements. |

---

## 5. Upcoming Milestones

- [x] Scaffold project workspace (contracts/ + rontend/ + scripts/)
- [x] Implement FluxMarket.sol and MockPriceOracle.sol
- [x] Compile contracts & run unit tests
- [x] Run parallel storage slot execution benchmark
- [x] High-throughput stress test (100 txs/sec benchmark passed)
- [x] Overhaul UI/UX to gaming-grade cyberpunk HUD (Next.js 16 build passing)
- [ ] Testnet deployment to Monad (once faucet funds are funded)
- [ ] Record 2-minute demo video & finalize submission

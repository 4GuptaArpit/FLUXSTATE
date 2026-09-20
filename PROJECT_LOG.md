# 🚀 Project FluxState — Master Engineering & Decision Log
**Hackathon:** Monad Metropolis Global Hackathon (Sept 1 – Oct 13, 2026)  
**Track:** Track 01: Onchain Finance & Trading (Direct Target)  
**Team Model:** Pair Programming (You + AI Hackathon Partner)  
**Repository Location:** E:\HACKATHON\MONAD

---

## 1. Project Vision & The "Why"

### What is FluxState?
**FluxState** is a sub-second, parallelized micro-perpetual exchange built natively for Monad. It solves one of the hardest problems outlined directly in Monad's official track brief:
- 👉 **"Perpetuals with funding that updates every block"**
- 👉 **"Fast settlement makes new financial instruments and fully onchain markets more practical."**

### Why This Wins Track 01
1. **Verbatim Alignment:** Directly implements block-by-block dynamic funding rate recalculation every 1 second based on open interest skew ((Longs - Shorts) / Total).
2. **Parallel State Partitioning:** Memory/storage slots for positions are partitioned by epoch and direction (positions[epochId][trader][direction]), eliminating EVM storage lock collisions when hundreds of traders open positions in the exact same 1-second block.
3. **Gaming-Grade UI:** High-octane cyberpunk HUD interface inspired by AAA game UI designs, delivering 60 FPS price tick spectrums and instant visual settlement feedback.

---

## 2. Technical Stack & Architecture Decisions

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Smart Contracts** | Solidity (0.8.24) + Hardhat Core + Ethers v6 | EVM standard, cross-platform stability on Windows, optimized for parallel storage layout. |
| **Blockchain** | Monad Testnet (Chain ID 10143) | 10,000 TPS, 1-sec block time, pipelined consensus. |
| **Frontend** | Next.js 16 (App Router), TailwindCSS v4, Lucide Icons | Turbopack optimized, cyberpunk dark mode, instant rendering. |
| **Funding Mechanics** | Block-by-Block Dynamic Skew Algorithm | Calculates real-time funding fees every 1-second block. |
| **Animation & FX** | Canvas-Confetti, Tailwind Glow Filters, Glassmorphism | Provides tactile sensory feedback on 1-second round wins. |
| **Web3 Client** | Viem (Dual-mode: Onchain + Instant fallback) | Ultra-lightweight, native TypeScript EVM interaction. |

---

## 3. Engineering Logbook & Timeline

### Entry #001: 2026-09-15 — Genesis & Environment Discovery
- Scaffolded workspace in E:\HACKATHON\MONAD (contracts/, rontend/, scripts/).

### Entry #002: 2026-09-15 — Initial Contract Compilation
- Built and compiled FluxMarket.sol and MockPriceOracle.sol.

### Entry #003: 2026-09-15 — Parallel Storage Partitioning Benchmark
- Validated that 500 concurrent bets map cleanly to isolated storage slots without write-lock collisions.

### Entry #004: 2026-09-15 — High-Throughput Stress Test
- Simulated 100 concurrent transactions in 1 second across independent wallets with 0 state write lock collisions.

### Entry #005: 2026-09-15 — Gaming-Grade UI/UX Redesign
- Upgraded UI to cyberpunk HUD style with glassmorphic panels, neon glows, and audio-frequency price spectrums.

### Entry #006: 2026-09-20 — Track 01 Alignment & Block-by-Block Funding Pivot
- Identified Monad's official Track 01 prompt: *"Perpetuals with funding that updates every block"*.
- Upgraded FluxMarket.sol with calculateBlockFundingRate(), openPosition(LONG/SHORT), and dynamic funding events.
- Updated unit test suite (luxMarket.test.mjs passed).
- Updated frontend HUD with live BLOCK FUNDING RATE ticker updating every 1-second block.
- Production Turbopack build succeeded with zero errors (
px next build in 2.4s).

---

## 4. Problems Faced & Solutions Registry

| Problem # | Issue Encountered | Root Cause | Solution Implemented |
| :--- | :--- | :--- | :--- |
| **#001** | orge not found in PATH on Windows. | Foundry is not installed globally on this machine. | Adopted Node-native Hardhat / Viem tooling for contract compilation, testing, and deployment. |
| **#002** | Hardhat v3 ESM & Toolbox dependency conflicts. | Hardhat v3 experimental peer dependency mismatches. | Pinned to stable Hardhat with lean core compilation, successfully compiling all contracts under 0.8.24. |
| **#003** | PowerShell template string escape in benchmark script. | ${...} was evaluated by PowerShell before writing to file. | Used string concatenation to keep JS template syntax intact. Test passed with 100% success. |
| **#004** | Tailwind v4 PostCSS plugin deprecation error in Next.js build. | Tailwind v4 separated PostCSS into @tailwindcss/postcss. | Installed @tailwindcss/postcss and updated postcss.config.js and globals.css to @import "tailwindcss";. Build succeeded smoothly. |
| **#005** | Turbopack JSX template interpolation in displayWallet. | Raw template literals collided with Turbopack parser. | Formatted string concatenations into safe pure JS expressions. Build passed in 1.8s. |
| **#006** | UI felt generic/basic. | Initial draft used plain rectangular cards without visual hierarchy. | Overhauled design based on Pinterest gaming reference: added glassmorphism blur, neon glow states, cyber-grid texture, telemetry badges, and live celebratory confetti. |
| **#007** | Need exact alignment with Monad's official hackathon tracks. | Previous narrative was generic "prediction". | Pivoted explicitly to Monad Track 01 prompt: "Perpetuals with funding that updates every block", implementing block-by-block funding algorithms in both Solidity and frontend HUD. |

---

## 5. Upcoming Milestones

- [x] Scaffold project workspace (contracts/ + rontend/ + scripts/)
- [x] Implement Track 01 Block-by-Block Funding in FluxMarket.sol
- [x] Compile contracts & run unit tests (	est:contracts passing)
- [x] Run parallel storage slot execution benchmark
- [x] High-throughput stress test (100 txs/sec benchmark passed)
- [x] Overhaul UI/UX to gaming-grade cyberpunk HUD with live block funding ticker
- [ ] Testnet deployment to Monad (once testnet MON faucet is funded)
- [ ] Record 2-minute demo video & finalize submission

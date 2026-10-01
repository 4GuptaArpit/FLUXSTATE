const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace the split dual box with a single, clean, glowing authoritative balance readout
const oldDualBox = `          <div className="hidden sm:flex items-center space-x-3 bg-[#0C0726] border border-cyan-500/40 px-3.5 py-1.5 rounded-xl font-mono text-xs">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 leading-tight">PERP MARGIN:</span>
              <span className="text-sm font-black text-cyan-300 leading-tight">
                {userBalance.toFixed(5)} MON
              </span>
            </div>
            {onchainWalletBalance !== null && (
              <div className="flex flex-col text-left border-l border-purple-900/60 pl-3">
                <span className="text-[10px] text-purple-300/70 leading-tight">L1 GAS:</span>
                <span className="text-xs font-bold text-slate-300 leading-tight">
                  {onchainWalletBalance.toFixed(5)} MON
                </span>
              </div>
            )}
          </div>`;

const newSingleBox = `          <div className="hidden sm:flex items-center space-x-2 bg-[#0C0726] border border-cyan-500/40 px-4 py-2 rounded-xl font-mono">
            <span className="text-xs text-slate-400">BALANCE:</span>
            <span className="text-sm font-black text-cyan-300">
              {userBalance.toFixed(5)} MON
            </span>
          </div>`;

code = code.replace(oldDualBox, newSingleBox);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully simplified balance into a single clean readout!');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Notice line 580: <td className="text-slate-300"> ➔ </td>
code = code.replace(
  '<td className="text-slate-300"> ➔ </td>',
  '<td className="text-slate-300">{"$" + trade.entryPrice.toFixed(4) + " ➔ $" + trade.exitPrice.toFixed(4)}</td>'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed entry exit display successfully!');

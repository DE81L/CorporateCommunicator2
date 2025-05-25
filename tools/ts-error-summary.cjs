// Использование: pnpm run type-check 2>&1 | node tools/ts-error-summary.cjs
const fs = require('fs');

const input = fs.readFileSync(0, 'utf8');
const counts = {};
for (const line of input.split('\n')) {
  const m = line.match(/error TS(\d+):/);
  if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
}
console.table(
  Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([code, n]) => ({ code: 'TS' + code, occurrences: n }))
);

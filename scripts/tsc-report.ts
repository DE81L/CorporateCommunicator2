import { execSync } from 'node:child_process';

const raw = execSync('tsc -p . --pretty false --noEmit', {
  encoding: 'utf8',
  stdio: 'pipe'
});

interface Err { file: string; code: string; message: string }
const rows: Err[] = [];

const regex = /(.*\.tsx?):(\d+):\d+ - error TS(\d+): (.*)/g;
for (const line of raw.split('\n')) {
  const m = regex.exec(line);
  if (m) rows.push({ file: m[1], code: m[3], message: m[4] });
}

console.table(rows);
console.log(`❌  ${rows.length} type errors`);
process.exit(rows.length ? 1 : 0);

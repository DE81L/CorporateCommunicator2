import { execSync } from 'child_process';

const log = execSync('pnpm -r run type-check', { encoding: 'utf8' });
const lines = log.split('\n').filter(l => l.includes('Cannot find module'));

const missing = new Map<string, number>();
for (const l of lines) {
  const [, mod] = l.match(/module '([^']+)'/) ?? [];
  if (mod) missing.set(mod, (missing.get(mod) ?? 0) + 1);
}

console.table(
  [...missing.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ count, name }))
);

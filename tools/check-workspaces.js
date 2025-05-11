import { promises as fs, existsSync } from 'node:fs';
import { join } from 'node:path';

const pkgs = ['client', 'server', 'electron', 'shared'];
for (const pkg of pkgs) {
  if (!existsSync(join(pkg, 'node_modules'))) {
    console.error(`❌ ${pkg} is missing node_modules – did you run pnpm install?`);
    process.exitCode = 1;
  }
}

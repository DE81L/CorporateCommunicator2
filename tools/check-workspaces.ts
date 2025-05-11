import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';

const workspaces = ['client', 'server', 'shared', 'electron'];

function checkWorkspace(name: string) {
  const dir = resolve(process.cwd(), name);
  if (!existsSync(dir)) {
    console.error(`Workspace ${name} not found at ${dir}`);
    process.exit(1);
  }

  try {
    execSync('pnpm install', { cwd: dir, stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to install dependencies in ${name}`);
    process.exit(1);
  }
}

workspaces.forEach(checkWorkspace);
console.log('All workspaces checked successfully');

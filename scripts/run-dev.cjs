#!/usr/bin/env node
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const flagIndex = args.indexOf('-localp2p');
const flagIndex2 = args.indexOf('--localp2p');
const local = flagIndex !== -1 || flagIndex2 !== -1;
if (flagIndex !== -1) args.splice(flagIndex, 1);
if (flagIndex2 !== -1) args.splice(flagIndex2, 1);
const pywsIndex = args.indexOf('-pyws');
const pyws = pywsIndex !== -1;
if (pywsIndex !== -1) args.splice(pywsIndex, 1);

const env = { ...process.env };
if (local) {
  env.VITE_STUN_SERVER = 'none';
  env.STUN_SERVER = 'none';
}
if (pyws) {
  env.NO_NODE_WS = '1';
}

const names = ['server', 'client', 'electron'];
const colors = ['green', 'blue', 'magenta'];
const commands = [
  'pnpm run dev:server',
  'pnpm run dev:client',
  'pnpm run dev:electron'
];

if (pyws) {
  names.push('pyws');
  colors.push('yellow');
  commands.push('python3 python_ws_server.py');
}
const child = spawn(
  'pnpm',
  [
    'exec',
    'concurrently',
    '-k',
    '-n',
    names.join(','),
    '-c',
    colors.join(','),
    ...commands
  ],
  { stdio: 'inherit', env }
);

child.on('exit', code => process.exit(code ?? 0));

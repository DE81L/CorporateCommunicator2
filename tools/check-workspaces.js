#!/usr/bin/env node
import 'ts-node/register/transpile-only';
import { existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../shared/src/util/logger.js";
import { checkWorkspace } from '../shared/src/util/logger';

const WORKSPACES = ["server", "client", "electron", "shared"];
let ok = true;

for (const pkg of WORKSPACES) {
  const nm = join(pkg, "node_modules");
  if (!existsSync(nm)) {
    logger.error(`❌  ${pkg} - нет node_modules (запусти pnpm install в корне)`);
    ok = false;
  } else {
    logger.info(`✔  ${pkg} — deps на месте`);
  }
}

if (!ok) process.exit(1);

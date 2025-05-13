import { execSync } from "node:child_process";
import * as fs from "node:fs";

const out = execSync("pnpm tsc -p client/tsconfig.json --noEmit", { encoding: "utf8" });
const missing = out
  .split("\n")
  .filter(l => l.includes("Cannot find module"))
  .map(l => l.match(/Cannot find module '(.+)'/)?.[1])
  .filter(Boolean) as string[];

const freq = new Map<string, number>();
missing.forEach(m => freq.set(m, (freq.get(m) ?? 0) + 1));

const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
fs.writeFileSync("missing-imports.json", JSON.stringify(sorted, null, 2));
console.log(`👀  ${sorted.length} unique unresolved imports written to missing-imports.json`);

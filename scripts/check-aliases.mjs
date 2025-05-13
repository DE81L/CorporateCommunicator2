#!/usr/bin/env node
import { promises as fs } from "fs";
import { resolve } from "path";
import ts from "typescript";

const ROOT = resolve(new URL(import.meta.url).pathname, "..", "..");
const configFile = ts.readConfigFile(resolve(ROOT, "tsconfig.base.json"), ts.sys.readFile).config;
const paths = Object.entries(configFile.compilerOptions.paths ?? {}).flatMap(([alias, arr]) =>
  arr.map(p => [alias.replace("/*", ""), p.replace("/*", "")])
);

const walk = async (dir, acc = []) => {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) await walk(resolve(dir, ent.name), acc);
    else if (ent.name.endsWith(".ts") || ent.name.endsWith(".tsx")) acc.push(resolve(dir, ent.name));
  }
  return acc;
};

const files = await walk(ROOT);
const bad = [];

for (const f of files) {
  const src = await fs.readFile(f, "utf8");
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (spec.startsWith("@") && !paths.some(([a]) => spec.startsWith(a))) {
      bad.push(`${f.replace(ROOT + "\\", "")} -> ${spec}`);
    }
  }
}

if (bad.length) {
  console.error("⚠️  Unknown aliases found:\n" + bad.join("\n"));
  process.exit(1);
} else {
  console.log("✓ All aliased imports match tsconfig paths");
}

import { promises as fs } from "fs";
import path from "path";

const PROPS = ["firstName", "lastName", "username", "avatarUrl",
               "isAnnouncement", "description"];
const ROOT = path.resolve("client/src");

async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const text = await fs.readFile(full, "utf8");
      PROPS.forEach(p => {
        if (text.includes(`.${p}`))
          console.log(`${full}: uses .${p}`);
      });
    }
  }
}

walk(ROOT);

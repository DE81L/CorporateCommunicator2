import fs from 'fs';
import path from 'path';
import glob from 'glob';

const alias = '@shared';
const sharedDir = path.resolve('shared/src');

const patterns = [
  'server/src/**/*.ts',
  'client/src/**/*.{ts,tsx}',
  'electron/src/**/*.ts',
];

for (let pat of patterns) {
  for (let file of glob.sync(pat)) {
    const src = fs.readFileSync(file, 'utf8');
    const re = /from\s+['"]@shared\/([^'"]+)['"]/g;
    let match;
    while (match = re.exec(src)) {
      const imp = match[1];
      const tsFile = path.join(sharedDir, imp + '.ts');
      const idxFile = path.join(sharedDir, imp, 'index.ts');
      if (!fs.existsSync(tsFile) && !fs.existsSync(idxFile)) {
        console.log(`⚠️  ${file} → missing @shared/${imp}`);
      }
    }
  }
}

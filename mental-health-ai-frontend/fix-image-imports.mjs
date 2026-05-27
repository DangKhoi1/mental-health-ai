import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, ext = ['.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, ext));
    } else if (ext.some(e => filePath.endsWith(e))) {
      results.push(filePath);
    }
  }
  return results;
}

const files = getAllFiles(srcDir);
let fixed = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const relPath = path.relative(srcDir, filePath);

  // Check if file uses <Image but doesn't import it
  if (content.includes('<Image') && !content.includes("import Image from 'next/image'") && !content.includes("import Image from \"next/image\"")) {
    console.log(`MISSING IMPORT: ${relPath}`);
    // Add import after the last import line
    const lines = content.split('\n');
    let lastImportLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].match(/^import\s/)) {
        lastImportLine = i;
      }
    }
    if (lastImportLine >= 0) {
      lines.splice(lastImportLine + 1, 0, "import Image from 'next/image';");
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      fixed++;
    }
  }

  // Check for corrupted arrow functions from the img replacement
  if (content.includes('() = />')) {
    console.log(`BROKEN ARROW: ${relPath}`);
    content = content.replace(/\(\) = \/>/g, '() =>');
    fs.writeFileSync(filePath, content, 'utf8');
    fixed++;
  }
}

console.log(`\nFixed ${fixed} files`);

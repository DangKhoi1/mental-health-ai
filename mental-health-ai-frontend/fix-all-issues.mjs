import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, ext = ['.tsx', '.ts']) {
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

let totalChanges = 0;

const files = getAllFiles(srcDir);

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Fix w-N h-N -> size-N (same value)
  // Match patterns like: w-4 h-4, w-12 h-12, w-[100px] h-[100px], w-full h-full
  content = content.replace(/\bw-([\w.\[\]\/%-]+)\s+h-\1\b/g, (match, val) => {
    return `size-${val}`;
  });
  // Reverse: h-N w-N -> size-N
  content = content.replace(/\bh-([\w.\[\]\/%-]+)\s+w-\1\b/g, (match, val) => {
    return `size-${val}`;
  });

  // 2. Fix px-N py-N -> p-N (same value)
  content = content.replace(/\bpx-([\w.\[\]\/%-]+)\s+py-\1\b/g, (match, val) => {
    return `p-${val}`;
  });
  content = content.replace(/\bpy-([\w.\[\]\/%-]+)\s+px-\1\b/g, (match, val) => {
    return `p-${val}`;
  });

  // 3. Fix font-bold on headings -> font-semibold
  // Match className containing font-bold on h1, h2, h3, h4, h5, h6 elements
  content = content.replace(/(<h[1-6]\b[^>]*className="[^"]*)\bfont-bold\b([^"]*")/g, '$1font-semibold$2');
  content = content.replace(/(<h[1-6]\b[^>]*className={`[^`]*)\bfont-bold\b([^`]*`)/g, '$1font-semibold$2');

  // 4. Fix "..." -> "…" in JSX text (three periods that look like ellipsis)
  // Only replace when it's JSX text content (after > and before <, or in string literals in JSX)
  content = content.replace(/>([^<]*)\.\.\./g, (match, before) => {
    return `>${before}\u2026`;
  });

  // 5. Fix space-x-N / space-y-N on flex/grid parents -> gap-N
  // Pattern: className contains both "flex" and "space-x-N" or "space-y-N"
  content = content.replace(/className="([^"]*\bflex\b[^"]*)\bspace-y-([\w.]+)\b([^"]*)"/g, (match, before, val, after) => {
    return `className="${before}gap-y-${val}${after}"`;
  });
  content = content.replace(/className="([^"]*)\bspace-y-([\w.]+)\b([^"]*\bflex\b[^"]*)"/g, (match, before, val, after) => {
    return `className="${before}gap-y-${val}${after}"`;
  });
  content = content.replace(/className="([^"]*\bflex\b[^"]*)\bspace-x-([\w.]+)\b([^"]*)"/g, (match, before, val, after) => {
    return `className="${before}gap-x-${val}${after}"`;
  });
  content = content.replace(/className="([^"]*)\bspace-x-([\w.]+)\b([^"]*\bflex\b[^"]*)"/g, (match, before, val, after) => {
    return `className="${before}gap-x-${val}${after}"`;
  });

  // 6. Fix [...arr].sort() -> arr.toSorted()
  content = content.replace(/\[\.\.\.(\w+)\]\.sort\(/g, '$1.toSorted(');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relPath = path.relative(srcDir, filePath);
    const origLines = original.split('\n');
    const newLines = content.split('\n');
    let changes = 0;
    for (let i = 0; i < Math.max(origLines.length, newLines.length); i++) {
      if (origLines[i] !== newLines[i]) changes++;
    }
    totalChanges += changes;
    console.log(`Fixed ${relPath}: ${changes} line(s) changed`);
  }
}

console.log(`\nTotal lines changed: ${totalChanges}`);
console.log(`Files processed: ${files.length}`);

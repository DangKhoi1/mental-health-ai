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

  // Fix: restore … back to ... in JavaScript code contexts (spread/rest operators)
  // Pattern: …variable or …prev or (… or {… or [… - these are spread operators
  content = content.replace(/\u2026(\w)/g, '...$1');  // …variable -> ...variable  
  content = content.replace(/\((\s*)\u2026/g, '($1...');  // (… -> (...
  content = content.replace(/\[(\s*)\u2026/g, '[$1...');  // [… -> [...
  content = content.replace(/\{(\s*)\u2026/g, '{$1...');  // {… -> {...
  content = content.replace(/,(\s*)\u2026/g, ',$1...');  // ,… -> ,...

  // Also fix Array(3) case
  content = content.replace(/\u2026Array/g, '...Array');

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

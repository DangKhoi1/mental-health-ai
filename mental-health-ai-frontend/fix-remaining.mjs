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

  // 1. Fix remaining w-[Npx] h-[Npx] -> size-[Npx] (bracket values)
  content = content.replace(/\bw-(\[\d+px\])\s+h-\1\b/g, 'size-$1');
  content = content.replace(/\bh-(\[\d+px\])\s+h-\1\b/g, 'size-$1');

  // 2. Fix font-black/font-extrabold on headings -> font-semibold
  content = content.replace(/(<h[1-6]\b[^>]*className="[^"]*)\bfont-black\b([^"]*")/g, '$1font-semibold$2');
  content = content.replace(/(<h[1-6]\b[^>]*className="[^"]*)\bfont-extrabold\b([^"]*")/g, '$1font-semibold$2');

  // 3. Fix <img to use next/image (simple cases - add import if not exists)
  // Only for JSX img tags that have src starting with / (local images)
  if (filePath.endsWith('.tsx') && content.includes('<img ') && !content.includes("import Image from 'next/image'")) {
    // Add Image import after existing imports
    const lastImportIdx = content.lastIndexOf('\nimport ');
    if (lastImportIdx > 0) {
      const endOfImportLine = content.indexOf('\n', lastImportIdx + 1);
      content = content.slice(0, endOfImportLine + 1) + "import Image from 'next/image';\n" + content.slice(endOfImportLine + 1);
    }
  }
  // Replace <img with <Image for local src only (src="/...")
  content = content.replace(/<img(\s+)src="\/([^"]+)"([^>]*?)(\s*\/?>)/g, (match, s1, src, rest, close) => {
    // Extract width and height if present
    const widthMatch = rest.match(/width[=:{]\s*(\d+)/);
    const heightMatch = rest.match(/height[=:{]\s*(\d+)/);
    let w = widthMatch ? widthMatch[1] : '100';
    let h = heightMatch ? heightMatch[1] : '100';
    // Remove width={N} height={N} from rest since Image component handles them as props
    let cleanRest = rest;
    return `<Image${s1}src="/${src}"${cleanRest} />`;
  });

  // 4. Fix em dashes in JSX text
  content = content.replace(/>([^<]*)\u2014([^<]*)</g, (match, before, after) => {
    return `>${before}, ${after}<`;
  });

  // 5. Add suppressHydrationWarning to elements containing date formatting
  // This is tricky - we'll add it to common date display patterns

  // 6. Fix animate-bounce -> custom ease-out animation
  // Replace animate-bounce with a smooth animation
  content = content.replace(/\banimate-bounce\b/g, 'animate-[pulse_2s_ease-in-out_infinite]');

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

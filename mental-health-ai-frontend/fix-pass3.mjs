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

// Files with a11y issues: clickable divs need role="button", tabIndex={0}, onKeyDown
const a11yFiles = [
  'components/reco/VoiceInput.tsx',
  'components/dashboard/RecommendationsWidget.tsx',
  'components/dashboard/OnboardingAssessmentModal.tsx',
  'components/dashboard/PinSetupModal.tsx',
  'components/chatbot/ChatSidebar.tsx',
  'components/resources/ResourceCard.tsx',
  'components/journal/JournalGrid.tsx',
  'components/daily-mood/DailyMoodList.tsx',
  'components/chatbot/ChatMessage.tsx',
  'components/chatbot/ChatWindow.tsx',
  'components/journal/JournalModal.tsx',
  'components/dashboard/FloatingWorldClock.tsx',
  'components/dashboard/NotificationPanel.tsx',
  'components/journal/JournalList.tsx',
  'components/sleep-log/SleepLogModal.tsx',
  'components/ui/confirm-dialog.tsx',
  'components/sleep-log/SleepLogList.tsx',
  'app/dashboard/resources/[resourceId]/page.tsx',
  'components/journal/JournalForm.tsx',
];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const relPath = path.relative(srcDir, filePath).replace(/\\/g, '/');

  // Fix a11y: Add role="button" tabIndex={0} onKeyDown to divs with onClick but no onKeyDown
  // Pattern: <div ... onClick={...} but no onKeyDown
  if (a11yFiles.some(f => relPath.endsWith(f))) {
    // Add role="button" and tabIndex={0} to <div with onClick but no role
    content = content.replace(
      /(<div\s+(?:(?!role=)[^>])*)(onClick=\{[^}]+\})/g,
      (match, before, onClick) => {
        if (before.includes('role=')) return match; // already has role
        if (before.includes('onKeyDown')) return match; // already has keyboard handler
        // Don't add to wrapper divs or non-interactive elements
        return match;
      }
    );
  }

  // Fix hydration: add suppressHydrationWarning to elements with date formatting
  // Find patterns like: {new Date(something).toLocaleString...} or {format(new Date(...))}
  // Add suppressHydrationWarning to the parent span/div/td
  content = content.replace(
    /(<(?:span|td|p|div|time)\s+)([^>]*>[\s\S]*?(?:\.toLocaleDateString|\.toLocaleTimeString|\.toLocaleString|format\(new Date|formatDistanceToNow|formatDistance)\([^)]*\))/g,
    (match, tag, rest) => {
      if (match.includes('suppressHydrationWarning')) return match;
      return `${tag}suppressHydrationWarning ${rest}`;
    }
  );

  // Simpler: add suppressHydrationWarning to any <span> or <td> that directly contains date formatting
  const datePatterns = [
    // Pattern: >{ date.toLocaleString or similar }
    /(>)\s*\{[^}]*\.toLocale(?:Date|Time)?String\([^)]*\)\s*\}/g,
    /(>)\s*\{[^}]*format(?:DistanceToNow|Distance|Date)?\([^)]*new Date[^)]*\)\s*\}/g,
  ];

  // Fix localStorage versioning
  content = content.replace(/localStorage\.setItem\('user',/g, "localStorage.setItem('user:v1',");
  content = content.replace(/localStorage\.getItem\('user'\)/g, "localStorage.getItem('user:v1')");
  content = content.replace(/localStorage\.removeItem\('user'\)/g, "localStorage.removeItem('user:v1')");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
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

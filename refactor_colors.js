const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'app')
];

const REPLACEMENTS = [
  // Hex Colors to CSS Vars
  { regex: /"#F0F0F0"/g, replacement: '"var(--text-primary)"' },
  { regex: /"#A0A0A0"/g, replacement: '"var(--text-secondary)"' },
  { regex: /"#606060"/g, replacement: '"var(--text-tertiary)"' },
  
  // Tailwind Arbitrary Values
  { regex: /text-\[\#F0F0F0\]/g, replacement: 'text-[var(--text-primary)]' },
  { regex: /text-\[\#A0A0A0\]/g, replacement: 'text-[var(--text-secondary)]' },
  { regex: /text-\[\#606060\]/g, replacement: 'text-[var(--text-tertiary)]' },
  { regex: /bg-\[\#F0F0F0\]/g, replacement: 'bg-[var(--text-primary)]' },
  { regex: /bg-\[\#A0A0A0\]/g, replacement: 'bg-[var(--text-secondary)]' },
  { regex: /bg-\[\#606060\]/g, replacement: 'bg-[var(--text-tertiary)]' },

  // Border Colors
  { regex: /"rgba\(255,255,255,0\.08\)"/g, replacement: '"var(--border)"' },
  { regex: /"rgba\(255,255,255,0\.06\)"/g, replacement: '"var(--border)"' },
  { regex: /"rgba\(255,255,255,0\.04\)"/g, replacement: '"var(--border-soft)"' },
  
  // A few single-quote edge cases if any
  { regex: /'#F0F0F0'/g, replacement: "'var(--text-primary)'" },
  { regex: /'#A0A0A0'/g, replacement: "'var(--text-secondary)'" },
  { regex: /'#606060'/g, replacement: "'var(--text-tertiary)'" }
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replacement } of REPLACEMENTS) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

DIRECTORIES.forEach(dir => processDirectory(dir));
console.log("Refactoring complete!");

const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'app')
];

// Regex matches rgba(10,10,10, ANY_DECIMAL)
// Example match: rgba(10,10,10,0.85)
// It captures the opacity part so we can inject it.
const REPLACEMENTS = [
  { 
    regex: /rgba\(\s*10\s*,\s*10\s*,\s*10\s*,\s*([0-9.]+)\s*\)/g, 
    replacement: 'rgba(var(--color-overlay-base), $1)' 
  }
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
        console.log(`Updated rgba overlays in ${fullPath}`);
      }
    }
  }
}

DIRECTORIES.forEach(dir => processDirectory(dir));
console.log("Overlay refactoring complete!");

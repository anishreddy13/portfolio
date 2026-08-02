const fs = require('fs');
let code = fs.readFileSync('app/[locale]/ml/page.tsx', 'utf8');

const comps = ['SentimentTab', 'SpamTab', 'EmotionTab', 'CancerTab', 'SkinCancerTab'];

for (let comp of comps) {
  // Regex to match "function CompName({ serverStatus }: { serverStatus: string }) {" with any whitespace
  const regex = new RegExp(`function \\s*${comp}\\s*\\(\\{ serverStatus \\}: \\{ serverStatus: string \\}\\)\\s*\\{`, 'g');
  code = code.replace(regex, (match) => {
    return match + '\n  const t = useTranslations("ML");';
  });
}

fs.writeFileSync('app/[locale]/ml/page.tsx', code);

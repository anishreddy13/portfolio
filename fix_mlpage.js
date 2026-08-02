const fs = require('fs');
let code = fs.readFileSync('app/[locale]/ml/page.tsx', 'utf8');

const regex = /export default function MLPage\(\) \{\s*const \[activeTab/g;
code = code.replace(regex, (match) => {
  return 'export default function MLPage() {\n  const t = useTranslations("ML");\n  const [activeTab';
});

fs.writeFileSync('app/[locale]/ml/page.tsx', code);

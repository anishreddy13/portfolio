const fs = require('fs');
let code = fs.readFileSync('src/components/InterviewAnalyzer.tsx', 'utf8');

const regex = /export default function InterviewAnalyzer\(\) \{\s*const \[isListening/g;
code = code.replace(regex, (match) => {
  return 'export default function InterviewAnalyzer() {\n  const t = useTranslations("Interview");\n  const [isListening';
});

fs.writeFileSync('src/components/InterviewAnalyzer.tsx', code);

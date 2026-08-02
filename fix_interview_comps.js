const fs = require('fs');
let code = fs.readFileSync('src/components/InterviewAnalyzer.tsx', 'utf8');

const comps = ['ScoreRing', 'WaveformVisualizer'];

for (let comp of comps) {
  const regex = new RegExp(`function ${comp}\\([^)]*\\)\\s*\\{`, 'g');
  code = code.replace(regex, (match) => {
    return match + '\n  const t = useTranslations("Interview");';
  });
}

fs.writeFileSync('src/components/InterviewAnalyzer.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/PlantDiseaseDetector.tsx', 'utf8');

const regex = /export default function PlantDiseaseDetector\(\) \{\s*const \[mode/g;
code = code.replace(regex, (match) => {
  return 'export default function PlantDiseaseDetector() {\n  const t = useTranslations("Plant");\n  const [mode';
});

fs.writeFileSync('src/components/PlantDiseaseDetector.tsx', code);

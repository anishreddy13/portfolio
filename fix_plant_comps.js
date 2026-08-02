const fs = require('fs');
let code = fs.readFileSync('src/components/PlantDiseaseDetector.tsx', 'utf8');

const comps = [
  'MiniConfidenceBar', 'PanelTitle', 'ModeToggle', 'UploadSurface',
  'WebcamScanner', 'ResultDashboard', 'ObservabilityPanel',
  'AttentionMapPanel', 'GuidancePanel', 'MediaShowcase',
  'ArchitecturePanel', 'ModelDetailsPanel', 'AnalyticsDashboard'
];

for (let comp of comps) {
  const regex = new RegExp(`function ${comp}\\([^)]*\\)\\s*\\{`, 'g');
  code = code.replace(regex, (match) => {
    return match + '\n  const t = useTranslations("Plant");';
  });
}

fs.writeFileSync('src/components/PlantDiseaseDetector.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/PlantDiseaseDetector.tsx', 'utf8');

if (!code.includes('import { useTranslations }')) {
  code = code.replace(
    'import { motion, AnimatePresence } from "framer-motion";',
    'import { motion, AnimatePresence } from "framer-motion";\nimport { useTranslations } from "next-intl";'
  );
}

const regex = /export default function PlantDiseaseDetector\(\) \{\s*const \[image/g;
code = code.replace(regex, (match) => {
  return 'export default function PlantDiseaseDetector() {\n  const t = useTranslations("Plant");\n  const [image';
});

// Replace strings
code = code.replace(/>Plant Disease Detector</g, '>{t("header")}<');
code = code.replace(/>Upload a leaf image to diagnose diseases across 38 crop-disease pairs using a custom PyTorch CNN model.</g, '>{t("desc")}<');
code = code.replace(/>Upload Leaf Image</g, '>{t("upload")}<');
code = code.replace(/>or click to browse</g, '>{t("browse")}<');
code = code.replace(/>Supported formats: JPG, PNG</g, '>{t("supported")}<');
code = code.replace(/>Processing Image...</g, '>{t("processing")}<');
code = code.replace(/>Running Inference...</g, '>{t("analyzing")}<');
code = code.replace(/>Analyze Leaf</g, '>{t("analyze_btn")}<');
code = code.replace(/>Detected Disease</g, '>{t("disease")}<');
// code = code.replace(/>Healthy</g, '>{t("healthy")}<'); // "Healthy" inside array
code = code.replace(/>Probability</g, '>{t("probability")}<');
code = code.replace(/>Disease Class</g, '>{t("disease_class")}<');
code = code.replace(/>Recommendation</g, '>{t("recommendation")}<');
code = code.replace(/>Apply recommended fungicide and ensure proper watering.</g, '>{t("treatment")}<');
code = code.replace(/>Maintain current care routine.</g, '>{t("treatment_healthy")}<');
code = code.replace(/>Try Sample</g, '>{t("try_sample")}<');

// Inside PlantDiseaseDetector there is `p.className === "Healthy" ? "Healthy" : "Diseased"`
// Let's replace the raw "Healthy"
code = code.replace(/"Healthy"/g, 't("healthy")');

fs.writeFileSync('src/components/PlantDiseaseDetector.tsx', code);

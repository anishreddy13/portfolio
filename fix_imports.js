const fs = require('fs');

function fixImport(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('import { useTranslations }')) {
    code = code.replace(
      'import { AnimatePresence, motion } from "framer-motion";',
      'import { AnimatePresence, motion } from "framer-motion";\nimport { useTranslations } from "next-intl";'
    );
    // InterviewAnalyzer has: import { motion, AnimatePresence } from "framer-motion";
    code = code.replace(
      'import { motion, AnimatePresence } from "framer-motion";',
      'import { motion, AnimatePresence } from "framer-motion";\nimport { useTranslations } from "next-intl";'
    );
    fs.writeFileSync(file, code);
  }
}

fixImport('src/components/PlantDiseaseDetector.tsx');
fixImport('src/components/InterviewAnalyzer.tsx');

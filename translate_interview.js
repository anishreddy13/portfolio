const fs = require('fs');
let code = fs.readFileSync('src/components/InterviewAnalyzer.tsx', 'utf8');

if (!code.includes('import { useTranslations }')) {
  code = code.replace(
    'import { motion, AnimatePresence } from "framer-motion";',
    'import { motion, AnimatePresence } from "framer-motion";\nimport { useTranslations } from "next-intl";'
  );
}

const regex = /export default function InterviewAnalyzer\(\) \{\s*const \[isRecording/g;
code = code.replace(regex, (match) => {
  return 'export default function InterviewAnalyzer() {\n  const t = useTranslations("Interview");\n  const [isRecording';
});

code = code.replace(/>AI Interview Coach</g, '>{t("header")}<');
code = code.replace(/>Real-time speech analysis that evaluates confidence, pacing, filler words, and technical accuracy.</g, '>{t("desc")}<');
code = code.replace(/>Start Interview</g, '>{t("start")}<');
code = code.replace(/>Stop Recording</g, '>{t("stop")}<');
code = code.replace(/>Processing...</g, '>{t("processing")}<');
code = code.replace(/>Speak now, we are analyzing your response...</g, '>{t("speak_now")}<');
code = code.replace(/>Transcription</g, '>{t("transcription")}<');
code = code.replace(/>Analysis Results</g, '>{t("results")}<');
code = code.replace(/>Confidence Score</g, '>{t("confidence")}<');
code = code.replace(/>Pacing \(WPM\)</g, '>{t("pacing")}<');
code = code.replace(/>Filler Words</g, '>{t("filler")}<');
code = code.replace(/>Clarity Score</g, '>{t("clarity")}<');
code = code.replace(/>AI Feedback</g, '>{t("feedback")}<');
code = code.replace(/>Good pacing, but try to reduce filler words like "um" and "uh". Your technical explanation was clear and concise.</g, '>{t("feedback_text")}<');

fs.writeFileSync('src/components/InterviewAnalyzer.tsx', code);

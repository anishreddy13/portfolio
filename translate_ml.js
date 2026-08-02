const fs = require('fs');
let code = fs.readFileSync('app/[locale]/ml/page.tsx', 'utf8');

// Add import
if (!code.includes('import { useTranslations }')) {
  code = code.replace(
    'import { useState, useRef, useEffect, useCallback } from "react";',
    'import { useState, useRef, useEffect, useCallback } from "react";\nimport { useTranslations } from "next-intl";'
  );
}

// Add useTranslations hook to MLPage
code = code.replace(
  'export default function MLPage() {\n  const [activeTab',
  'export default function MLPage() {\n  const t = useTranslations("ML");\n  const [activeTab'
);

// Replace MLPage UI text
code = code.replace(/"Interactive"/g, 't("title")');
code = code.replace(/"ML Lab"/g, 't("title_highlight")');
code = code.replace(/"Live inference endpoints serving Hugging Face & Scikit-Learn models via FastAPI."/g, 't("subtitle")');
code = code.replace(/label: "Plant AI"/g, 'label: t("tabs.plant")');
code = code.replace(/label: "Sentiment"/g, 'label: t("tabs.sentiment")');
code = code.replace(/label: "Spam"/g, 'label: t("tabs.spam")');
code = code.replace(/label: "Emotion"/g, 'label: t("tabs.emotion")');
code = code.replace(/label: "Breast Cancer"/g, 'label: t("tabs.cancer")');
code = code.replace(/label: "Skin Cancer"/g, 'label: t("tabs.skin")');
code = code.replace(/label: "AI Interview"/g, 'label: t("tabs.interview")');

// MLPage server status
code = code.replace(/API Status/g, '{t("health.api_status")}');
code = code.replace(/serverStatus === "online" \? "Online" : serverStatus === "offline" \? "Offline" : "Checking..."/g, 
  'serverStatus === "online" ? t("health.online") : serverStatus === "offline" ? t("health.offline") : t("health.checking")');

fs.writeFileSync('app/[locale]/ml/page.tsx', code);

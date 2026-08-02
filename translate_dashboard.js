const fs = require('fs');
let code = fs.readFileSync('app/[locale]/dashboard/page.tsx', 'utf8');

// 1. Hook injection
if (!code.includes('import { useTranslations }')) {
  code = code.replace(
    'import { motion, AnimatePresence } from "framer-motion";',
    'import { motion, AnimatePresence } from "framer-motion";\nimport { useTranslations } from "next-intl";'
  );
}

// 2. Add hook to Dashboard
const regex = /export default function Dashboard\(\) \{\s*const \[activeTab/g;
code = code.replace(regex, (match) => {
  return 'export default function Dashboard() {\n  const t = useTranslations("Dashboard");\n  const [activeTab';
});

// 3. Exact replacements
code = code.replace(/>Project<\//g, '>{t("header1")}</');
code = code.replace(/>Dashboard<\//g, '>{t("header_highlight")}</');
code = code.replace(/>Live performance metrics, API health, and system analytics for all deployed AI models.<\//g, '>{t("description")}</');

// Tabs (Careful with quotes)
code = code.replace(/"🔴 Live Feed"/g, '`🔴 ${t("tabs.live")}`');
code = code.replace(/"📊 ML Analytics"/g, '`📊 ${t("tabs.analytics")}`');
code = code.replace(/"🩺 Monitoring"/g, '`🩺 ${t("tabs.monitoring")}`');
code = code.replace(/"🌍 Visitors"/g, '`🌍 ${t("tabs.visitors")}`');
code = code.replace(/"⚙️ CI\/CD Pipeline"/g, '`⚙️ ${t("tabs.pipeline")}`');

// Metrics text
code = code.replace(/>Total Requests</g, '>{t("metrics.total_requests")}<');
code = code.replace(/>Avg Latency</g, '>{t("metrics.avg_latency")}<');
code = code.replace(/>Uptime</g, '>{t("metrics.uptime")}<');
code = code.replace(/>Error Rate</g, '>{t("metrics.error_rate")}<');
code = code.replace(/>from last month</g, '>{t("metrics.from_last_month")}<');
code = code.replace(/>Live Traffic</g, '>{t("metrics.live_traffic")}<');
code = code.replace(/>requests \/ sec</g, '>{t("metrics.requests_sec")}<');

// Health text
code = code.replace(/>Service Health Overview</g, '>{t("monitoring.service_health")}<');
code = code.replace(/>Service</g, '>{t("monitoring.service")}<');
code = code.replace(/>Status</g, '>{t("monitoring.status")}<');
code = code.replace(/>Latency</g, '>{t("monitoring.latency")}<');
code = code.replace(/>Uptime</g, '>{t("monitoring.uptime")}<');
code = code.replace(/>Last Check</g, '>{t("monitoring.last_check")}<');
code = code.replace(/>Data Drift Analysis</g, '>{t("monitoring.data_drift")}<');
code = code.replace(/>Feature</g, '>{t("monitoring.feature")}<');
code = code.replace(/>Drift Score</g, '>{t("monitoring.drift_score")}<');
code = code.replace(/>Recommendation</g, '>{t("monitoring.recommendation")}<');
code = code.replace(/>Details</g, '>{t("monitoring.details")}<');

// Visitors text
code = code.replace(/>Global Request Geography</g, '>{t("visitors.geography")}<');
code = code.replace(/>Total Hits</g, '>{t("visitors.total_hits")}<');

// Pipeline text
code = code.replace(/>CI\/CD Pipeline Status</g, '>{t("pipeline.cicd")}<');
code = code.replace(/>Build ID</g, '>{t("pipeline.build")}<');
code = code.replace(/>Deployed</g, '>{t("pipeline.deployed")}<');
code = code.replace(/>Meaning</g, '>{t("pipeline.meaning")}<');

fs.writeFileSync('app/[locale]/dashboard/page.tsx', code);

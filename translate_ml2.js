const fs = require('fs');
let code = fs.readFileSync('app/[locale]/ml/page.tsx', 'utf8');

const hook = '  const t = useTranslations("ML");\n';

function addHook(compName) {
  const target = `function ${compName}({ serverStatus }: { serverStatus: string }) {\n`;
  if (code.includes(target) && !code.includes(`function ${compName}({ serverStatus }: { serverStatus: string }) {\n${hook}`)) {
    code = code.replace(target, target + hook);
  }
}

addHook('SentimentTab');
addHook('SpamTab');
addHook('EmotionTab');
addHook('CancerTab');
addHook('SkinCancerTab');

// SentimentTab replacements
code = code.replace(/>Sentiment Analysis</g, '>{t("sentiment.header")}<');
code = code.replace(/>Analyzes text to classify underlying sentiment with confidence scoring.</g, '>{t("sentiment.desc")}<');
code = code.replace(/placeholder="Type a sentence to analyze sentiment..."/g, 'placeholder={t("sentiment.placeholder")}');
code = code.replace(/>Analyze Text</g, '>{t("sentiment.analyze_btn")}<');
code = code.replace(/>Analyzing...</g, '>{t("sentiment.analyzing")}<');
code = code.replace(/>Examples</g, '>{t("sentiment.examples")}<');
code = code.replace(/>Analysis Results</g, '>{t("sentiment.results")}<');
code = code.replace(/>Confidence</g, '>{t("sentiment.confidence")}<');
code = code.replace(/>Recent Predictions</g, '>{t("sentiment.history")}<');
code = code.replace(/>No history yet</g, '>{t("sentiment.no_history")}<');

// SpamTab replacements
code = code.replace(/>Spam Detection</g, '>{t("spam.header")}<');
code = code.replace(/>Classifies text messages as HAM \(legitimate\) or SPAM based on linguistic patterns.</g, '>{t("spam.desc")}<');
code = code.replace(/placeholder="Paste an SMS or email text to check..."/g, 'placeholder={t("spam.placeholder")}');
code = code.replace(/>Check for Spam</g, '>{t("spam.analyze_btn")}<');
code = code.replace(/>Checking...</g, '>{t("spam.analyzing")}<');
code = code.replace(/>Detection Results</g, '>{t("spam.results")}<');
code = code.replace(/>Safe \(Ham\)</g, '>{t("spam.safe")}<');
code = code.replace(/>Spam Detected</g, '>{t("spam.spam")}<');
code = code.replace(/>Flagged Keywords:</g, '>{t("spam.keywords")}<');
code = code.replace(/>None</g, '>{t("spam.none")}<');

// EmotionTab replacements
code = code.replace(/>Emotion Detection</g, '>{t("emotion.header")}<');
code = code.replace(/>Multi-task NLP model extracting primary emotion, gender, and age from text.</g, '>{t("emotion.desc")}<');
code = code.replace(/placeholder="Describe how you feel right now..."/g, 'placeholder={t("emotion.placeholder")}');
code = code.replace(/>Detect Emotion</g, '>{t("emotion.analyze_btn")}<');
code = code.replace(/>Processing...</g, '>{t("emotion.analyzing")}<');
code = code.replace(/>Primary Emotion</g, '>{t("emotion.primary_emotion")}<');
code = code.replace(/>Predicted Gender</g, '>{t("emotion.gender")}<');
code = code.replace(/>Predicted Age Group</g, '>{t("emotion.age")}<');
code = code.replace(/>Top Emotions</g, '>{t("emotion.top_emotions")}<');

// SkinCancerTab replacements
code = code.replace(/>Skin Lesion Analysis</g, '>{t("skin.header")}<');
code = code.replace(/>Computer vision demo identifying 7 types of skin lesions using a PyTorch CNN.</g, '>{t("skin.desc")}<');
code = code.replace(/>Drag and drop a skin image here</g, '>{t("skin.upload_box")}<');
code = code.replace(/>or click to browse files</g, '>{t("skin.upload_sub")}<');
code = code.replace(/>Supported formats: JPEG, PNG</g, '>{t("skin.supported")}<');
code = code.replace(/>Analyze Image</g, '>{t("skin.analyze_btn")}<');
code = code.replace(/>Processing Image...</g, '>{t("skin.analyzing")}<');
code = code.replace(/>Diagnostic Results</g, '>{t("skin.results")}<');
code = code.replace(/>Risk Level</g, '>{t("skin.risk_level")}<');
code = code.replace(/>High Risk \(Cancerous\)</g, '>{t("skin.malignant")}<');
code = code.replace(/>Low Risk \(Benign\)</g, '>{t("skin.benign")}<');
code = code.replace(/>Top Predictions</g, '>{t("skin.top_predictions")}<');
code = code.replace(/>Probability</g, '>{t("skin.probability")}<');

// CancerTab replacements
code = code.replace(/>Breast Cancer Prediction</g, '>{t("cancer.header")}<');
code = code.replace(/>Tabular data model predicting malignancy from cell nuclei features.</g, '>{t("cancer.desc")}<');
code = code.replace(/>Run Prediction</g, '>{t("cancer.predict_btn")}<');
code = code.replace(/>Calculating...</g, '>{t("cancer.predicting")}<');
code = code.replace(/>Prediction Results</g, '>{t("cancer.results")}<');
code = code.replace(/>Malignant \(Cancerous\)</g, '>{t("cancer.malignant")}<');
code = code.replace(/>Benign \(Safe\)</g, '>{t("cancer.benign")}<');
code = code.replace(/>Risk Analysis</g, '>{t("cancer.risk")}<');
code = code.replace(/>Top Contributing Features</g, '>{t("cancer.top_features")}<');

fs.writeFileSync('app/[locale]/ml/page.tsx', code);

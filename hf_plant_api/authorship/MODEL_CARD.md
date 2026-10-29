# Model Card: AI Authorship & Robustness Classifiers (v1.0.0)

## 1. Model Overview
- **Name:** AI Authorship & Robustness Multi-Model Ensemble
- **Version:** 1.0.0
- **Task:** Binary text classification (Human-written vs. AI-generated text)
- **Positive Class:** 1 (AI-Generated)
- **Negative Class:** 0 (Human-Written)
- **Framework:** scikit-learn (CPU inference, zero GPU requirement)
- **Artifact:** `authorship_bundle_v1.pkl`

---

## 2. Architecture & Feature Pipeline

All three models share a single, unified text feature representation to eliminate redundant vectorization overhead:

1. **Shared Feature Representation:**
   - **Word-Level TF-IDF:** N-gram range `(1, 2)` (unigrams and bigrams), `max_features=12,000`, `min_df=2`, `sublinear_tf=True`, Unicode accent stripping.
   - **Character-Level TF-IDF:** N-gram range `(3, 5)` (char 3-5 n-grams), `max_features=18,000`, `min_df=5`, `sublinear_tf=True`.
   - **Combined Representation:** `FeatureUnion` providing up to 30,000 sparse TF-IDF features capturing lexical choice, phrasal transitions, sub-word morphology, and punctuation rhythm.
   - Fitted **strictly on the training split** (70%, 8,088 samples) — zero test data leakage.

2. **Model A: Multinomial Naive Bayes (MNB)**
   - Additive smoothing: `alpha=0.1`, `fit_prior=True`.
   - Function: Fast probabilistic baseline with closed-form Bayes updates.
   - Properties: Extremely fast inference (<1 ms), low memory footprint.

3. **Model B: Logistic Regression (LR)**
   - Regularization: L2 penalty, `C=1.0`, solver `lbfgs`, `max_iter=1000`, deterministic `random_state=42`.
   - Function: Well-calibrated linear probability model preserving direct feature coefficients for interpretability.
   - Properties: Direct token/n-gram attribution for explaining AI vs Human stylistic signals.

4. **Model C: Calibrated Linear Support Vector Classifier (LinearSVC)**
   - Base Classifier: `LinearSVC(C=0.5, max_iter=2000, random_state=42, dual='auto')`.
   - Calibration Method: Platt scaling (`method='sigmoid'`) via 3-fold cross-validation on training data (`CalibratedClassifierCV`).
   - Function: Maximum-margin hyperplane with proper posterior probability outputs. Decision function scores are not presented directly as uncalibrated probabilities.

---

## 3. Dataset & Provenance
- **Dataset:** AH&AITD – Arslan's Human and AI Text Database
- **DOI / URL:** [10.5281/zenodo.15506369](https://doi.org/10.5281/zenodo.15506369)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Raw Samples:** 11,580 (5,790 Human, 5,790 AI)
- **Data Quality Audit:**
  - Null texts / labels removed: 0
  - Exact duplicate texts removed: 25
  - Conflicting label texts: 0
  - Cleaned unique samples: 11,555 (5,766 Human, 5,789 AI)
- **Text Lengths:** Mean 727 words (Median 552 words, Min 266 words, Max 5,958 words).

---

## 4. Evaluation Protocol
- **Deterministic Stratified Splits (Seed 42):**
  - **Train:** 70% (8,088 samples: 4,036 Human, 4,052 AI)
  - **Validation:** 15% (1,733 samples: 865 Human, 868 AI)
  - **Test (Held-Out):** 15% (1,734 samples: 865 Human, 869 AI)
- **Protocol Rules:**
  - Held-out test set remained completely untouched until final evaluation.
  - All three models evaluated on the exact same 1,734 held-out test examples.
  - Multi-dimensional evaluation: Overall metrics, text-length slices (<400w, 400-800w, >800w), source domains, AI generator types, and controlled text perturbations.

---

## 5. Perturbation Robustness Protocol
The held-out test set was evaluated under five controlled text transformations to test classifier vulnerability to simple evasions or formatting artifacts:
1. **Whitespace Padding:** Doubles inter-word spaces to evaluate sensitivity to spacing quirks.
2. **Lowercase Normalization:** Converts all characters to lowercase to evaluate case reliance.
3. **Title Case Transformation:** Capitalizes the first letter of each word to simulate unconventional casing.
4. **Punctuation Removal:** Strips all standard punctuation to test reliance on commas, colons, and hyphens.
5. **Punctuation Doubling:** Doubles sentence delimiters and commas to simulate noisy syntax.

---

## 6. Intended Use & Deployment Constraints
- **Intended Use:** Educational and exploratory research in distinguishing AI-generated text from human writing across multiple domains and generation architectures.
- **Resource Limits:**
  - Target environment: CPU-only, 512 MB RAM (e.g. Render free tier).
  - Artifact size: < 25 MB compressed `joblib` bundle.
  - Inference Latency: < 10 ms per sample on CPU.
  - No GPU or external paid API required.

---

## 7. Limitations & Ethical Considerations
- **Domain Generalization:** The dataset comprises specific domains (OpenWebText, opinions, Q&A, news, abstracts) and generator models (GPT-2, GPT-3, GPT-3.5, GPT-4, Flan-T5, OPT-IML). Generalization to future LLMs or unseen specialized domains (e.g. legal briefs, code) may be lower.
- **False Positive Risk:** Classifiers should **never** be used as an automated academic misconduct penalty or disciplinary trigger. Human oversight and multi-signal review are essential.
- **Adversarial Perturbations:** While classical n-gram models show notable resilience, deliberate adversarial obfuscation (e.g. synonym insertion, zero-width spaces) can alter detection probabilities.

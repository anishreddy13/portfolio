"""
Reproducible configuration for AI Authorship & Robustness Lab.
Defines deterministic seeds, paths, feature extractor limits, and model parameters.
"""
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATASET_PATH = DATA_DIR / "Dataset.xlsx"
CLEANED_DATASET_PATH = DATA_DIR / "authorship_clean.parquet"
ARTIFACT_BUNDLE_PATH = BASE_DIR / "authorship_bundle_v1.pkl"
BENCHMARK_RESULTS_PATH = Path(__file__).resolve().parent / "benchmark_results.json"
DATASET_MANIFEST_PATH = Path(__file__).resolve().parent / "dataset_manifest.json"

# Dataset Provenance & URLs
DATASET_NAME = "AH&AITD – Arslan's Human and AI Text Database"
DATASET_URL = "https://zenodo.org/records/15506369/files/Dataset.xlsx?download=1"
DATASET_API_URL = "https://zenodo.org/api/records/15506369/files/Dataset.xlsx/content"
DATASET_DOI = "https://doi.org/10.5281/zenodo.15506369"
DATASET_LICENSE = "Creative Commons Attribution 4.0 International (CC BY 4.0)"
EXPECTED_MD5 = "55f3d63b9c3fecfd9807fdd4b5473d3b"
EXPECTED_RAW_SAMPLES = 11580

# Observed Training Distribution Text Lengths (from dataset_manifest.json)
def _load_manifest_statistics():
    defaults = (266, 5958, 1379, 32767)
    if not DATASET_MANIFEST_PATH.exists():
        return defaults
    try:
        import json as _json
        with open(DATASET_MANIFEST_PATH, "r", encoding="utf-8") as _f:
            _data = _json.load(_f)
            _stats = _data.get("text_statistics", {})
            return (
                int(_stats.get("word_count_min", 266)),
                int(_stats.get("word_count_max", 5958)),
                int(_stats.get("char_len_min", 1379)),
                int(_stats.get("char_len_max", 32767)),
            )
    except Exception:
        return defaults

TRAINING_WORD_COUNT_MIN, TRAINING_WORD_COUNT_MAX, TRAINING_CHAR_LEN_MIN, TRAINING_CHAR_LEN_MAX = _load_manifest_statistics()

# Deterministic Seed
RANDOM_SEED = 42

# Train / Validation / Test Split (70% train, 15% validation, 15% test)
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# Feature Extraction Settings (Shared FeatureUnion)
# Word TF-IDF: unigram + bigram (up to 12,000 features)
WORD_NGRAM_RANGE = (1, 2)
WORD_MAX_FEATURES = 12000
WORD_MIN_DF = 2

# Char TF-IDF: char n-grams 3 to 5 (up to 18,000 features)
CHAR_NGRAM_RANGE = (3, 5)
CHAR_MAX_FEATURES = 18000
CHAR_MIN_DF = 5

# Label Mapping: Explicit Positive Class = AI-generated (1), Negative Class = Human (0)
POSITIVE_LABEL = 1  # AI
NEGATIVE_LABEL = 0  # Human
CLASS_NAMES = ["Human", "AI"]

# Model Hyperparameters
MODEL_PARAMS = {
    "naive_bayes": {
        "alpha": 0.1,
        "fit_prior": True
    },
    "logistic_regression": {
        "C": 1.0,
        "max_iter": 1000,
        "random_state": RANDOM_SEED,
        "solver": "lbfgs"
    },
    "calibrated_svm": {
        "svm_c": 0.5,
        "max_iter": 2000,
        "random_state": RANDOM_SEED,
        "calibration_method": "sigmoid",
        "cv": 3
    }
}

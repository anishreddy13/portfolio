"""
Unit and smoke tests for AI Authorship & Robustness Lab.
Covers data validation, bundle loading, single/batch inference,
metric calculations, and perturbation transforms.
"""
import numpy as np
import pytest
from pathlib import Path

from authorship.config import (
    ARTIFACT_BUNDLE_PATH,
    BENCHMARK_RESULTS_PATH,
    DATASET_MANIFEST_PATH,
    RANDOM_SEED
)
from authorship.model import AuthorshipBundle
from authorship.evaluate import (
    compute_model_metrics,
    perturb_whitespace,
    perturb_lowercase,
    perturb_titlecase,
    perturb_strip_punctuation,
    perturb_extra_punctuation
)


def test_metric_calculations_perfect_predictions():
    """Verify compute_model_metrics returns exact scores for perfect predictions."""
    y_true = np.array([0, 0, 1, 1])
    y_prob = np.array([0.05, 0.10, 0.95, 0.90])
    metrics = compute_model_metrics(y_true, y_prob)

    assert metrics["accuracy"] == 1.0
    assert metrics["precision_ai"] == 1.0
    assert metrics["recall_ai"] == 1.0
    assert metrics["f1_ai"] == 1.0
    assert metrics["roc_auc"] == 1.0
    assert metrics["confusion_matrix"]["tp"] == 2
    assert metrics["confusion_matrix"]["tn"] == 2
    assert metrics["confusion_matrix"]["fp"] == 0
    assert metrics["confusion_matrix"]["fn"] == 0


def test_metric_calculations_imperfect_predictions():
    """Verify compute_model_metrics handles classification errors correctly."""
    y_true = np.array([0, 0, 1, 1])
    y_prob = np.array([0.80, 0.10, 0.20, 0.90])  # 1 FP, 1 FN
    metrics = compute_model_metrics(y_true, y_prob)

    assert metrics["accuracy"] == 0.5
    assert metrics["confusion_matrix"]["fp"] == 1
    assert metrics["confusion_matrix"]["fn"] == 1
    assert metrics["confusion_matrix"]["tp"] == 1
    assert metrics["confusion_matrix"]["tn"] == 1
    assert 0.0 <= metrics["brier_score"] <= 1.0


def test_perturbation_transforms():
    """Verify text perturbation functions apply exact expected transformations."""
    sample = "Hello, world! This is a test."

    ws = perturb_whitespace(sample)
    assert "  " in ws

    lc = perturb_lowercase(sample)
    assert lc == "hello, world! this is a test."

    tc = perturb_titlecase(sample)
    assert "Hello," in tc and "World!" in tc

    punct_stripped = perturb_strip_punctuation(sample)
    assert "," not in punct_stripped and "!" not in punct_stripped and "." not in punct_stripped

    extra_punct = perturb_extra_punctuation(sample)
    assert ",," in extra_punct or "!!" in extra_punct


def test_dataset_manifest_exists_and_valid():
    """Verify dataset_manifest.json exists and conforms to required schema."""
    if not DATASET_MANIFEST_PATH.exists():
        pytest.skip("Dataset manifest not generated yet.")

    import json
    with open(DATASET_MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert "dataset_name" in manifest
    assert "license" in manifest
    assert "raw_sample_count" in manifest
    assert manifest["raw_sample_count"] == 11580
    assert manifest["final_clean_sample_count"] > 11000
    assert manifest["final_class_distribution"]["Human (0)"] > 5000
    assert manifest["final_class_distribution"]["AI (1)"] > 5000


def test_bundle_artifact_and_inference():
    """Verify AuthorshipBundle can be loaded and produces well-formed predictions."""
    if not ARTIFACT_BUNDLE_PATH.exists():
        pytest.skip("Bundle artifact not generated yet.")

    bundle = AuthorshipBundle.load(ARTIFACT_BUNDLE_PATH)
    assert bundle is not None
    assert "naive_bayes" in bundle.models
    assert "logistic_regression" in bundle.models
    assert "calibrated_svm" in bundle.models

    # Single inference test
    text = (
        "Furthermore, utilizing stochastic gradient estimation across distributed clusters "
        "significantly enhances computational throughput while maintaining low variance."
    )
    result = bundle.predict_single(text)

    assert "predictions" in result
    assert "consensus" in result
    assert result["text_length_words"] > 0
    assert result["text_length_chars"] > 0

    for model_name in ["naive_bayes", "logistic_regression", "calibrated_svm"]:
        pred = result["predictions"][model_name]
        assert pred["label"] in ["AI", "Human"]
        assert 0.0 <= pred["ai_probability"] <= 1.0
        assert 0.0 <= pred["human_probability"] <= 1.0
        assert round(pred["ai_probability"] + pred["human_probability"], 2) == 1.0

    consensus = result["consensus"]
    assert consensus["consensus_label"] in ["AI", "Human"]
    assert consensus["ai_votes"] + consensus["human_votes"] == 3


def test_bundle_explainability():
    """Verify logistic regression coefficients are available for explainability."""
    if not ARTIFACT_BUNDLE_PATH.exists():
        pytest.skip("Bundle artifact not generated yet.")

    bundle = AuthorshipBundle.load(ARTIFACT_BUNDLE_PATH)
    text = "The quick brown fox jumps over the lazy dog."
    explanations = bundle.explain(text, top_k=5)

    assert isinstance(explanations, list)
    for exp in explanations:
        assert "feature" in exp
        assert "coefficient" in exp
        assert "contribution" in exp
        assert exp["direction"] in ["AI", "Human"]

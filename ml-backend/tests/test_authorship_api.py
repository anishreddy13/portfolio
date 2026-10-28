"""
Integration and API tests for Authorship & Robustness Lab endpoints.
Tests /predict/authorship, /benchmark/authorship, /health, and error handling.
"""
import pytest
from fastapi.testclient import TestClient

from main import app, AUTHORSHIP_BUNDLE_PATH, BENCHMARK_RESULTS_PATH


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_includes_authorship_model(client):
    """Verify /health endpoint retains all pre-existing fields and adds authorship_model."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ok"
    assert "models" in data
    models = data["models"]

    # Pre-existing models
    assert "sentiment_model" in models
    assert "spam_model" in models
    assert "emotion_model" in models
    assert "cancer_model" in models
    assert "plant_model" in models

    # Authorship model
    assert "authorship_model" in models
    assert models["authorship_model"] is True


def test_predict_authorship_valid_input(client):
    """Verify POST /predict/authorship returns all 3 models with valid predictions."""
    sample_text = (
        "In this empirical paper, we demonstrate that neural scaling laws hold across varied "
        "architectures and modalities. We systematically evaluate loss convergence rates and identify "
        "power-law scaling coefficients under controlled compute regimes."
    )
    response = client.post("/predict/authorship", json={"text": sample_text})
    assert response.status_code == 200
    data = response.json()

    assert "model_version" in data
    assert data["text_length_chars"] == len(sample_text)
    assert data["text_length_words"] == len(sample_text.split())

    # Check 3 models returned
    assert "predictions" in data
    preds = data["predictions"]
    for model_key in ["naive_bayes", "logistic_regression", "calibrated_svm"]:
        assert model_key in preds
        m = preds[model_key]
        assert m["predicted_label"] in ["Human-written", "AI-generated"]
        assert m["predicted_class"] in [0, 1]
        assert 0.0 <= m["ai_probability"] <= 1.0
        assert 0.0 <= m["human_probability"] <= 1.0
        assert 0.0 <= m["confidence"] <= 1.0
        assert "score_type" in m

    # Consensus
    assert "consensus" in data
    consensus = data["consensus"]
    assert consensus["majority_vote_label"] in ["Human-written", "AI-generated"]
    assert consensus["majority_vote_class"] in [0, 1]
    assert consensus["ai_votes"] + consensus["human_votes"] == 3
    assert consensus["agreement"] in ["unanimous", "disagreement"]

    # Explanations
    assert "explanations" in data
    assert isinstance(data["explanations"], list)

    # Disclaimer
    assert "limitations_disclaimer" in data
    assert len(data["limitations_disclaimer"]) > 10


def test_predict_authorship_empty_and_whitespace_rejection(client):
    """Verify empty or whitespace-only inputs are rejected with 400."""
    res_empty = client.post("/predict/authorship", json={"text": ""})
    assert res_empty.status_code == 400

    res_ws = client.post("/predict/authorship", json={"text": "    \n\t  "})
    assert res_ws.status_code == 400


def test_predict_authorship_max_length_rejection(client):
    """Verify input exceeding 40,000 characters is rejected with 400."""
    giant_text = "word " * 10000  # ~50,000 chars
    response = client.post("/predict/authorship", json={"text": giant_text})
    assert response.status_code == 400
    assert "40,000" in response.json()["detail"]


def test_predict_authorship_length_warning(client):
    """Verify out-of-distribution length warning is present for short inputs (<266 words) and long inputs (>5,958 words)."""
    # Short text warning (<266 words)
    short_text = "This is a very short text sample with less than twenty words."
    response = client.post("/predict/authorship", json={"text": short_text})
    assert response.status_code == 200
    data = response.json()
    assert data["length_warning"] is not None
    assert "below the observed training distribution" in data["length_warning"]

    # Long text warning (>5958 words, but within 40,000 char limit)
    # 6000 two-letter words = 18,000 characters
    long_text = "ai " * 6000
    assert len(long_text) <= 40000
    assert len(long_text.split()) > 5958
    res_long = client.post("/predict/authorship", json={"text": long_text})
    assert res_long.status_code == 200
    data_long = res_long.json()
    assert data_long["length_warning"] is not None
    assert "exceeds the observed training distribution" in data_long["length_warning"]


def test_benchmark_authorship_endpoint(client):
    """Verify GET /benchmark/authorship returns genuine stored benchmark results."""
    response = client.get("/benchmark/authorship")
    assert response.status_code == 200
    data = response.json()

    assert "benchmark_metadata" in data
    assert "model_comparison" in data
    assert "subgroup_analysis" in data
    assert "perturbation_robustness_tests" in data

    comp = data["model_comparison"]
    for m in ["naive_bayes", "logistic_regression", "calibrated_svm"]:
        assert m in comp
        assert 0.0 <= comp[m]["accuracy"] <= 1.0
        assert 0.0 <= comp[m]["f1_ai"] <= 1.0
        assert 0.0 <= comp[m]["roc_auc"] <= 1.0
        assert comp[m]["test_sample_count"] == 1734


def test_predict_authorship_bundle_missing(client, monkeypatch):
    """Verify endpoint returns 503 when authorship bundle is missing."""
    import main
    monkeypatch.setattr(main, "authorship_bundle", None)
    response = client.post("/predict/authorship", json={"text": "Valid test text with enough content."})
    assert response.status_code == 503
    assert "not loaded" in response.json()["detail"]

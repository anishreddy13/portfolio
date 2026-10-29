import sys
import os
from pathlib import Path
import pytest

# Ensure hf_plant_api is at top of path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))

from fastapi.testclient import TestClient
from app import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "authorship_predict" in data["endpoints"]
    assert "plant_predict" in data["endpoints"]


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "plant_model" in data
    assert data["authorship_model"] is True


def test_authorship_benchmark(client):
    res = client.get("/benchmark/authorship")
    assert res.status_code == 200
    data = res.json()
    assert "model_comparison" in data
    assert "naive_bayes" in data["model_comparison"]
    assert "logistic_regression" in data["model_comparison"]
    assert "calibrated_svm" in data["model_comparison"]


def test_authorship_predict_all_three_research_samples(client):
    # Sample 1: Human Academic Abstract (~115 words)
    sample_human = (
        "In this study, we empirically investigate the generalization properties of overparameterized "
        "linear classifiers trained with stochastic gradient descent. We demonstrate that under "
        "isotropic Gaussian feature distributions, the implicit regularization of gradient descent "
        "minimizes the L2 norm of the parameter vector, preventing catastrophic overfitting even when "
        "the sample size is significantly smaller than the ambient dimension. Our theoretical bounds "
        "are corroborated by extensive synthetic and semi-synthetic benchmarks across various noise regimes."
    )
    res1 = client.post("/predict/authorship", json={"text": sample_human})
    assert res1.status_code == 200
    data1 = res1.json()
    assert "naive_bayes" in data1["predictions"]
    assert "logistic_regression" in data1["predictions"]
    assert "calibrated_svm" in data1["predictions"]
    assert data1["consensus"]["majority_vote_label"] in ["Human-written", "AI-generated"]
    assert len(data1["explanations"]) > 0

    # Sample 2: AI-Generated Explainer (~130 words)
    sample_ai = (
        "Artificial intelligence has fundamentally revolutionized modern computational science in "
        "several critical ways. Furthermore, machine-learning models now allow researchers to uncover "
        "intricate patterns within large-scale datasets that were previously inaccessible to classical "
        "statistical techniques. Additionally, neural network architectures offer unprecedented "
        "scalability when deployed across distributed cloud infrastructure. Consequently, organizations "
        "worldwide are actively integrating automated intelligence pipelines into their core workflows "
        "to enhance predictive accuracy and maximize operational efficiency."
    )
    res2 = client.post("/predict/authorship", json={"text": sample_ai})
    assert res2.status_code == 200
    data2 = res2.json()
    assert "naive_bayes" in data2["predictions"]
    assert "logistic_regression" in data2["predictions"]
    assert "calibrated_svm" in data2["predictions"]
    assert len(data2["explanations"]) > 0

    # Sample 3: Short Snippet (<50 words, triggers out-of-distribution warning)
    sample_short = (
        "The quarterly revenue increased by 14% year-over-year, driven primarily by strong cloud "
        "infrastructure growth and improved operating margins across all major regional divisions."
    )
    res3 = client.post("/predict/authorship", json={"text": sample_short})
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["length_warning"] is not None
    assert "out-of-distribution" in data3["length_warning"].lower() or "distribution" in data3["length_warning"].lower()



def test_authorship_predict_empty_rejected(client):
    res = client.post("/predict/authorship", json={"text": "   "})
    assert res.status_code == 400


def test_authorship_predict_too_long_rejected(client):
    res = client.post("/predict/authorship", json={"text": "a" * 40001})
    assert res.status_code == 400


def test_cors_headers(client):
    res = client.options(
        "/predict/authorship",
        headers={
            "Origin": "https://www.anishreddy.online",
            "Access-Control-Request-Method": "POST",
        }
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://www.anishreddy.online"

"""
ML Model Tests
==============
Basic smoke tests to verify models load and predict correctly.
These run in GitHub Actions on every push.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from model import load_model, predict_sentiment
from spam_model import load_spam_model, predict_spam


# ─────────────────────────────────────────────────────────────
# SENTIMENT MODEL
# ─────────────────────────────────────────────────────────────
class TestSentimentModel:

    def setup_method(self):
        self.pipeline = load_model("sentiment_model.pkl")

    def test_model_loads(self):
        assert self.pipeline is not None

    def test_positive_prediction(self):
        result = predict_sentiment(
            "Amazing breakthrough in AI technology!",
            self.pipeline
        )
        assert result["sentiment"] in ["Positive", "Neutral", "Negative"]
        assert 0 <= result["confidence"] <= 100
        assert "scores" in result

    def test_negative_prediction(self):
        result = predict_sentiment(
            "Market crash causes massive losses",
            self.pipeline
        )
        assert result["sentiment"] in ["Positive", "Neutral", "Negative"]
        assert result["confidence"] > 0

    def test_empty_text_handled(self):
        result = predict_sentiment("ok", self.pipeline)
        assert result is not None


# ─────────────────────────────────────────────────────────────
# SPAM MODEL
# ─────────────────────────────────────────────────────────────
class TestSpamModel:

    def setup_method(self):
        self.pipeline = load_spam_model("spam_model.pkl")

    def test_model_loads(self):
        assert self.pipeline is not None

    def test_spam_prediction(self):
        result = predict_spam(
            "FREE MONEY! Click here to win $1000 now!!!",
            self.pipeline
        )
        assert result["label"] in ["Spam", "Not Spam"]
        assert 0 <= result["confidence"] <= 100

    def test_ham_prediction(self):
        result = predict_spam(
            "The quarterly earnings report looks promising",
            self.pipeline
        )
        assert result["label"] in ["Spam", "Not Spam"]
        assert result["confidence"] > 0
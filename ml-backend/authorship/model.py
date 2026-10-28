"""
Authorship Model Bundle and Inference Engine.
Encapsulates shared feature extractor (Word + Char TF-IDF) and three classifiers
(Multinomial Naive Bayes, Logistic Regression, Calibrated Linear SVM) in a single bundle.
"""
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, List, Union, Optional
import joblib
import numpy as np


class AuthorshipBundle:
    """
    Shared inference bundle containing one fitted FeatureUnion vectorizer
    and three classical classifiers.
    """
    __module__ = "authorship.model"

    def __init__(
        self,
        vectorizer: Any,
        models: Dict[str, Any],
        feature_names: Optional[List[str]] = None,
        logistic_coef: Optional[np.ndarray] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.vectorizer = vectorizer
        self.models = models
        self.feature_names = feature_names or []
        self.logistic_coef = logistic_coef
        self.metadata = metadata or {}
        self._ensure_sklearn_compat()

    def _ensure_sklearn_compat(self) -> None:
        """
        Cross-version compatibility helper for scikit-learn.
        Restores missing attributes expected by scikit-learn 1.5.2 (e.g. multi_class).
        """
        models = getattr(self, "models", None)
        if isinstance(models, dict):
            lr = models.get("logistic_regression")
            if lr is not None and not hasattr(lr, "multi_class"):
                lr.multi_class = "auto"

    def __setstate__(self, state: Dict[str, Any]) -> None:
        """Handle unpickling cleanly across differing scikit-learn versions."""
        self.__dict__.update(state)
        self._ensure_sklearn_compat()

    def predict_single(self, text: str) -> Dict[str, Any]:
        """
        Run inference across all three models for a single text sample.
        Returns probabilities, predicted labels, and ensemble consensus.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty.")

        self._ensure_sklearn_compat()
        X = self.vectorizer.transform([text])
        words = text.split()
        char_count = len(text)
        word_count = len(words)

        predictions: Dict[str, Dict[str, Any]] = {}
        ai_votes = 0
        human_votes = 0
        ai_probs: List[float] = []

        for model_key, model in self.models.items():
            probs = model.predict_proba(X)[0]
            # Class 0: Human, Class 1: AI
            human_prob = float(probs[0])
            ai_prob = float(probs[1])
            predicted_class = 1 if ai_prob >= 0.5 else 0
            label = "AI" if predicted_class == 1 else "Human"

            if predicted_class == 1:
                ai_votes += 1
            else:
                human_votes += 1

            ai_probs.append(ai_prob)

            predictions[model_key] = {
                "label": label,
                "predicted_class": predicted_class,
                "ai_probability": round(ai_prob, 4),
                "human_probability": round(human_prob, 4),
                "confidence": round(max(ai_prob, human_prob), 4),
            }

        mean_ai_prob = float(np.mean(ai_probs))
        consensus_label = "AI" if ai_votes >= 2 else "Human"

        return {
            "text_length_chars": char_count,
            "text_length_words": word_count,
            "predictions": predictions,
            "consensus": {
                "ai_votes": ai_votes,
                "human_votes": human_votes,
                "mean_ai_probability": round(mean_ai_prob, 4),
                "consensus_label": consensus_label,
            },
        }

    def predict_batch(self, texts: List[str], model_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Run inference for a batch of text samples.
        """
        return [self.predict_single(t) for t in texts]

    def explain(self, text: str, top_k: int = 8) -> List[Dict[str, Any]]:
        """
        Extract top influential n-grams for the input text based on
        Logistic Regression feature coefficients.
        Positive coefficient indicates association with AI-generated text;
        Negative coefficient indicates association with human-written text.
        """
        if not self.feature_names or self.logistic_coef is None:
            return []

        X = self.vectorizer.transform([text])
        non_zero_indices = X.nonzero()[1]

        if len(non_zero_indices) == 0:
            return []

        explanations = []
        for idx in non_zero_indices:
            feat_name = self.feature_names[idx]
            tfidf_val = float(X[0, idx])
            coef = float(self.logistic_coef[idx])
            contribution = tfidf_val * coef

            explanations.append({
                "feature": feat_name,
                "tfidf": round(tfidf_val, 4),
                "coefficient": round(coef, 4),
                "contribution": round(contribution, 4),
                "direction": "AI" if contribution > 0 else "Human"
            })

        # Sort by absolute contribution magnitude
        explanations.sort(key=lambda item: abs(item["contribution"]), reverse=True)
        return explanations[:top_k]

    def save(self, file_path: Union[str, Path]) -> None:
        """Serialize bundle using joblib with compression."""
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path, compress=3)

    @classmethod
    def load(cls, file_path: Union[str, Path]) -> "AuthorshipBundle":
        """Load bundle from file."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Bundle artifact not found at {path}")
        bundle = joblib.load(path)
        if not isinstance(bundle, cls):
            raise TypeError(f"Loaded object is {type(bundle)}, expected AuthorshipBundle")
        bundle._ensure_sklearn_compat()
        return bundle

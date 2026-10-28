"""
Comprehensive evaluation protocol for AI Authorship & Robustness Lab.
Computes core metrics, per-class metrics, ROC-AUC, PR-AUC, Brier score,
subgroup slices (text-length, domain, generator), and controlled perturbation tests.
"""
import re
import string
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    classification_report
)


def compute_model_metrics(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Compute comprehensive classification and calibration metrics for a single model.
    Positive class is strictly defined as 1 (AI-generated).
    """
    y_pred = (y_prob >= threshold).astype(int)

    acc = float(accuracy_score(y_true, y_pred))
    prec_binary = float(precision_score(y_true, y_pred, pos_label=1, zero_division=0))
    rec_binary = float(recall_score(y_true, y_pred, pos_label=1, zero_division=0))
    f1_binary = float(f1_score(y_true, y_pred, pos_label=1, zero_division=0))

    prec_macro = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    rec_macro = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    f1_weighted = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = 0.5

    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except Exception:
        pr_auc = 0.5

    try:
        brier = float(brier_score_loss(y_true, y_prob))
    except Exception:
        brier = float(np.mean((y_prob - y_true) ** 2))

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist()
    # cm is [[TN, FP], [FN, TP]]
    tn, fp = cm[0][0], cm[0][1]
    fn, tp = cm[1][0], cm[1][1]

    # Per-class breakdowns
    human_prec = float(precision_score(y_true, y_pred, pos_label=0, zero_division=0))
    human_rec = float(recall_score(y_true, y_pred, pos_label=0, zero_division=0))
    human_f1 = float(f1_score(y_true, y_pred, pos_label=0, zero_division=0))
    human_support = int(np.sum(y_true == 0))

    ai_support = int(np.sum(y_true == 1))

    return {
        "accuracy": round(acc, 4),
        "precision_ai": round(prec_binary, 4),
        "recall_ai": round(rec_binary, 4),
        "f1_ai": round(f1_binary, 4),
        "precision_macro": round(prec_macro, 4),
        "recall_macro": round(rec_macro, 4),
        "f1_macro": round(f1_macro, 4),
        "f1_weighted": round(f1_weighted, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": {
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "tp": tp,
            "raw_matrix": cm,
            "description": "[[True Human, False AI], [False Human, True AI]]"
        },
        "per_class": {
            "human_0": {
                "precision": round(human_prec, 4),
                "recall": round(human_rec, 4),
                "f1": round(human_f1, 4),
                "support": human_support
            },
            "ai_1": {
                "precision": round(prec_binary, 4),
                "recall": round(rec_binary, 4),
                "f1": round(f1_binary, 4),
                "support": ai_support
            }
        },
        "test_sample_count": len(y_true)
    }


def evaluate_length_slices(
    df_test: pd.DataFrame,
    bundle: Any
) -> Dict[str, Dict[str, Any]]:
    """
    Evaluate all models across text-length bands based on word count.
    Short: < 400 words
    Medium: 400 - 800 words
    Long: > 800 words
    """
    bands = {
        "short (<400 words)": df_test[df_test["word_count"] < 400],
        "medium (400-800 words)": df_test[(df_test["word_count"] >= 400) & (df_test["word_count"] <= 800)],
        "long (>800 words)": df_test[df_test["word_count"] > 800]
    }

    results = {}
    for band_name, subset in bands.items():
        if len(subset) == 0:
            continue
        X_sub = bundle.vectorizer.transform(subset["clean_text"])
        y_true = subset["target"].to_numpy()

        band_results = {
            "sample_count": len(subset),
            "human_count": int(np.sum(y_true == 0)),
            "ai_count": int(np.sum(y_true == 1)),
            "models": {}
        }

        for model_name, model in bundle.models.items():
            probs = model.predict_proba(X_sub)[:, 1]
            metrics = compute_model_metrics(y_true, probs)
            band_results["models"][model_name] = {
                "accuracy": metrics["accuracy"],
                "precision_ai": metrics["precision_ai"],
                "recall_ai": metrics["recall_ai"],
                "f1_ai": metrics["f1_ai"],
                "roc_auc": metrics["roc_auc"],
                "brier_score": metrics["brier_score"]
            }

        results[band_name] = band_results

    return results


def evaluate_source_domain_slices(
    df_test: pd.DataFrame,
    bundle: Any
) -> Dict[str, Dict[str, Any]]:
    """
    Evaluate prediction performance across writing domains (for human samples)
    and AI generators (for AI samples).
    """
    results = {}
    if "source" not in df_test.columns:
        return results

    unique_sources = df_test["source"].dropna().unique()

    for src in sorted(unique_sources):
        subset = df_test[df_test["source"] == src]
        if len(subset) < 15:  # skip very small slices for statistical stability
            continue

        X_sub = bundle.vectorizer.transform(subset["clean_text"])
        y_true = subset["target"].to_numpy()
        is_homogeneous = len(np.unique(y_true)) == 1

        src_results = {
            "sample_count": len(subset),
            "human_count": int(np.sum(y_true == 0)),
            "ai_count": int(np.sum(y_true == 1)),
            "models": {}
        }

        for model_name, model in bundle.models.items():
            probs = model.predict_proba(X_sub)[:, 1]
            preds = (probs >= 0.5).astype(int)
            acc = float(accuracy_score(y_true, preds))
            mean_ai_prob = float(np.mean(probs))

            model_dict = {
                "accuracy": round(acc, 4),
                "mean_ai_probability": round(mean_ai_prob, 4),
            }

            if not is_homogeneous:
                f1 = float(f1_score(y_true, preds, pos_label=1, zero_division=0))
                model_dict["f1_ai"] = round(f1, 4)

            src_results["models"][model_name] = model_dict

        results[str(src)] = src_results

    return results


# Perturbation Transformation Helpers
def perturb_whitespace(text: str) -> str:
    """Simulate irregular spacing by doubling spaces between words and adding margin padding."""
    words = text.split()
    return "  ".join(words)


def perturb_lowercase(text: str) -> str:
    """Normalize text completely to lowercase."""
    return text.lower()


def perturb_titlecase(text: str) -> str:
    """Convert text to title case."""
    return text.title()


def perturb_strip_punctuation(text: str) -> str:
    """Remove all punctuation marks from text."""
    translator = str.maketrans('', '', string.punctuation)
    return text.translate(translator)


def perturb_extra_punctuation(text: str) -> str:
    """Add duplicate sentence terminators and comma noise."""
    text_mod = re.sub(r'([.?!])', r'\1\1', text)
    text_mod = text_mod.replace(',', ',,')
    return text_mod


PERTURBATIONS = {
    "whitespace_padding": {
        "fn": perturb_whitespace,
        "description": "Doubles inter-word spacing to test robustness to spacing artifacts."
    },
    "lowercase_normalization": {
        "fn": perturb_lowercase,
        "description": "Converts all characters to lowercase to evaluate case sensitivity."
    },
    "titlecase_transform": {
        "fn": perturb_titlecase,
        "description": "Converts every word to Title Case to assess sensitivity to non-standard casing."
    },
    "punctuation_removal": {
        "fn": perturb_strip_punctuation,
        "description": "Strips all ASCII punctuation to test syntactic/delimiter reliance."
    },
    "punctuation_doubling": {
        "fn": perturb_extra_punctuation,
        "description": "Doubles commas and sentence-ending punctuation (.. and ??) to simulate noisy syntax."
    }
}


def evaluate_perturbations(
    df_test: pd.DataFrame,
    bundle: Any,
    baseline_metrics: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Run controlled text perturbations on held-out test texts.
    Records perturbed performance and delta vs baseline.
    """
    perturbation_results = {}
    y_true = df_test["target"].to_numpy()

    for pert_key, pert_info in PERTURBATIONS.items():
        transform_fn = pert_info["fn"]
        perturbed_texts = [transform_fn(t) for t in df_test["clean_text"]]
        X_pert = bundle.vectorizer.transform(perturbed_texts)

        pert_entry = {
            "description": pert_info["description"],
            "sample_count": len(perturbed_texts),
            "models": {}
        }

        for model_name, model in bundle.models.items():
            probs = model.predict_proba(X_pert)[:, 1]
            metrics = compute_model_metrics(y_true, probs)
            base_acc = baseline_metrics[model_name]["accuracy"]
            base_f1 = baseline_metrics[model_name]["f1_ai"]

            acc_delta = round(metrics["accuracy"] - base_acc, 4)
            f1_delta = round(metrics["f1_ai"] - base_f1, 4)

            pert_entry["models"][model_name] = {
                "accuracy": metrics["accuracy"],
                "precision_ai": metrics["precision_ai"],
                "recall_ai": metrics["recall_ai"],
                "f1_ai": metrics["f1_ai"],
                "roc_auc": metrics["roc_auc"],
                "brier_score": metrics["brier_score"],
                "accuracy_delta": acc_delta,
                "f1_delta": f1_delta
            }

        perturbation_results[pert_key] = pert_entry

    return perturbation_results

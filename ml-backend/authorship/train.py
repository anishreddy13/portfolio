"""
Training and evaluation orchestration pipeline for AI Authorship & Robustness Lab.
Executes deterministic split, shared FeatureUnion fitting, three model training,
validation checks, final held-out test evaluation, perturbation experiments,
and exports benchmark_results.json and authorship_bundle_v1.pkl.
"""
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import FeatureUnion
from sklearn.svm import LinearSVC

try:
    from authorship.acquire import download_dataset, audit_and_prepare_dataset
    from authorship.config import (
        RAW_DATASET_PATH,
        ARTIFACT_BUNDLE_PATH,
        BENCHMARK_RESULTS_PATH,
        RANDOM_SEED,
        TRAIN_RATIO,
        VAL_RATIO,
        TEST_RATIO,
        WORD_NGRAM_RANGE,
        WORD_MAX_FEATURES,
        WORD_MIN_DF,
        CHAR_NGRAM_RANGE,
        CHAR_MAX_FEATURES,
        CHAR_MIN_DF,
        MODEL_PARAMS,
        DATASET_NAME,
        DATASET_DOI,
        DATASET_LICENSE
    )
    from authorship.evaluate import (
        compute_model_metrics,
        evaluate_length_slices,
        evaluate_source_domain_slices,
        evaluate_perturbations
    )
    from authorship.model import AuthorshipBundle
except ImportError:
    from acquire import download_dataset, audit_and_prepare_dataset
    from config import (
        RAW_DATASET_PATH,
        ARTIFACT_BUNDLE_PATH,
        BENCHMARK_RESULTS_PATH,
        RANDOM_SEED,
        TRAIN_RATIO,
        VAL_RATIO,
        TEST_RATIO,
        WORD_NGRAM_RANGE,
        WORD_MAX_FEATURES,
        WORD_MIN_DF,
        CHAR_NGRAM_RANGE,
        CHAR_MAX_FEATURES,
        CHAR_MIN_DF,
        MODEL_PARAMS,
        DATASET_NAME,
        DATASET_DOI,
        DATASET_LICENSE
    )
    from evaluate import (
        compute_model_metrics,
        evaluate_length_slices,
        evaluate_source_domain_slices,
        evaluate_perturbations
    )
    from model import AuthorshipBundle

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def create_feature_extractor() -> FeatureUnion:
    """
    Build shared FeatureUnion combining word TF-IDF and character TF-IDF.
    """
    word_vec = TfidfVectorizer(
        ngram_range=WORD_NGRAM_RANGE,
        max_features=WORD_MAX_FEATURES,
        min_df=WORD_MIN_DF,
        sublinear_tf=True,
        strip_accents="unicode"
    )

    char_vec = TfidfVectorizer(
        ngram_range=CHAR_NGRAM_RANGE,
        analyzer="char",
        max_features=CHAR_MAX_FEATURES,
        min_df=CHAR_MIN_DF,
        sublinear_tf=True
    )

    return FeatureUnion([
        ("word_tfidf", word_vec),
        ("char_tfidf", char_vec)
    ])


def run_training_and_evaluation() -> Dict[str, Any]:
    """
    Execute full deterministic training, test evaluation, and artifact bundling.
    """
    start_total_time = time.time()
    logger.info("Step 1: Dataset acquisition and audit...")
    raw_path = download_dataset()
    df_clean, audit_manifest = audit_and_prepare_dataset(raw_path)

    logger.info(f"Step 2: Deterministic Stratified Split (Seed: {RANDOM_SEED})...")
    # 70% train, 30% temp (which is then split 50/50 into 15% val and 15% test)
    df_train, df_temp = train_test_split(
        df_clean,
        test_size=(VAL_RATIO + TEST_RATIO),
        random_state=RANDOM_SEED,
        stratify=df_clean["target"]
    )

    df_val, df_test = train_test_split(
        df_temp,
        test_size=0.5,
        random_state=RANDOM_SEED,
        stratify=df_temp["target"]
    )

    split_summary = {
        "random_seed": RANDOM_SEED,
        "train": {
            "samples": len(df_train),
            "human_0": int((df_train["target"] == 0).sum()),
            "ai_1": int((df_train["target"] == 1).sum()),
            "percentage": round(len(df_train) / len(df_clean) * 100, 2)
        },
        "validation": {
            "samples": len(df_val),
            "human_0": int((df_val["target"] == 0).sum()),
            "ai_1": int((df_val["target"] == 1).sum()),
            "percentage": round(len(df_val) / len(df_clean) * 100, 2)
        },
        "test": {
            "samples": len(df_test),
            "human_0": int((df_test["target"] == 0).sum()),
            "ai_1": int((df_test["target"] == 1).sum()),
            "percentage": round(len(df_test) / len(df_clean) * 100, 2)
        }
    }
    logger.info(f"Splits created: Train={len(df_train)}, Val={len(df_val)}, Test={len(df_test)}")

    logger.info("Step 3: Fitting shared FeatureUnion on Training Data ONLY...")
    vectorizer = create_feature_extractor()
    t0_vec = time.time()
    X_train = vectorizer.fit_transform(df_train["clean_text"])
    vec_fit_time = round(time.time() - t0_vec, 2)

    X_val = vectorizer.transform(df_val["clean_text"])
    X_test = vectorizer.transform(df_test["clean_text"])

    y_train = df_train["target"].to_numpy()
    y_val = df_val["target"].to_numpy()
    y_test = df_test["target"].to_numpy()

    feature_names = vectorizer.get_feature_names_out().tolist()
    total_features = len(feature_names)
    logger.info(f"Feature extraction complete in {vec_fit_time}s. Total vocabulary size: {total_features}")

    logger.info("Step 4: Training Three Models...")
    models = {}
    train_times = {}

    # Model A: Multinomial Naive Bayes
    logger.info("Training Model A: Multinomial Naive Bayes...")
    nb_params = MODEL_PARAMS["naive_bayes"]
    nb_model = MultinomialNB(alpha=nb_params["alpha"], fit_prior=nb_params["fit_prior"])
    t0 = time.time()
    nb_model.fit(X_train, y_train)
    train_times["naive_bayes"] = round(time.time() - t0, 3)
    models["naive_bayes"] = nb_model
    logger.info(f"Model A trained in {train_times['naive_bayes']}s")

    # Model B: Logistic Regression
    logger.info("Training Model B: Logistic Regression...")
    lr_params = MODEL_PARAMS["logistic_regression"]
    lr_model = LogisticRegression(
        C=lr_params["C"],
        max_iter=lr_params["max_iter"],
        random_state=lr_params["random_state"],
        solver=lr_params["solver"]
    )
    t0 = time.time()
    lr_model.fit(X_train, y_train)
    train_times["logistic_regression"] = round(time.time() - t0, 3)
    models["logistic_regression"] = lr_model
    logger.info(f"Model B trained in {train_times['logistic_regression']}s")

    # Model C: Calibrated Linear SVM
    logger.info("Training Model C: Calibrated Linear SVM (3-fold CV Platt scaling on train)...")
    svm_params = MODEL_PARAMS["calibrated_svm"]
    base_svc = LinearSVC(
        C=svm_params["svm_c"],
        max_iter=svm_params["max_iter"],
        random_state=svm_params["random_state"],
        dual="auto"
    )
    calibrated_svm = CalibratedClassifierCV(
        estimator=base_svc,
        method=svm_params["calibration_method"],
        cv=svm_params["cv"]
    )
    t0 = time.time()
    calibrated_svm.fit(X_train, y_train)
    train_times["calibrated_svm"] = round(time.time() - t0, 3)
    models["calibrated_svm"] = calibrated_svm
    logger.info(f"Model C trained in {train_times['calibrated_svm']}s")

    # Validation quick check
    val_metrics = {}
    for name, model in models.items():
        probs_val = model.predict_proba(X_val)[:, 1]
        val_metrics[name] = compute_model_metrics(y_val, probs_val)
        logger.info(f"Validation Acc [{name}]: {val_metrics[name]['accuracy']}, F1: {val_metrics[name]['f1_ai']}")

    # Step 5: Final Held-Out Test Evaluation
    logger.info("Step 5: Evaluating all three models on untouched Held-Out Test Set...")
    test_metrics = {}
    for name, model in models.items():
        probs_test = model.predict_proba(X_test)[:, 1]
        test_metrics[name] = compute_model_metrics(y_test, probs_test)
        logger.info(
            f"Test Metrics [{name}]: Acc={test_metrics[name]['accuracy']}, "
            f"Prec={test_metrics[name]['precision_ai']}, Rec={test_metrics[name]['recall_ai']}, "
            f"F1={test_metrics[name]['f1_ai']}, ROC-AUC={test_metrics[name]['roc_auc']}, "
            f"Brier={test_metrics[name]['brier_score']}"
        )

    # Step 6: Subgroup & Robustness Evaluations
    logger.info("Step 6: Evaluating subgroup slices and perturbation robustness...")
    bundle_temp = AuthorshipBundle(
        vectorizer=vectorizer,
        models=models,
        feature_names=feature_names,
        logistic_coef=lr_model.coef_[0]
    )

    length_slice_results = evaluate_length_slices(df_test, bundle_temp)
    source_slice_results = evaluate_source_domain_slices(df_test, bundle_temp)
    perturbation_results = evaluate_perturbations(df_test, bundle_temp, test_metrics)

    # Step 7: Serialize Model Bundle
    logger.info("Step 7: Packaging and serializing AuthorshipBundle...")
    bundle_metadata = {
        "version": "1.0.0",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "dataset_name": DATASET_NAME,
        "dataset_doi": DATASET_DOI,
        "license": DATASET_LICENSE,
        "features": {
            "total_vocabulary": total_features,
            "word_max_features": WORD_MAX_FEATURES,
            "char_max_features": CHAR_MAX_FEATURES,
            "word_ngram_range": list(WORD_NGRAM_RANGE),
            "char_ngram_range": list(CHAR_NGRAM_RANGE)
        },
        "models": list(models.keys()),
        "test_metrics_summary": {
            m: {
                "accuracy": test_metrics[m]["accuracy"],
                "f1_ai": test_metrics[m]["f1_ai"],
                "roc_auc": test_metrics[m]["roc_auc"]
            }
            for m in models
        }
    }

    final_bundle = AuthorshipBundle(
        vectorizer=vectorizer,
        models=models,
        feature_names=feature_names,
        logistic_coef=lr_model.coef_[0],
        metadata=bundle_metadata
    )

    final_bundle.save(ARTIFACT_BUNDLE_PATH)
    bundle_size_bytes = ARTIFACT_BUNDLE_PATH.stat().st_size
    bundle_size_mb = round(bundle_size_bytes / (1024 * 1024), 2)
    logger.info(f"Model bundle saved to {ARTIFACT_BUNDLE_PATH} ({bundle_size_mb} MB / {bundle_size_bytes} bytes)")

    # Verify bundle loading and sample inference
    logger.info("Step 8: Verifying bundle reload and test inference...")
    loaded_bundle = AuthorshipBundle.load(ARTIFACT_BUNDLE_PATH)
    sample_text = (
        "In this study, we investigate the empirical convergence rates of gradient descent algorithms "
        "applied to overparameterized neural networks under standard smoothness assumptions."
    )
    sample_prediction = loaded_bundle.predict_single(sample_text)
    sample_explanation = loaded_bundle.explain(sample_text, top_k=5)
    logger.info(f"Sample test prediction consensus: {sample_prediction['consensus']}")

    # Step 9: Assemble benchmark JSON
    benchmark_payload = {
        "benchmark_metadata": {
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "dataset_provenance": {
                "name": DATASET_NAME,
                "doi": DATASET_DOI,
                "license": DATASET_LICENSE,
                "raw_samples": audit_manifest["raw_sample_count"],
                "clean_samples": audit_manifest["final_clean_sample_count"],
                "positive_class": "1 (AI-generated)",
                "negative_class": "0 (Human-written)"
            },
            "split_protocol": split_summary,
            "feature_representation": {
                "vectorizer_type": "FeatureUnion(Word TF-IDF + Char TF-IDF)",
                "total_features": total_features,
                "word_features_count": len(vectorizer.transformer_list[0][1].vocabulary_),
                "char_features_count": len(vectorizer.transformer_list[1][1].vocabulary_),
                "vectorizer_fit_duration_sec": vec_fit_time
            },
            "training_durations_sec": train_times,
            "artifact_info": {
                "bundle_path": str(ARTIFACT_BUNDLE_PATH.name),
                "bundle_size_bytes": bundle_size_bytes,
                "bundle_size_mb": bundle_size_mb,
                "compression": "joblib level 3"
            }
        },
        "model_comparison": test_metrics,
        "validation_metrics": val_metrics,
        "subgroup_analysis": {
            "text_length_slices": length_slice_results,
            "source_domain_and_generator_slices": source_slice_results
        },
        "perturbation_robustness_tests": perturbation_results,
        "smoke_inference_verification": {
            "sample_input": sample_text,
            "prediction_output": sample_prediction,
            "top_explanations": sample_explanation
        }
    }

    with open(BENCHMARK_RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(benchmark_payload, f, indent=2)
    logger.info(f"Saved complete benchmark results to {BENCHMARK_RESULTS_PATH}")

    total_duration = round(time.time() - start_total_time, 2)
    logger.info(f"All training and evaluation steps completed in {total_duration}s.")

    return benchmark_payload


if __name__ == "__main__":
    run_training_and_evaluation()

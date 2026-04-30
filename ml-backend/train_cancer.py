import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    classification_report, accuracy_score,
    roc_auc_score, confusion_matrix
)
from cancer_model import (
    build_cancer_pipeline, save_cancer_model,
    predict_cancer, MALIGNANT_SAMPLE, BENIGN_SAMPLE, FEATURE_NAMES
)

def train():
    print("=" * 60)
    print("BREAST CANCER DETECTION MODEL TRAINING")
    print("Wisconsin Diagnostic Breast Cancer Dataset")
    print("=" * 60)

    # Load built-in dataset — no download needed
    print("\nLoading Wisconsin Breast Cancer dataset from scikit-learn...")
    data = load_breast_cancer()
    X = data.data
    y = data.target

    print(f"Total samples: {len(X)}")
    print(f"Features: {X.shape[1]}")
    print(f"Malignant (0): {sum(y == 0)}")
    print(f"Benign    (1): {sum(y == 1)}")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

    # Train
    print("\nTraining Voting Ensemble (Logistic Regression + Random Forest + Gradient Boosting)...")
    pipeline = build_cancer_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)

    print(f"\n{'=' * 40}")
    print(f"Test Accuracy:  {accuracy * 100:.2f}%")
    print(f"ROC-AUC Score:  {roc_auc:.4f}")
    print(f"{'=' * 40}")

    print("\nClassification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=["Malignant", "Benign"]
    ))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  True Malignant: {cm[0][0]} | False Benign: {cm[0][1]}")
    print(f"  False Malignant: {cm[1][0]} | True Benign: {cm[1][1]}")

    # Cross validation
    print("\nRunning 5-Fold Cross Validation...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")
    print(f"CV Scores: {[f'{s*100:.2f}%' for s in cv_scores]}")
    print(f"Mean CV Accuracy: {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 100:.2f}%)")

    # Save
    save_cancer_model(pipeline)

    # Quick test with sample values
    print("\n" + "=" * 60)
    print("QUICK PREDICTION TEST")
    print("=" * 60)

    malignant_features = {
        name: val for name, val in
        zip(FEATURE_NAMES, load_breast_cancer().data[0])
    }
    result_m = predict_cancer(malignant_features, pipeline)
    print(f"\nKnown Malignant Sample:")
    print(f"  Prediction:  {result_m['prediction']}")
    print(f"  Confidence:  {result_m['confidence']}%")
    print(f"  Risk Level:  {result_m['risk_level']}")
    print(f"  Malignant Probability: {result_m['malignant_probability']}%")
    print(f"  Benign Probability:    {result_m['benign_probability']}%")

    benign_features = {
        name: val for name, val in
        zip(FEATURE_NAMES, load_breast_cancer().data[100])
    }
    result_b = predict_cancer(benign_features, pipeline)
    print(f"\nKnown Benign Sample:")
    print(f"  Prediction:  {result_b['prediction']}")
    print(f"  Confidence:  {result_b['confidence']}%")
    print(f"  Risk Level:  {result_b['risk_level']}")
    print(f"  Malignant Probability: {result_b['malignant_probability']}%")
    print(f"  Benign Probability:    {result_b['benign_probability']}%")

    print(f"\n✅ Cancer model trained and saved successfully!")
    print(f"Expected accuracy: ~97-98%")

if __name__ == "__main__":
    train()
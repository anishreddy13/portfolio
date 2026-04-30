import numpy as np
import joblib
from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC

FEATURE_NAMES = [
    "radius_mean", "texture_mean", "perimeter_mean", "area_mean",
    "smoothness_mean", "compactness_mean", "concavity_mean",
    "concave_points_mean", "symmetry_mean", "fractal_dimension_mean",
    "radius_se", "texture_se", "perimeter_se", "area_se",
    "smoothness_se", "compactness_se", "concavity_se",
    "concave_points_se", "symmetry_se", "fractal_dimension_se",
    "radius_worst", "texture_worst", "perimeter_worst", "area_worst",
    "smoothness_worst", "compactness_worst", "concavity_worst",
    "concave_points_worst", "symmetry_worst", "fractal_dimension_worst",
]

FEATURE_RANGES = {
    "radius_mean":             {"min": 6.981,  "max": 28.11,  "unit": "mm"},
    "texture_mean":            {"min": 9.71,   "max": 39.28,  "unit": ""},
    "perimeter_mean":          {"min": 43.79,  "max": 188.5,  "unit": "mm"},
    "area_mean":               {"min": 143.5,  "max": 2501.0, "unit": "mm²"},
    "smoothness_mean":         {"min": 0.053,  "max": 0.163,  "unit": ""},
    "compactness_mean":        {"min": 0.019,  "max": 0.345,  "unit": ""},
    "concavity_mean":          {"min": 0.0,    "max": 0.427,  "unit": ""},
    "concave_points_mean":     {"min": 0.0,    "max": 0.201,  "unit": ""},
    "symmetry_mean":           {"min": 0.106,  "max": 0.304,  "unit": ""},
    "fractal_dimension_mean":  {"min": 0.05,   "max": 0.097,  "unit": ""},
    "radius_se":               {"min": 0.112,  "max": 2.873,  "unit": "mm"},
    "texture_se":              {"min": 0.36,   "max": 4.885,  "unit": ""},
    "perimeter_se":            {"min": 0.757,  "max": 21.98,  "unit": "mm"},
    "area_se":                 {"min": 6.802,  "max": 542.2,  "unit": "mm²"},
    "smoothness_se":           {"min": 0.002,  "max": 0.031,  "unit": ""},
    "compactness_se":          {"min": 0.002,  "max": 0.135,  "unit": ""},
    "concavity_se":            {"min": 0.0,    "max": 0.396,  "unit": ""},
    "concave_points_se":       {"min": 0.0,    "max": 0.053,  "unit": ""},
    "symmetry_se":             {"min": 0.008,  "max": 0.079,  "unit": ""},
    "fractal_dimension_se":    {"min": 0.001,  "max": 0.03,   "unit": ""},
    "radius_worst":            {"min": 7.93,   "max": 36.04,  "unit": "mm"},
    "texture_worst":           {"min": 12.02,  "max": 49.54,  "unit": ""},
    "perimeter_worst":         {"min": 50.41,  "max": 251.2,  "unit": "mm"},
    "area_worst":              {"min": 185.2,  "max": 4254.0, "unit": "mm²"},
    "smoothness_worst":        {"min": 0.071,  "max": 0.223,  "unit": ""},
    "compactness_worst":       {"min": 0.027,  "max": 0.938,  "unit": ""},
    "concavity_worst":         {"min": 0.0,    "max": 1.252,  "unit": ""},
    "concave_points_worst":    {"min": 0.0,    "max": 0.291,  "unit": ""},
    "symmetry_worst":          {"min": 0.156,  "max": 0.664,  "unit": ""},
    "fractal_dimension_worst": {"min": 0.055,  "max": 0.208,  "unit": ""},
}

# Sample presets for UI
MALIGNANT_SAMPLE = {
    "radius_mean": 17.99, "texture_mean": 10.38, "perimeter_mean": 122.8,
    "area_mean": 1001.0, "smoothness_mean": 0.1184, "compactness_mean": 0.2776,
    "concavity_mean": 0.3001, "concave_points_mean": 0.1471, "symmetry_mean": 0.2419,
    "fractal_dimension_mean": 0.07871, "radius_se": 1.095, "texture_se": 0.9053,
    "perimeter_se": 8.589, "area_se": 153.4, "smoothness_se": 0.006399,
    "compactness_se": 0.04904, "concavity_se": 0.05373, "concave_points_se": 0.01587,
    "symmetry_se": 0.03003, "fractal_dimension_se": 0.006193, "radius_worst": 25.38,
    "texture_worst": 17.33, "perimeter_worst": 184.6, "area_worst": 2019.0,
    "smoothness_worst": 0.1622, "compactness_worst": 0.6656, "concavity_worst": 0.7119,
    "concave_points_worst": 0.2654, "symmetry_worst": 0.4601, "fractal_dimension_worst": 0.1189,
}

BENIGN_SAMPLE = {
    "radius_mean": 13.54, "texture_mean": 14.36, "perimeter_mean": 87.46,
    "area_mean": 566.3, "smoothness_mean": 0.09779, "compactness_mean": 0.08129,
    "concavity_mean": 0.06664, "concave_points_mean": 0.04781, "symmetry_mean": 0.1885,
    "fractal_dimension_mean": 0.05766, "radius_se": 0.2699, "texture_se": 0.7886,
    "perimeter_se": 2.058, "area_se": 23.56, "smoothness_se": 0.008462,
    "compactness_se": 0.0146, "concavity_se": 0.02387, "concave_points_se": 0.01315,
    "symmetry_se": 0.0198, "fractal_dimension_se": 0.0023, "radius_worst": 15.11,
    "texture_worst": 19.26, "perimeter_worst": 99.7, "area_worst": 711.2,
    "smoothness_worst": 0.144, "compactness_worst": 0.1773, "concavity_worst": 0.239,
    "concave_points_worst": 0.1288, "symmetry_worst": 0.2977, "fractal_dimension_worst": 0.07259,
}

def build_cancer_pipeline():
    lr = LogisticRegression(max_iter=10000, C=1.0, solver="lbfgs")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)

    voting = VotingClassifier(
        estimators=[("lr", lr), ("rf", rf), ("gb", gb)],
        voting="soft"
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", voting)
    ])
    return pipeline

def save_cancer_model(pipeline, path="cancer_model.pkl"):
    joblib.dump(pipeline, path)
    print(f"Cancer model saved to {path}")

def load_cancer_model(path="cancer_model.pkl"):
    return joblib.load(path)

def get_feature_importance(pipeline):
    voting_clf = pipeline.named_steps["clf"]
    rf = voting_clf.estimators_[1]
    importances = rf.feature_importances_
    feature_importance = [
        {"feature": name, "importance": round(float(imp) * 100, 2)}
        for name, imp in zip(FEATURE_NAMES, importances)
    ]
    feature_importance.sort(key=lambda x: x["importance"], reverse=True)
    return feature_importance[:10]

def predict_cancer(features: dict, pipeline):
    values = [float(features.get(name, 0.0)) for name in FEATURE_NAMES]
    input_array = np.array(values).reshape(1, -1)

    prediction = pipeline.predict(input_array)[0]
    probabilities = pipeline.predict_proba(input_array)[0]

    # In sklearn breast cancer: 0=malignant, 1=benign
    malignant_prob = round(float(probabilities[0]) * 100, 2)
    benign_prob = round(float(probabilities[1]) * 100, 2)

    label = "Benign" if int(prediction) == 1 else "Malignant"
    confidence = round(float(max(probabilities)) * 100, 2)

    risk_level = "Low"
    if malignant_prob >= 70:
        risk_level = "High"
    elif malignant_prob >= 40:
        risk_level = "Moderate"

    top_features = get_feature_importance(pipeline)

    return {
        "prediction": label,
        "confidence": confidence,
        "malignant_probability": malignant_prob,
        "benign_probability": benign_prob,
        "risk_level": risk_level,
        "top_features": top_features,
        "is_malignant": label == "Malignant",
    }
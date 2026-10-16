import json
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier
import shap

def generate_xai_explanation(ticker: str) -> str:
    """
    Fetches live financial and technical metrics for a ticker, trains a lightweight
    RandomForest model on synthetic historical bounds, and uses SHAP to extract 
    feature importance, explaining exactly why the model recommends Buy or Sell.
    """
    try:
        # 1. Fetch live features
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="6mo")
        
        if hist.empty or len(hist) < 30:
            return json.dumps({"error": "Not enough data for explanation."})

        # Feature Engineering
        # Calculate RSI (14-day)
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 1e-9)
        rsi = 100 - (100 / (1 + rs.iloc[-1]))
        
        # Calculate MACD
        exp1 = hist['Close'].ewm(span=12, adjust=False).mean()
        exp2 = hist['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1.iloc[-1] - exp2.iloc[-1]
        
        # Fundamental Ratios
        pe_ratio = info.get("trailingPE", 15.0)
        pb_ratio = info.get("priceToBook", 3.0)
        debt_to_equity = info.get("debtToEquity", 50.0)
        profit_margin = info.get("profitMargins", 0.1) * 100
        
        # Current feature vector
        feature_names = ["RSI", "MACD", "P/E Ratio", "P/B Ratio", "Debt/Equity", "Profit Margin"]
        live_features = np.array([[rsi, macd, pe_ratio, pb_ratio, debt_to_equity, profit_margin]])
        
        # 2. Train a lightweight classification model
        # For true production, this would be a pre-trained model. 
        # Here we generate a synthetic historical baseline to fit the explainer.
        np.random.seed(42)
        X_train = np.random.randn(500, 6)
        # Shift synthetic data to simulate real-world distributions
        X_train[:, 0] = X_train[:, 0] * 15 + 50  # RSI mean 50
        X_train[:, 1] = X_train[:, 1] * 2        # MACD
        X_train[:, 2] = X_train[:, 2] * 10 + 20  # P/E
        X_train[:, 3] = X_train[:, 3] * 2 + 3    # P/B
        X_train[:, 4] = X_train[:, 4] * 30 + 50  # Debt/Equity
        X_train[:, 5] = X_train[:, 5] * 5 + 10   # Profit Margin
        
        # Target: 1 (Buy) if RSI < 60 and PE < 25 and Margin > 5
        y_train = ((X_train[:, 0] < 60) & (X_train[:, 2] < 25) & (X_train[:, 5] > 5)).astype(int)
        
        # Add some noise
        flip = np.random.rand(500) < 0.1
        y_train = np.where(flip, 1 - y_train, y_train)
        
        model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=5)
        model.fit(X_train, y_train)
        
        # 3. Predict & Confidence
        prediction_prob = model.predict_proba(live_features)[0]
        prediction_idx = np.argmax(prediction_prob)
        recommendation = "BUY" if prediction_idx == 1 else "SELL"
        confidence = round(prediction_prob[prediction_idx] * 100, 1)
        
        # 4. SHAP TreeExplainer
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(live_features)
        
        # For binary classification, shap_values is a list of arrays (one per class). 
        # We take the SHAP values for the "Buy" class (index 1).
        # If the output format of shap_values changed in newer SHAP, handle it:
        if isinstance(shap_values, list):
            sv_buy = shap_values[1][0]
        else:
            # Depending on sklearn version, TreeExplainer might return array of shape (n_samples, n_features, n_classes)
            if len(shap_values.shape) == 3:
                sv_buy = shap_values[0, :, 1]
            else:
                sv_buy = shap_values[0]
                
        base_value = explainer.expected_value
        if isinstance(base_value, list) or isinstance(base_value, np.ndarray):
            base_value = base_value[1] if len(base_value) > 1 else base_value[0]
            
        features_impact = []
        positive_factors = []
        negative_factors = []
        
        for i, f_name in enumerate(feature_names):
            val = round(float(live_features[0][i]), 2)
            impact = round(float(sv_buy[i]), 4)
            direction = "positive" if impact > 0 else "negative"
            
            features_impact.append({
                "feature": f_name,
                "value": val,
                "impact": impact,
                "direction": direction
            })
            
            if direction == "positive":
                positive_factors.append(f_name)
            else:
                negative_factors.append(f_name)
                
        # 5. Generate Dynamic Summary
        if recommendation == "BUY":
            top_pos = positive_factors[0] if positive_factors else "favorable metrics"
            top_neg = negative_factors[0] if negative_factors else "minor risks"
            summary = f"Despite potential pressure from {top_neg}, the overwhelming strength in {top_pos} drives this Buy recommendation."
        else:
            top_pos = positive_factors[0] if positive_factors else "certain strengths"
            top_neg = negative_factors[0] if negative_factors else "critical vulnerabilities"
            summary = f"While the asset shows {top_pos}, the severe downward drag from {top_neg} solidifies this Sell recommendation."
            
        # Sort impacts by absolute magnitude for the waterfall chart
        features_impact.sort(key=lambda x: abs(x["impact"]), reverse=True)
        
        payload = {
            "recommendation": recommendation,
            "confidence": confidence,
            "base_value": round(float(base_value), 4),
            "features": features_impact,
            "summary": summary
        }
        
        return json.dumps(payload)
        
    except Exception as e:
        print(f"[ML_EXPLAINER] Error generating XAI explanation: {e}")
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    print(generate_xai_explanation("AAPL"))

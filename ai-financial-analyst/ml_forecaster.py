"""
ml_forecaster.py — Time-Series Price Forecasting ML Pipeline

Fetches historical stock data, generates a 30-day forward projection using Meta's Prophet,
and connects to Supabase to reconcile live prices against archived predictions to calculate
real-world forecast accuracy.
"""

import os
import json
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import yfinance as yf
from prophet import Prophet
from supabase import create_client, Client

# Initialize Supabase Client
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
supabase: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[ML_FORECASTER] Failed to initialize Supabase: {e}")

def get_archived_forecast(ticker: str) -> dict | None:
    """Fetch the most recent forecast older than 12 hours."""
    if not supabase:
        return None
        
    try:
        cutoff_time = (datetime.utcnow() - timedelta(hours=12)).isoformat()
        response = supabase.table("forecasts").select("*").eq("ticker", ticker).lt("prediction_timestamp", cutoff_time).order("prediction_timestamp", desc=True).limit(1).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
    except Exception as e:
        print(f"[ML_FORECASTER] Error fetching archived forecast: {e}")
    return None

def save_new_forecast(ticker: str, forecast_array: list):
    """Save the new 30-day forecast to Supabase."""
    if not supabase:
        return
        
    try:
        data = {
            "ticker": ticker,
            "prediction_timestamp": datetime.utcnow().isoformat(),
            "forecast_blob": json.dumps(forecast_array)
        }
        supabase.table("forecasts").insert(data).execute()
    except Exception as e:
        print(f"[ML_FORECASTER] Error saving new forecast: {e}")

def generate_forecast(ticker: str, lookback_years: int = 3, forecast_days: int = 30) -> str:
    """
    Fetches historical data, fits a Prophet model, reconciles against archived 
    forecasts, saves the new forecast, and returns a merged JSON payload.
    """
    try:
        # 1. Fetch live historical data
        stock = yf.Ticker(ticker)
        df = stock.history(period=f"{lookback_years}y")
        
        if df.empty or len(df) < 30:
            return json.dumps({"error": f"Not enough historical data for {ticker}"})
            
        df = df[['Close']].reset_index()
        df['ds'] = df['Date'].dt.tz_localize(None)
        df['y'] = df['Close']
        df = df.dropna()
        
        # Log transform for Prophet
        df['y_orig'] = df['y']
        df['y'] = np.log(df['y'])
        
        # 2. Model Fitting
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05
        )
        model.fit(df[['ds', 'y']])
        
        # 3. Generate New Projection
        future = model.make_future_dataframe(periods=forecast_days, freq='D')
        forecast = model.predict(future)
        
        forecast['yhat'] = np.exp(forecast['yhat'])
        forecast['yhat_lower'] = np.exp(forecast['yhat_lower'])
        forecast['yhat_upper'] = np.exp(forecast['yhat_upper'])
        
        # 4. Fetch Archived Forecast for Reconciliation
        archived_record = get_archived_forecast(ticker)
        archived_dict = {}
        if archived_record and "forecast_blob" in archived_record:
            try:
                blob = json.loads(archived_record["forecast_blob"])
                for pt in blob:
                    archived_dict[pt["date"]] = pt
            except:
                pass
                
        # 5. Payload Construction & Accuracy Calculation
        max_hist_date = df['ds'].max()
        cutoff_date = max_hist_date - pd.Timedelta(days=180)
        
        results = []
        new_forecast_array = []
        
        total_error = 0
        overlap_count = 0
        
        for _, row in forecast.iterrows():
            current_date = row['ds']
            date_str = current_date.strftime("%Y-%m-%d")
            
            if current_date < cutoff_date:
                continue
                
            is_future = current_date > max_hist_date
            
            # Find actual price
            actual_price = None
            if not is_future:
                actual_match = df[df['ds'] == current_date]
                if not actual_match.empty:
                    actual_price = round(float(actual_match.iloc[0]['y_orig']), 2)
                else:
                    continue
            
            projected_price = round(float(row['yhat']), 2)
            lower_bound = round(float(row['yhat_lower']), 2)
            upper_bound = round(float(row['yhat_upper']), 2)
            
            # Save future dates for persistence
            if is_future:
                new_forecast_array.append({
                    "date": date_str,
                    "projectedPrice": projected_price,
                    "lowerBound": lower_bound,
                    "upperBound": upper_bound
                })
            
            # Map archived data
            arch_proj = None
            arch_lower = None
            arch_upper = None
            
            if date_str in archived_dict:
                arch_pt = archived_dict[date_str]
                arch_proj = arch_pt.get("projectedPrice")
                arch_lower = arch_pt.get("lowerBound")
                arch_upper = arch_pt.get("upperBound")
                
                # Calculate reconciliation error (only where we have both actual historical price and an old forecast)
                if actual_price is not None and arch_proj is not None:
                    error_percent = abs(actual_price - arch_proj) / actual_price
                    total_error += error_percent
                    overlap_count += 1
                    
            data_point = {
                "date": date_str,
                "actualPrice": actual_price,
                "projectedPrice": projected_price if is_future else None,
                "lowerBound": lower_bound if is_future else None,
                "upperBound": upper_bound if is_future else None,
                "archivedProjectedPrice": arch_proj,
                "archivedLowerBound": arch_lower,
                "archivedUpperBound": arch_upper,
                "isForecast": is_future
            }
            results.append(data_point)
            
        # 6. Save new forecast asynchronously (or blockingly here)
        if len(new_forecast_array) > 0:
            save_new_forecast(ticker, new_forecast_array)
            
        # Calculate final accuracy KPI
        accuracy = None
        if overlap_count > 0:
            mape = total_error / overlap_count
            accuracy = round((1 - mape) * 100, 1)
            # Bound accuracy to [0, 100]
            accuracy = max(0.0, min(100.0, accuracy))
            
        return json.dumps({
            "chart": results,
            "accuracy": accuracy
        })
        
    except Exception as e:
        print(f"[ML_FORECASTER] Error generating forecast for {ticker}: {e}")
        return json.dumps({"error": str(e)})

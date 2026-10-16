"""
signals.py â€” Real-Time AI Market Signal Feed

A lightweight pipeline that systematically scans a predefined list of trending
symbols, evaluates recent news and SEC risks, and uses an LLM to generate
high-value, structured anomaly alerts (Signals).
"""

import json
import os
import yfinance as yf
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from tools import search_news
from sec_tools import get_sec_risks


SIGNAL_SYSTEM_PROMPT = """You are a High-Frequency AI Market Analyst.
Your job is to scan the provided news and regulatory intelligence for a stock and
identify ONE critical, high-value anomaly or signal.

Types of signals:
- 'VALUATION_ALERT': Extreme variance in valuation or sudden price moves.
- 'REGULATORY_RISK': Sudden changes in SEC compliance, debt, or litigation.
- 'CATALYST': A major upcoming or recent event (earnings, product launch, M&A).

Return ONLY a valid JSON object matching this schema:
{
  "ticker": "AAPL",
  "signal_type": "REGULATORY_RISK",
  "severity": "HIGH", // HIGH, MEDIUM, LOW
  "description": "Short, punchy 1-2 sentence description of the anomaly."
}

Do not include any other text, markdown blocks, or explanation. Just the raw JSON."""


def _get_llm(model_name="openai/gpt-oss-120b"):
    return ChatGroq(
        model=model_name,
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.0,
        max_tokens=2048,
        max_retries=5
    )


def _fallback_signal(ticker: str) -> dict:
    """Build a live, non-LLM signal so the feed still works without Groq."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")
        if hist.empty or len(hist) < 2:
            raise ValueError("No recent price history")

        latest = float(hist["Close"].iloc[-1])
        previous = float(hist["Close"].iloc[-2])
        change = ((latest - previous) / previous) * 100 if previous else 0
        volume = int(hist["Volume"].iloc[-1]) if "Volume" in hist else 0
        direction = "up" if change >= 0 else "down"
        severity = "HIGH" if abs(change) >= 5 else "MEDIUM" if abs(change) >= 2 else "LOW"

        return {
            "ticker": ticker,
            "signal_type": "VALUATION_ALERT" if abs(change) >= 2 else "CATALYST",
            "severity": severity,
            "description": f"{ticker} is {direction} {abs(change):.2f}% in the latest session with volume near {volume:,}.",
        }
    except Exception as e:
        return {
            "ticker": ticker,
            "signal_type": "ERROR",
            "severity": "LOW",
            "description": f"Live signal unavailable: {str(e)[:60]}",
        }


def generate_market_signals() -> str:
    """Scan trending symbols and generate a structured JSON list of signals.

    Returns:
        JSON string containing a list of signal objects.
    """
    trending_symbols = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN"]
    signals = []

    if not os.getenv("GROQ_API_KEY"):
        return json.dumps([_fallback_signal(ticker) for ticker in trending_symbols])

    for ticker in trending_symbols:
        print(f"[SIGNALS] Scanning {ticker}...")
        try:
            # 1. Fetch raw intelligence
            news = search_news(ticker, max_results=3)
            sec_risks = get_sec_risks(ticker)

            raw_data = f"## Recent News\n{news}\n\n## SEC & Regulatory\n{sec_risks}"

            # 2. Extract signal via LLM
            messages = [
                SystemMessage(content=SIGNAL_SYSTEM_PROMPT),
                HumanMessage(content=f"Find the most critical signal for {ticker} based on this data:\n\n{raw_data}")
            ]
            
            try:
                llm = _get_llm("openai/gpt-oss-120b")
                response = llm.invoke(messages)
            except Exception as e:
                if "429" in str(e) or "400" in str(e):
                    print(f"[SIGNALS] API Error ({e}), falling back to openai/gpt-oss-20b...")
                    llm_fallback = _get_llm("openai/gpt-oss-20b")
                    response = llm_fallback.invoke(messages)
                else:
                    raise e

            content = response.content.strip()
            # Clean up potential markdown formatting from LLM
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            
            signal_data = json.loads(content.strip())
            
            # Ensure the ticker matches
            signal_data["ticker"] = ticker
            signals.append(signal_data)
            
            print(f"[SIGNALS] Found signal for {ticker}: {signal_data.get('signal_type')}")

        except Exception as e:
            print(f"[SIGNALS] Failed to generate signal for {ticker}: {e}")
            # Append a fallback/error signal so the feed doesn't break
            signals.append({
                "ticker": ticker,
                "signal_type": "ERROR",
                "severity": "LOW",
                "description": f"Signal generation failed: {str(e)[:50]}"
            })

    return json.dumps(signals)

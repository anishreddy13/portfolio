"""
tools.py — Tool Functions for Agent Nodes

Pure utility functions that fetch external data. These are intentionally
decoupled from LangGraph state — agent nodes in agents.py call these
and write results back into the shared AgentState.

Tools:
    1. search_news()     — DuckDuckGo text search for recent news on a ticker.
    2. get_financials()  — yfinance data pull for key financial metrics.
"""

from __future__ import annotations

import json
import traceback

import yfinance as yf
from duckduckgo_search import DDGS


# ─────────────────────────────────────────────
# Tool 1: Web News Search (Researcher Agent)
# ─────────────────────────────────────────────

def search_news(ticker: str, max_results: int = 8) -> str:
    """Search DuckDuckGo for recent financial news about a stock ticker.

    Args:
        ticker: Stock ticker symbol (e.g. "AAPL").
        max_results: Maximum number of search results to return.

    Returns:
        A formatted string of news headlines and snippets, or an error message.
    """
    try:
        query = f"{ticker} stock news latest financial analysis"
        results = DDGS().text(query, max_results=max_results)

        if not results:
            return f"No recent news found for {ticker}."

        formatted_results: list[str] = []
        for i, result in enumerate(results, 1):
            title = result.get("title", "No title")
            body = result.get("body", "No summary available")
            href = result.get("href", "")
            formatted_results.append(
                f"**[{i}] {title}**\n"
                f"   {body}\n"
                f"   Source: {href}"
            )

        return "\n\n".join(formatted_results)

    except Exception as e:
        return f"Error searching news for {ticker}: {e}\n{traceback.format_exc()}"


# ─────────────────────────────────────────────
# Tool 2: Financial Metrics (Quant Agent)
# ─────────────────────────────────────────────

def get_financials(ticker: str) -> str:
    """Pull key financial metrics for a stock ticker using yfinance.

    Retrieves: market cap, P/E ratio, forward P/E, EPS, revenue,
    profit margins, 52-week high/low, dividend yield, beta, sector,
    and current price.

    Args:
        ticker: Stock ticker symbol (e.g. "AAPL").

    Returns:
        A JSON-formatted string of financial metrics, or an error message.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info or info.get("regularMarketPrice") is None:
            # yfinance sometimes returns empty info for invalid tickers
            return f"Error: Could not retrieve data for ticker '{ticker}'. Verify it is a valid symbol."

        def _safe_get(key: str, fallback: str = "N/A"):
            """Safely retrieve a value from the info dict."""
            val = info.get(key)
            return val if val is not None else fallback

        def _format_large_number(value) -> str:
            """Convert large numbers to human-readable format (e.g. 3.45T)."""
            if value is None or value == "N/A":
                return "N/A"
            try:
                num = float(value)
            except (ValueError, TypeError):
                return str(value)

            if abs(num) >= 1_000_000_000_000:
                return f"${num / 1_000_000_000_000:.2f}T"
            if abs(num) >= 1_000_000_000:
                return f"${num / 1_000_000_000:.2f}B"
            if abs(num) >= 1_000_000:
                return f"${num / 1_000_000:.2f}M"
            return f"${num:,.2f}"

        metrics = {
            "Company": _safe_get("longName"),
            "Sector": _safe_get("sector"),
            "Industry": _safe_get("industry"),
            "Current Price": f"${_safe_get('regularMarketPrice', 0):.2f}" if isinstance(_safe_get('regularMarketPrice', 0), (int, float)) else "N/A",
            "Market Cap": _format_large_number(_safe_get("marketCap")),
            "P/E Ratio (Trailing)": _safe_get("trailingPE"),
            "P/E Ratio (Forward)": _safe_get("forwardPE"),
            "EPS (Trailing)": _safe_get("trailingEps"),
            "Revenue (TTM)": _format_large_number(_safe_get("totalRevenue")),
            "Gross Margin": f"{_safe_get('grossMargins', 0) * 100:.1f}%" if isinstance(_safe_get('grossMargins', 0), (int, float)) else "N/A",
            "Operating Margin": f"{_safe_get('operatingMargins', 0) * 100:.1f}%" if isinstance(_safe_get('operatingMargins', 0), (int, float)) else "N/A",
            "Profit Margin": f"{_safe_get('profitMargins', 0) * 100:.1f}%" if isinstance(_safe_get('profitMargins', 0), (int, float)) else "N/A",
            "52-Week High": f"${_safe_get('fiftyTwoWeekHigh', 0):.2f}" if isinstance(_safe_get('fiftyTwoWeekHigh', 0), (int, float)) else "N/A",
            "52-Week Low": f"${_safe_get('fiftyTwoWeekLow', 0):.2f}" if isinstance(_safe_get('fiftyTwoWeekLow', 0), (int, float)) else "N/A",
            "Dividend Yield": f"{_safe_get('dividendYield', 0) * 100:.2f}%" if isinstance(_safe_get('dividendYield', 0), (int, float)) else "N/A",
            "Beta": _safe_get("beta"),
            "Analyst Target Price": f"${_safe_get('targetMeanPrice', 0):.2f}" if isinstance(_safe_get('targetMeanPrice', 0), (int, float)) else "N/A",
            "Recommendation": _safe_get("recommendationKey"),
        }

        return json.dumps(metrics, indent=2)

    except Exception as e:
        return f"Error fetching financials for {ticker}: {e}\n{traceback.format_exc()}"


# ─────────────────────────────────────────────
# Tool 3: Historical Price Data (Charts)
# ─────────────────────────────────────────────

def get_historical_data(ticker: str, period: str = "6mo") -> str:
    """Fetch daily OHLCV data for a ticker over the given period.

    Args:
        ticker: Stock ticker symbol (e.g. "AAPL").
        period: yfinance period string (default "6mo").

    Returns:
        JSON string: list of {date, open, high, low, close, volume}.
    """
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval="1d")

        if hist.empty:
            return json.dumps({"error": f"No historical data for {ticker}"})

        records = []
        for date, row in hist.iterrows():
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        return json.dumps(records)

    except Exception as e:
        return json.dumps({"error": f"Failed to fetch historical data: {e}"})


# ─────────────────────────────────────────────
# Tool 4: Financial Statements (3-Statement)
# ─────────────────────────────────────────────

def _df_to_json(df) -> list[dict]:
    """Convert a yfinance financial DataFrame to a JSON-serializable list."""
    if df is None or df.empty:
        return []

    result = []
    for idx, row in df.iterrows():
        entry = {"metric": str(idx)}
        for col in df.columns:
            col_label = col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col)
            val = row[col]
            if val is None or (isinstance(val, float) and (val != val)):  # NaN check
                entry[col_label] = None
            else:
                entry[col_label] = float(val)
        result.append(entry)
    return result


def get_financial_statements(ticker: str) -> str:
    """Pull Income Statement, Balance Sheet, and Cash Flow for a ticker.

    Returns:
        JSON string with keys: income_statement, balance_sheet, cash_flow.
        Each is a list of {metric, date1, date2, ...} objects.
    """
    try:
        stock = yf.Ticker(ticker)

        payload = {
            "income_statement": _df_to_json(stock.financials),
            "balance_sheet": _df_to_json(stock.balance_sheet),
            "cash_flow": _df_to_json(stock.cashflow),
        }

        return json.dumps(payload)

    except Exception as e:
        return json.dumps({"error": f"Failed to fetch financial statements: {e}"})


# ─────────────────────────────────────────────
# Tool 5: Competitor Benchmarking
# ─────────────────────────────────────────────

def get_competitor_data(ticker: str) -> str:
    """Find 3 industry peers and pull comparative financial metrics.

    Uses the target company's sector + industry from yfinance to identify
    common large-cap peers, then builds a comparison matrix.

    Returns:
        JSON string with keys: target, peers (list), comparison (list of dicts).
    """
    # Common peer mappings for popular sectors
    PEER_MAP: dict[str, list[str]] = {
        "AAPL": ["MSFT", "GOOGL", "SAMSUNG"],
        "MSFT": ["AAPL", "GOOGL", "ORCL"],
        "GOOGL": ["META", "MSFT", "AMZN"],
        "TSLA": ["F", "GM", "RIVN"],
        "AMZN": ["WMT", "SHOP", "BABA"],
        "META": ["GOOGL", "SNAP", "PINS"],
        "NVDA": ["AMD", "INTC", "AVGO"],
        "JPM": ["BAC", "GS", "MS"],
        "JNJ": ["PFE", "UNH", "MRK"],
        "V": ["MA", "PYPL", "SQ"],
    }

    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        sector = info.get("sector", "Unknown")
        industry = info.get("industry", "Unknown")

        # Get peers — use hardcoded map or fallback to generic sector peers
        peer_tickers = PEER_MAP.get(ticker.upper(), [])

        if not peer_tickers:
            # Fallback: try to find peers via sector
            sector_peers = {
                "Technology": ["AAPL", "MSFT", "GOOGL", "META", "NVDA"],
                "Consumer Cyclical": ["AMZN", "TSLA", "NKE", "SBUX"],
                "Financial Services": ["JPM", "BAC", "GS", "V"],
                "Healthcare": ["JNJ", "PFE", "UNH", "MRK"],
                "Communication Services": ["GOOGL", "META", "DIS", "NFLX"],
                "Energy": ["XOM", "CVX", "COP", "SLB"],
                "Industrials": ["CAT", "BA", "HON", "UPS"],
            }
            candidates = sector_peers.get(sector, ["AAPL", "MSFT", "GOOGL"])
            peer_tickers = [t for t in candidates if t.upper() != ticker.upper()][:3]

        peer_tickers = peer_tickers[:3]  # Cap at 3 peers

        def _extract_metrics(t: str) -> dict:
            """Extract comparison metrics for a single ticker."""
            try:
                s = yf.Ticker(t)
                i = s.info
                return {
                    "ticker": t,
                    "name": i.get("longName", t),
                    "marketCap": i.get("marketCap"),
                    "peRatio": i.get("trailingPE"),
                    "forwardPE": i.get("forwardPE"),
                    "revenue": i.get("totalRevenue"),
                    "profitMargin": i.get("profitMargins"),
                    "grossMargin": i.get("grossMargins"),
                    "beta": i.get("beta"),
                    "price": i.get("regularMarketPrice"),
                    "52wHigh": i.get("fiftyTwoWeekHigh"),
                    "52wLow": i.get("fiftyTwoWeekLow"),
                }
            except Exception:
                return {"ticker": t, "name": t, "error": "Data unavailable"}

        # Build comparison matrix
        target_metrics = _extract_metrics(ticker)
        peer_metrics = [_extract_metrics(p) for p in peer_tickers]

        payload = {
            "target": target_metrics,
            "peers": peer_metrics,
            "sector": sector,
            "industry": industry,
        }

        return json.dumps(payload, default=str)

    except Exception as e:
        return json.dumps({"error": f"Failed to fetch competitor data: {e}"})


# ─────────────────────────────────────────────
# Tool 6: Portfolio Aggregation
# ─────────────────────────────────────────────

def get_portfolio_metrics(payload: str) -> str:
    """Fetch live pricing and aggregate metrics for a given portfolio of tickers.

    Args:
        payload: JSON string dict mapping tickers to weights (e.g. {"AAPL": 0.5, "MSFT": 0.5})
                 or just a list of tickers.

    Returns:
        JSON string of individual ticker metrics and portfolio aggregate metrics.
    """
    try:
        data = json.loads(payload)
        
        # Handle both {"AAPL": 0.5} and ["AAPL", "MSFT"]
        if isinstance(data, dict):
            tickers = list(data.keys())
            weights = data
        elif isinstance(data, list):
            tickers = data
            weights = {t: 1.0 / len(tickers) for t in tickers} if tickers else {}
        else:
            return json.dumps({"error": "Invalid payload format."})

        if not tickers:
            return json.dumps({"error": "No tickers provided."})

        results = {}
        total_market_cap = 0.0
        weighted_pe = 0.0
        weighted_beta = 0.0
        valid_pe_weight = 0.0
        valid_beta_weight = 0.0

        for t in tickers:
            try:
                stock = yf.Ticker(t)
                info = stock.info
                
                price = info.get("regularMarketPrice", 0)
                change_pct = info.get("regularMarketChangePercent", 0) * 100 if info.get("regularMarketChangePercent") else 0
                mcap = info.get("marketCap", 0)
                pe = info.get("trailingPE")
                beta = info.get("beta")
                
                w = weights.get(t, 0)
                
                if mcap: total_market_cap += mcap
                if pe and isinstance(pe, (int, float)):
                    weighted_pe += pe * w
                    valid_pe_weight += w
                if beta and isinstance(beta, (int, float)):
                    weighted_beta += beta * w
                    valid_beta_weight += w

                results[t] = {
                    "price": price,
                    "change_pct": round(change_pct, 2),
                    "marketCap": mcap,
                    "pe": pe,
                    "beta": beta,
                    "name": info.get("shortName", t)
                }
            except Exception as e:
                print(f"[PORTFOLIO] Failed to fetch {t}: {e}")
                results[t] = {"error": "Failed to fetch"}

        # Normalize weighted averages if some tickers lacked data
        agg_pe = round(weighted_pe / valid_pe_weight, 2) if valid_pe_weight > 0 else None
        agg_beta = round(weighted_beta / valid_beta_weight, 2) if valid_beta_weight > 0 else None

        return json.dumps({
            "tickers": results,
            "aggregate": {
                "totalMarketCap": total_market_cap,
                "weightedPE": agg_pe,
                "weightedBeta": agg_beta
            }
        })

    except Exception as e:
        return json.dumps({"error": f"Failed to aggregate portfolio: {e}"})


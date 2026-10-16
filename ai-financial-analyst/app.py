"""
app.py — Gradio UI for the AI Financial Analyst

This is the main entry point for the Hugging Face Space.
It wraps the LangGraph multi-agent workflow in a polished
Gradio interface with real-time status updates.
"""

from __future__ import annotations

import re
import json
import gradio as gr

# Register a dummy @spaces.GPU so HF Spaces runtime doesn't error
# with "No @spaces.GPU function detected during startup".
# On CPU-basic hardware, the decorator is a harmless no-op.
try:
    import spaces
    @spaces.GPU
    def _gpu_warmup():
        pass
except Exception:
    pass

from graph import graph
from state import AgentState
from tools import get_historical_data, get_financial_statements, get_portfolio_metrics
from rebalancer import rebalancer_graph, RebalancerState
from signals import generate_market_signals
from ml_forecaster import generate_forecast
from ml_explainer import generate_xai_explanation
from sentiment_engine import get_social_sentiment_data
from neural_chart_inference import generate_neural_chart_vision
from service_health import get_service_health
from trading_copilot import invoke_trading_copilot


# ─────────────────────────────────────────────
# Core Analysis Function
# ─────────────────────────────────────────────

def analyze_stock(ticker: str) -> str:
    """Run the full multi-agent pipeline for a given stock ticker.

    Args:
        ticker: Stock ticker symbol (e.g. "AAPL", "TSLA", "MSFT").

    Returns:
        The final markdown-formatted investment brief.
    """
    if not ticker or not ticker.strip():
        return "⚠️ Please enter a valid stock ticker symbol (e.g., AAPL, TSLA, MSFT)."

    ticker = ticker.strip().upper()

    # Basic validation: global ticker symbol pattern
    pattern = r"^[A-Z0-9^=-]{1,10}(\.[A-Z]{1,4})?$"
    if not re.match(pattern, ticker):
        return (
            f"⚠️ **'{ticker}'** doesn't look like a valid ticker symbol.\n\n"
            f"Please enter a valid global ticker (e.g., **AAPL**, **RELIANCE.NS**, **^GSPC**).\n"
        )

    # Initialize state with empty fields
    initial_state: AgentState = {
        "ticker": ticker,
        "news_summary": "",
        "sentiment": "",
        "financial_metrics": "",
        "final_report": "",
        "error": "",
    }

    try:
        # Run the full LangGraph pipeline
        final_state = graph.invoke(initial_state)

        report = final_state.get("final_report", "")

        if not report:
            return (
                f"## ⚠️ Analysis Incomplete for {ticker}\n\n"
                f"The pipeline completed but produced no final report.\n\n"
                f"**Error:** {final_state.get('error', 'Unknown error')}"
            )

        return report

    except Exception as e:
        return (
            f"## ❌ Analysis Failed for {ticker}\n\n"
            f"An error occurred during the multi-agent pipeline:\n\n"
            f"```\n{str(e)}\n```\n\n"
            f"**Possible causes:**\n"
            f"- Invalid ticker symbol\n"
            f"- API rate limits reached\n"
            f"- Network connectivity issues\n\n"
            f"Please try again or use a different ticker."
        )


def get_historical(ticker: str) -> str:
    """Gradio endpoint for historical OHLC data."""
    if not ticker or not ticker.strip():
        return '{"error": "Invalid ticker"}'
    return get_historical_data(ticker.strip().upper())


def get_financials_tables(ticker: str) -> str:
    """Gradio endpoint for 3-statement financial tables."""
    if not ticker or not ticker.strip():
        return '{"error": "Invalid ticker"}'
    return get_financial_statements(ticker.strip().upper())


def get_portfolio_data(payload: str) -> str:
    """Gradio endpoint for live portfolio aggregation."""
    if not payload or not payload.strip():
        return '{"error": "Empty payload"}'
    return get_portfolio_metrics(payload)


def rebalance_portfolio(payload: str) -> str:
    """Gradio endpoint for multi-agent portfolio rebalancing."""
    if not payload or not payload.strip():
        return "⚠️ Empty portfolio payload."
    
    initial_state: RebalancerState = {
        "payload": payload,
        "allocation_data": "",
        "optimization_plan": "",
        "error": "",
    }

    try:
        final_state = rebalancer_graph.invoke(initial_state)
        return final_state.get("optimization_plan", "Optimization failed to generate a plan.")
    except Exception as e:
        return f"## ❌ Rebalancing Failed\n\nError: {e}"


def get_market_signals() -> str:
    """Gradio endpoint for fetching real-time AI market signals."""
    return generate_market_signals()


def get_ml_forecast(ticker: str) -> str:
    """Gradio endpoint for ML Time-Series Price Forecasting."""
    if not ticker or not ticker.strip():
        return '{"error": "Invalid ticker"}'
    return generate_forecast(ticker.strip().upper())

def get_xai_explanation(ticker: str) -> str:
    """Gradio endpoint for SHAP Explainable AI."""
    if not ticker or not ticker.strip():
        return '{"error": "Invalid ticker"}'
    return generate_xai_explanation(ticker.strip().upper())

def get_neural_chart_vision(ticker: str) -> str:
    """Gradio endpoint for Phase 3 Neural Chart Vision inference."""
    if not ticker or not ticker.strip():
        return '{"error": "Invalid ticker"}'
    return generate_neural_chart_vision(ticker.strip().upper())

def search_ticker(query: str) -> str:
    """Gradio endpoint for smart ticker autocomplete using yahooquery."""
    if not query or len(query.strip()) < 2:
        return "[]"
    try:
        from yahooquery import search
        results = search(query.strip())
        matches = []
        if 'quotes' in results:
            for quote in results['quotes'][:5]:
                if 'symbol' in quote:
                    matches.append({
                        "symbol": quote['symbol'],
                        "shortname": quote.get('shortname', quote.get('longname', 'Unknown')),
                        "exchange": quote.get('exchange', 'Unknown')
                    })
        return json.dumps(matches)
    except Exception as e:
        print(f"[SEARCH_TICKER] Error: {e}")
        return "[]"

def get_social_sentiment(ticker: str, page: float = 1, limit: float = 20) -> str:
    """Gradio endpoint for fetching global social & news sentiment feed."""
    if not ticker or not ticker.strip():
        return '{"error": "Invalid ticker"}'
    return get_social_sentiment_data(ticker.strip().upper(), page=int(page), limit=int(limit))


def get_health_status() -> str:
    """Gradio endpoint for Phase 5 production health checks."""
    return get_service_health()


def run_trading_copilot(prompt: str) -> str:
    """Gradio endpoint for Trading Strategy Co-Pilot."""
    if not prompt or not prompt.strip():
        return '{"status":"ready","message":"Trading CoPilot backend initialized."}'
    return invoke_trading_copilot(prompt.strip())


# ─────────────────────────────────────────────
# Gradio Interface
# ─────────────────────────────────────────────

DESCRIPTION = """
# 🏦 AI Financial Analyst — Multi-Agent System

Enter a stock ticker to receive a comprehensive investment brief generated 
by a team of specialized AI agents:

| Agent | Role |
|-------|------|
| 🔍 **Researcher** | Scrapes the web for recent news and sentiment analysis |
| 📊 **Quant Analyst** | Pulls hard financial metrics (P/E, margins, market cap) |
| ✍️ **Editor** | Synthesizes everything into a polished investment brief |

**Tech Stack:** LangGraph • Groq (Llama-3) • yfinance • DuckDuckGo Search

---
"""

EXAMPLES = [
    ["AAPL"],
    ["TSLA"],
    ["MSFT"],
    ["NVDA"],
    ["GOOGL"],
    ["AMZN"],
    ["META"],
    ["JPM"],
]

# Custom CSS for a premium, recruiter-friendly look
CUSTOM_CSS = """
.gradio-container {
    max-width: 900px !important;
    margin: auto !important;
}
.output-markdown {
    font-size: 15px !important;
    line-height: 1.7 !important;
}
footer { display: none !important; }
"""

THEME = gr.themes.Soft(
    primary_hue=gr.themes.colors.blue,
    secondary_hue=gr.themes.colors.sky,
    neutral_hue=gr.themes.colors.slate,
)

with gr.Blocks(
    title="AI Financial Analyst | Multi-Agent System",
) as demo:
    gr.Markdown(DESCRIPTION)

    with gr.Row():
        with gr.Column(scale=3):
            ticker_input = gr.Textbox(
                label="Stock Ticker",
                placeholder="e.g., AAPL, TSLA, NVDA",
                lines=1,
                max_lines=1,
                elem_id="ticker-input",
            )
        with gr.Column(scale=1):
            analyze_btn = gr.Button(
                "🚀 Analyze",
                variant="primary",
                size="lg",
                elem_id="analyze-btn",
            )

    output = gr.Markdown(
        label="Investment Brief",
        elem_id="investment-brief",
    )

    gr.Examples(
        examples=EXAMPLES,
        inputs=ticker_input,
        label="Popular Tickers",
    )

    # Wire events
    analyze_btn.click(
        fn=analyze_stock,
        inputs=ticker_input,
        outputs=output,
        api_name="analyze_stock"
    )
    ticker_input.submit(
        fn=analyze_stock,
        inputs=ticker_input,
        outputs=output,
    )

    # Hidden endpoints for Next.js frontend to fetch structured data
    dummy_out_hist = gr.Textbox(visible=False)
    dummy_out_fin = gr.Textbox(visible=False)
    dummy_out_port = gr.Textbox(visible=False)
    dummy_out_rebalance = gr.Textbox(visible=False)
    
    ticker_input.change(
        fn=get_historical,
        inputs=ticker_input,
        outputs=dummy_out_hist,
        api_name="get_historical"
    )
    ticker_input.change(
        fn=get_financials_tables,
        inputs=ticker_input,
        outputs=dummy_out_fin,
        api_name="get_financials_tables"
    )
    ticker_input.change(
        fn=get_portfolio_data,
        inputs=ticker_input,
        outputs=dummy_out_port,
        api_name="get_portfolio_data"
    )
    ticker_input.change(
        fn=rebalance_portfolio,
        inputs=ticker_input,
        outputs=dummy_out_rebalance,
        api_name="rebalance_portfolio"
    )

    dummy_out_forecast = gr.Textbox(visible=False)
    ticker_input.change(
        fn=get_ml_forecast,
        inputs=ticker_input,
        outputs=dummy_out_forecast,
        api_name="get_forecast"
    )

    dummy_out_xai = gr.Textbox(visible=False)
    ticker_input.change(
        fn=get_xai_explanation,
        inputs=ticker_input,
        outputs=dummy_out_xai,
        api_name="get_xai_explanation"
    )

    dummy_out_neural_chart = gr.Textbox(visible=False)
    ticker_input.change(
        fn=get_neural_chart_vision,
        inputs=ticker_input,
        outputs=dummy_out_neural_chart,
        api_name="get_neural_chart_vision"
    )

    dummy_out_search = gr.Textbox(visible=False)
    # Expose search endpoint
    ticker_input.change(
        fn=search_ticker,
        inputs=ticker_input,
        outputs=dummy_out_search,
        api_name="search_ticker"
    )

    dummy_out_signals = gr.Textbox(visible=False)
    # A generic button to trigger the signal fetch (or could bind to an invisible button)
    analyze_btn.click(
        fn=get_market_signals,
        inputs=[],
        outputs=dummy_out_signals,
        api_name="get_market_signals"
    )

    dummy_out_social = gr.Textbox(visible=False)
    page_input = gr.Number(value=1, visible=False)
    limit_input = gr.Number(value=20, visible=False)
    ticker_input.change(
        fn=get_social_sentiment,
        inputs=[ticker_input, page_input, limit_input],
        outputs=dummy_out_social,
        api_name="get_social_sentiment"
    )

    dummy_out_health = gr.Textbox(visible=False)
    analyze_btn.click(
        fn=get_health_status,
        inputs=[],
        outputs=dummy_out_health,
        api_name="get_service_health"
    )

    dummy_out_trading_copilot = gr.Textbox(visible=False)
    ticker_input.change(
        fn=run_trading_copilot,
        inputs=ticker_input,
        outputs=dummy_out_trading_copilot,
        api_name="trading_copilot"
    )

    gr.Markdown(
        "---\n"
        "*Built with LangGraph, Groq, and Gradio · "
        "[View Source](https://huggingface.co/spaces/Anishreddy13/ai-financial-analyst/tree/main) · "
        "Anish Reddy*"
    )

demo.launch(ssr_mode=False, theme=THEME, css=CUSTOM_CSS)

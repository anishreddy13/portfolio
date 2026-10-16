"""
sec_tools.py — Lightweight SEC Risk Intelligence Pipeline (v3)

Uses a multi-source fallback strategy optimized for HuggingFace free-tier:
  1. DuckDuckGo search for SEC-specific risk snippets
  2. yfinance company news filtered for regulatory/compliance content
  3. yfinance company profile for sector-specific regulatory context

No heavy file downloads, no FAISS, no local embeddings — just fast, targeted
text retrieval that gives the LLM actionable context every time.
"""

import traceback
import yfinance as yf
from duckduckgo_search import DDGS


# ── Regulatory keyword filters ───────────────────────────────────────────
SEC_KEYWORDS = [
    "10-K", "10-Q", "SEC", "filing", "regulatory", "compliance",
    "risk factor", "material weakness", "debt", "obligation",
    "litigation", "investigation", "audit", "restatement",
    "warning", "impairment", "goodwill", "covenant", "default",
]


def _search_sec_risks(ticker: str) -> str:
    """Strategy 1: DuckDuckGo search for SEC-specific risk intelligence."""
    print(f"[SEC] Strategy 1: DuckDuckGo search for {ticker} SEC risks")
    snippets = []

    queries = [
        f"{ticker} SEC filing hidden risks material weaknesses 10-K",
        f"{ticker} regulatory compliance risk factors debt obligations",
        f"{ticker} 10-K annual report key risks 2024 2025",
    ]

    try:
        ddgs = DDGS()
        for query in queries:
            try:
                results = ddgs.text(query, max_results=5)
                for r in results:
                    title = r.get("title", "")
                    body = r.get("body", "")
                    href = r.get("href", "")
                    snippet = f"**{title}**\n{body}\nSource: {href}"
                    snippets.append(snippet)
            except Exception as e:
                print(f"[SEC] DuckDuckGo query failed for '{query}': {e}")
                continue

        print(f"[SEC] DuckDuckGo returned {len(snippets)} total snippets")
    except Exception as e:
        print(f"[SEC] DuckDuckGo search failed entirely: {e}")

    return "\n\n".join(snippets) if snippets else ""


def _get_yfinance_regulatory_context(ticker: str) -> str:
    """Strategy 2: yfinance company profile + news filtered for regulatory content."""
    print(f"[SEC] Strategy 2: yfinance regulatory context for {ticker}")
    context_parts = []

    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        # Pull company profile for sector/industry context
        company_name = info.get("longName", ticker)
        sector = info.get("sector", "Unknown")
        industry = info.get("industry", "Unknown")
        summary = info.get("longBusinessSummary", "")

        # Extract financial risk indicators
        total_debt = info.get("totalDebt")
        total_cash = info.get("totalCash")
        debt_to_equity = info.get("debtToEquity")
        current_ratio = info.get("currentRatio")
        audit_risk = info.get("auditRisk")
        overall_risk = info.get("overallRisk")

        profile = (
            f"**Company Profile:**\n"
            f"- Name: {company_name}\n"
            f"- Sector: {sector} | Industry: {industry}\n"
        )
        if summary:
            # Truncate to first 500 chars for context
            profile += f"- Business: {summary[:500]}...\n"

        risk_metrics = "**Key Risk Metrics from yfinance:**\n"
        if total_debt is not None:
            risk_metrics += f"- Total Debt: ${total_debt:,.0f}\n"
        if total_cash is not None:
            risk_metrics += f"- Total Cash: ${total_cash:,.0f}\n"
        if debt_to_equity is not None:
            risk_metrics += f"- Debt-to-Equity Ratio: {debt_to_equity:.2f}\n"
        if current_ratio is not None:
            risk_metrics += f"- Current Ratio: {current_ratio:.2f}\n"
        if audit_risk is not None:
            risk_metrics += f"- Audit Risk Score: {audit_risk}/10\n"
        if overall_risk is not None:
            risk_metrics += f"- Overall Risk Score: {overall_risk}/10\n"

        context_parts.append(profile)
        context_parts.append(risk_metrics)

        # Pull recent news and filter for regulatory/SEC content
        try:
            news = stock.news
            if news:
                print(f"[SEC] yfinance returned {len(news)} news items")
                regulatory_news = []
                for item in news[:20]:  # Check up to 20 news items
                    title = item.get("title", "")
                    # Check content field structure (varies by yfinance version)
                    summary_text = ""
                    if "summary" in item:
                        summary_text = item["summary"]
                    elif "content" in item:
                        content = item["content"]
                        if isinstance(content, dict):
                            summary_text = content.get("summary", "")
                        else:
                            summary_text = str(content)

                    combined = f"{title} {summary_text}".lower()
                    if any(kw.lower() in combined for kw in SEC_KEYWORDS):
                        regulatory_news.append(f"- **{title}**: {summary_text[:300]}")

                if regulatory_news:
                    context_parts.append(
                        f"**Regulatory-Related News ({len(regulatory_news)} items):**\n"
                        + "\n".join(regulatory_news[:5])
                    )
                    print(f"[SEC] Found {len(regulatory_news)} regulatory news items")
                else:
                    print("[SEC] No regulatory news found in yfinance feed")
        except Exception as e:
            print(f"[SEC] yfinance news retrieval failed: {e}")

        print(f"[SEC] yfinance context built: {len(context_parts)} sections")

    except Exception as e:
        print(f"[SEC] yfinance context failed: {e}")

    return "\n\n".join(context_parts) if context_parts else ""


def get_sec_risks(ticker: str) -> str:
    """
    Multi-source SEC risk intelligence pipeline.

    Combines DuckDuckGo SEC-specific search results with yfinance regulatory
    context to build a rich, actionable text bundle for the Auditor LLM.

    Args:
        ticker: Stock ticker symbol (e.g. "TSLA").

    Returns:
        A formatted string of SEC risk intelligence, or an error message.
    """
    print(f"\n{'='*60}")
    print(f"[SEC RAG] Starting lightweight pipeline for: {ticker}")
    print(f"{'='*60}")

    all_context = []

    try:
        # ── Strategy 1: DuckDuckGo SEC search ──
        ddg_results = _search_sec_risks(ticker)
        if ddg_results:
            all_context.append(f"## Web Intelligence — SEC Risk Snippets\n\n{ddg_results}")

        # ── Strategy 2: yfinance regulatory context ──
        yf_context = _get_yfinance_regulatory_context(ticker)
        if yf_context:
            all_context.append(f"## Company Regulatory Profile\n\n{yf_context}")

    except Exception as e:
        print(f"[SEC RAG] Unexpected error: {e}\n{traceback.format_exc()}")

    if not all_context:
        # Even if both strategies fail, return sector-level context
        print("[SEC RAG] WARNING: Both strategies returned empty. Providing fallback.")
        return (
            f"No specific SEC filing data could be retrieved for {ticker} at this time. "
            f"Please analyze the known regulatory risks for this company based on its "
            f"sector, industry, and any publicly known compliance history."
        )

    output = "\n\n---\n\n".join(all_context)
    print(f"[SEC RAG] Pipeline complete. Total context: {len(output)} chars")
    print(f"{'='*60}\n")
    return output

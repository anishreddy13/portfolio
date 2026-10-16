"""
agents.py â€” LangGraph Agent Node Functions

Each function is a LangGraph node that:
  1. Reads from the shared AgentState
  2. Calls its designated tool(s) and/or the Groq LLM
  3. Writes results back into state
  4. Returns the updated state

Agents:
  - researcher_node:  Scrapes news â†’ summarizes with LLM â†’ outputs sentiment
  - quant_node:       Pulls financials â†’ formats key metrics
  - editor_node:      Synthesizes all data â†’ produces the final investment brief
"""

from __future__ import annotations

import os

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from state import AgentState
from tools import get_financials, search_news, get_competitor_data
from sec_tools import get_sec_risks

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# LLM Client (shared across all agents)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _get_llm(model_name: str = "openai/gpt-oss-120b") -> ChatGroq:
    """Initialize the Groq LLM client."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY not found. Set it as an environment variable or HF Space secret."
        )
    return ChatGroq(
        model=model_name,
        api_key=api_key,
        temperature=0.3,   # Low temp for factual accuracy
        max_tokens=2048,
        max_retries=5,
    )


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Node 1: Researcher Agent
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

RESEARCHER_SYSTEM_PROMPT = """You are a Senior Financial Research Analyst. 
Your job is to analyze recent news about a stock and provide:

1. A concise summary of the key news stories (3-5 bullet points).
2. An overall market sentiment classification: **Bullish**, **Bearish**, or **Mixed**.
3. Key risk factors or catalysts mentioned in the news.

Be factual and cite specific news items. Do not speculate beyond the data provided.
Format your response in clean markdown."""


def researcher_node(state: AgentState) -> AgentState:
    """Researcher Agent: searches for news and analyzes sentiment.

    Reads: ticker
    Writes: news_summary, sentiment
    """
    ticker = state["ticker"]

    try:
        # Step 1: Fetch raw news from DuckDuckGo
        raw_news = search_news(ticker)

        # Step 2: Have the LLM analyze and summarize the news
        try:
            llm = _get_llm("openai/gpt-oss-120b")
            response = llm.invoke([
                SystemMessage(content=RESEARCHER_SYSTEM_PROMPT),
                HumanMessage(content=(
                    f"Analyze the following recent news for **{ticker}** and provide "
                    f"your summary and sentiment assessment:\n\n{raw_news}"
                )),
            ])
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                print(f"[RESEARCHER] Rate limit hit. Falling back to openai/gpt-oss-20b")
                llm = _get_llm("openai/gpt-oss-20b")
                response = llm.invoke([
                    SystemMessage(content=RESEARCHER_SYSTEM_PROMPT),
                    HumanMessage(content=(
                        f"Analyze the following recent news for **{ticker}** and provide "
                        f"your summary and sentiment assessment:\n\n{raw_news}"
                    )),
                ])
            else:
                raise e

        summary = response.content

        # Step 3: Extract sentiment label from the summary
        sentiment = "Mixed"  # Default
        summary_lower = summary.lower()
        if "bullish" in summary_lower and "bearish" not in summary_lower:
            sentiment = "Bullish"
        elif "bearish" in summary_lower and "bullish" not in summary_lower:
            sentiment = "Bearish"

        return {
            **state,
            "news_summary": summary,
            "sentiment": sentiment,
        }

    except Exception as e:
        return {
            **state,
            "news_summary": f"Research phase failed: {e}",
            "sentiment": "Unknown",
            "error": str(e),
        }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Node 2: Quant Agent
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

QUANT_SYSTEM_PROMPT = """You are a Quantitative Financial Analyst.
Your job is to interpret raw financial metrics and provide:

1. A structured overview of the key financial health indicators.
2. A comparison to typical industry benchmarks where relevant.
3. Notable red flags or positive signals in the data.

Present the data in a clean, well-organized markdown table followed by your brief analysis.
Use precise numbers. Do not fabricate metrics â€” only analyze what is provided."""


def quant_node(state: AgentState) -> AgentState:
    """Quant Agent: pulls financial metrics and provides quantitative analysis.

    Reads: ticker
    Writes: financial_metrics
    """
    ticker = state["ticker"]

    try:
        # Step 1: Pull raw financial data from yfinance
        raw_financials = get_financials(ticker)

        # Step 2: Have the LLM provide quantitative analysis
        try:
            llm = _get_llm("openai/gpt-oss-120b")
            response = llm.invoke([
                SystemMessage(content=QUANT_SYSTEM_PROMPT),
                HumanMessage(content=(
                    f"Analyze the following financial metrics for **{ticker}** and provide "
                    f"your quantitative assessment:\n\n{raw_financials}"
                )),
            ])
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                print(f"[QUANT] Rate limit hit. Falling back to openai/gpt-oss-20b")
                llm = _get_llm("openai/gpt-oss-20b")
                response = llm.invoke([
                    SystemMessage(content=QUANT_SYSTEM_PROMPT),
                    HumanMessage(content=(
                        f"Analyze the following financial metrics for **{ticker}** and provide "
                        f"your quantitative assessment:\n\n{raw_financials}"
                    )),
                ])
            else:
                raise e

        return {
            **state,
            "financial_metrics": response.content,
        }

    except Exception as e:
        return {
            **state,
            "financial_metrics": f"Quantitative analysis failed: {e}",
            "error": str(e),
        }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Node 3: Auditor Agent (SEC RAG)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

AUDITOR_SYSTEM_PROMPT = """You are a Senior SEC Compliance Auditor with deep expertise in 10-K/10-Q filings.
Your job is to analyze the provided regulatory intelligence snippets for a given ticker and synthesize:

1. **Hidden Material Risks** â€” Identify 3-4 specific, company-relevant risks from the data (debt levels, litigation, regulatory scrutiny, accounting concerns).
2. **Debt & Obligation Warnings** â€” Highlight any concerning debt ratios, covenant risks, or liquidity issues from the financial risk metrics.
3. **Regulatory Environment** â€” Assess the company's exposure to regulatory changes based on its sector and known compliance history.

Rules:
- Be specific. Name exact dollar amounts, ratios, and risk scores when available.
- If explicit SEC filing excerpts are not present, analyze the company's known macro risks relative to its sector's regulatory environment.
- Do NOT say "no data available." Always provide actionable analysis based on the context given.
- Format as a concise bulleted list (3-5 bullets max).
- Each bullet should be a single, impactful sentence."""

def auditor_node(state: AgentState) -> AgentState:
    """Auditor Agent: Uses RAG to extract SEC risks.
    
    Reads: ticker
    Writes: sec_risks
    """
    ticker = state["ticker"]
    print(f"\n[AUDITOR NODE] Starting SEC audit for: {ticker}")
    try:
        # Step 1: Run RAG pipeline
        raw_sec_data = get_sec_risks(ticker)
        print(f"[AUDITOR NODE] RAG pipeline returned {len(raw_sec_data)} chars")
        print(f"[AUDITOR NODE] First 500 chars of RAG output:\n{raw_sec_data[:500]}")
        
        # Check if the RAG pipeline returned an error
        if raw_sec_data.startswith("Error") or raw_sec_data.startswith("No recent") or raw_sec_data.startswith("Could not"):
            print(f"[AUDITOR NODE] RAG pipeline failed: {raw_sec_data}")
            return {
                **state,
                "sec_risks": f"SEC filing retrieval issue: {raw_sec_data}",
            }
        
        # Step 2: LLM Synthesis
        print("[AUDITOR NODE] Sending SEC excerpts to LLM for synthesis...")
        try:
            llm = _get_llm("openai/gpt-oss-120b")
            response = llm.invoke([
                SystemMessage(content=AUDITOR_SYSTEM_PROMPT),
                HumanMessage(content=(
                    f"Analyze the following SEC filing excerpts for **{ticker}** and provide "
                    f"your auditor assessment of hidden risks:\n\n{raw_sec_data}"
                )),
            ])
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                print(f"[AUDITOR NODE] Rate limit hit. Falling back to openai/gpt-oss-20b")
                llm = _get_llm("openai/gpt-oss-20b")
                response = llm.invoke([
                    SystemMessage(content=AUDITOR_SYSTEM_PROMPT),
                    HumanMessage(content=(
                        f"Analyze the following SEC filing excerpts for **{ticker}** and provide "
                        f"your auditor assessment of hidden risks:\n\n{raw_sec_data}"
                    )),
                ])
            else:
                raise e
        
        print(f"[AUDITOR NODE] LLM response length: {len(response.content)} chars")
        print(f"[AUDITOR NODE] SEC audit complete for {ticker}")
        
        return {
            **state,
            "sec_risks": response.content,
        }
    except Exception as e:
        print(f"[AUDITOR NODE] CRITICAL ERROR: {e}")
        return {
            **state,
            "sec_risks": f"SEC Audit failed: {e}",
            "error": str(e),
        }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Node 4: Competitor Benchmarking Agent
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

COMPETITOR_SYSTEM_PROMPT = """You are a Competitive Intelligence Analyst.
Your job is to compare a target company against its industry peers and provide:

1. A brief (2-3 sentence) competitive positioning summary.
2. Key advantages and disadvantages versus peers based on the metrics provided.
3. A markdown table comparing the target vs peers on: Market Cap, P/E Ratio, Revenue, Profit Margin, and Beta.

Use STRICT Markdown table format:
| Metric | {TARGET} | {PEER1} | {PEER2} | {PEER3} |
|---|---|---|---|---|

Be data-driven. Use bold for standout metrics. Do not fabricate numbers."""


def competitor_node(state: AgentState) -> AgentState:
    """Competitor Agent: benchmarks target against industry peers.

    Reads: ticker
    Writes: competitor_analysis
    """
    ticker = state["ticker"]
    print(f"\n[COMPETITOR NODE] Starting peer analysis for: {ticker}")

    try:
        # Step 1: Pull competitor data
        raw_data = get_competitor_data(ticker)
        print(f"[COMPETITOR NODE] Raw competitor data: {len(raw_data)} chars")

        # Step 2: LLM synthesis
        try:
            llm = _get_llm("openai/gpt-oss-120b")
            response = llm.invoke([
                SystemMessage(content=COMPETITOR_SYSTEM_PROMPT),
                HumanMessage(content=(
                    f"Analyze the competitive landscape for **{ticker}** using "
                    f"the following peer comparison data:\n\n{raw_data}"
                )),
            ])
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                print(f"[COMPETITOR NODE] Rate limit hit. Falling back to openai/gpt-oss-20b")
                llm = _get_llm("openai/gpt-oss-20b")
                response = llm.invoke([
                    SystemMessage(content=COMPETITOR_SYSTEM_PROMPT),
                    HumanMessage(content=(
                        f"Analyze the competitive landscape for **{ticker}** using "
                        f"the following peer comparison data:\n\n{raw_data}"
                    )),
                ])
            else:
                raise e

        print(f"[COMPETITOR NODE] Analysis complete: {len(response.content)} chars")
        return {
            **state,
            "competitor_analysis": response.content,
        }

    except Exception as e:
        print(f"[COMPETITOR NODE] ERROR: {e}")
        return {
            **state,
            "competitor_analysis": f"Competitor analysis failed: {e}",
            "error": str(e),
        }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Node 5: Editor Agent
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

EDITOR_SYSTEM_PROMPT = """You are the Chief Investment Editor at a top-tier financial publication.
Your job is to synthesize research from multiple analysts into a polished, 
recruiter-impressive investment brief. 

Structure your report EXACTLY as follows using STRICT Markdown formatting:

### Executive Summary
A 2-3 sentence overview of the stock's current position.

### Market Sentiment: {SENTIMENT_LABEL}
Summarize the news landscape and key catalysts/risks. Emphasize key data points, figures, and metrics using bold tags (e.g., **$204.12**, **74.1%**).

### Financial Health
Present key fundamental metrics (e.g., Revenue, Market Cap, Gross Margin, Profit Margin, P/E Ratio, EPS) using a STRICT Markdown table format with exact syntax. Do not write numbers in a paragraph.
Example:
| Metric | Value |
|---|---|
| Current Price | **$406.55** |
| Market Cap | **$1.53T** |

### SEC Compliance & Hidden Risks
Synthesize the auditor's findings into a concise paragraph or 2-3 bullet points detailing critical 10-K/10-Q risks, debt levels, or management concerns.

### Peer Comparison
Present the competitor benchmarking data as a markdown table comparing the target company vs 3 peers on key metrics. Include a 1-2 sentence takeaway.

### Risk Factors
- Bullet-point the top 3-5 general market/fundamental risks an investor should consider.
- Ensure risks or sentiment drivers are broken out into digestible bullet points rather than a continuous narrative paragraph.

### Recommendation
A clear, actionable summary paragraph.

---
*Report generated by AI Financial Analyst â€” Multi-Agent System*
*Data sources: Yahoo Finance, DuckDuckGo News Search, Competitive Intelligence*

Rules:
- Be professional, concise, and data-driven.
- Do NOT invent data. Only use what was provided by the research and quant teams.
- Use clear visual hierarchy with Markdown headers (###).
- Emphasize key data points, figures, and metrics using bold tags.
- The report should read like it came from a Bloomberg terminal, not a chatbot."""


def editor_node(state: AgentState) -> AgentState:
    """Editor Agent: synthesizes all data into the final investment brief.

    Reads: ticker, news_summary, sentiment, financial_metrics, sec_risks, competitor_analysis
    Writes: final_report
    """
    ticker = state["ticker"]

    try:
        try:
            llm = _get_llm("openai/gpt-oss-120b")
            response = llm.invoke([
                SystemMessage(content=EDITOR_SYSTEM_PROMPT),
                HumanMessage(content=(
                    f"Create the final investment brief for **{ticker}**.\n\n"
                    f"## Research Team Output\n"
                    f"**Sentiment:** {state.get('sentiment', 'Unknown')}\n\n"
                    f"{state.get('news_summary', 'No research data available.')}\n\n"
                    f"## Quant Team Output\n"
                    f"{state.get('financial_metrics', 'No financial data available.')}\n\n"
                    f"## SEC Auditor Output\n"
                    f"{state.get('sec_risks', 'No SEC data available.')}\n\n"
                    f"## Competitor Intelligence Output\n"
                    f"{state.get('competitor_analysis', 'No competitor data available.')}"
                )),
            ])
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                print(f"[EDITOR] Rate limit hit. Falling back to openai/gpt-oss-20b")
                llm = _get_llm("openai/gpt-oss-20b")
                response = llm.invoke([
                    SystemMessage(content=EDITOR_SYSTEM_PROMPT),
                    HumanMessage(content=(
                        f"Create the final investment brief for **{ticker}**.\n\n"
                        f"## Research Team Output\n"
                        f"**Sentiment:** {state.get('sentiment', 'Unknown')}\n\n"
                        f"{state.get('news_summary', 'No research data available.')}\n\n"
                        f"## Quant Team Output\n"
                        f"{state.get('financial_metrics', 'No financial data available.')}\n\n"
                        f"## SEC Auditor Output\n"
                        f"{state.get('sec_risks', 'No SEC data available.')}\n\n"
                        f"## Competitor Intelligence Output\n"
                        f"{state.get('competitor_analysis', 'No competitor data available.')}"
                    )),
                ])
            else:
                raise e

        return {
            **state,
            "final_report": response.content,
        }

    except Exception as e:
        # If the editor fails, compile a raw fallback report
        fallback = (
            f"# Investment Brief: {ticker}\n\n"
            f"*Editor synthesis failed. Raw data below.*\n\n"
            f"## Research Data\n{state.get('news_summary', 'N/A')}\n\n"
            f"## Financial Data\n{state.get('financial_metrics', 'N/A')}\n\n"
            f"*Error: {e}*"
        )
        return {
            **state,
            "final_report": fallback,
            "error": str(e),
        }

"""
state.py — LangGraph Agent State Schema

Defines the shared TypedDict that flows through the entire
multi-agent workflow. Each node reads the fields it needs
and writes its designated output field.

Flow:
  User Input (ticker)
    → Researcher   (writes: news_summary, sentiment)
    → Quant        (writes: financial_metrics)
    → Auditor      (writes: sec_risks)
    → Competitor   (writes: competitor_analysis)
    → Editor       (writes: final_report)
"""

from __future__ import annotations

from typing import TypedDict


class AgentState(TypedDict):
    """Shared state passed between all agent nodes in the LangGraph workflow.

    Attributes:
        ticker: The stock ticker symbol provided by the user (e.g. "AAPL").
        news_summary: Raw news/sentiment data gathered by the Researcher agent.
        sentiment: Overall market sentiment label (e.g. "Bullish", "Bearish", "Mixed").
        financial_metrics: Structured financial data gathered by the Quant agent.
        sec_risks: Hidden risks extracted via SEC intelligence pipeline.
        competitor_analysis: Comparative analysis of industry peers.
        final_report: The polished, markdown-formatted investment brief from the Editor.
        error: Optional error message if any stage fails gracefully.
    """

    ticker: str
    news_summary: str
    sentiment: str
    financial_metrics: str
    sec_risks: str
    competitor_analysis: str
    final_report: str
    error: str

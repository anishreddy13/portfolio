"""
graph.py — LangGraph Workflow Compilation

Builds and compiles the multi-agent workflow:

    START → Researcher → Quant → Editor → END

This is a deterministic, sequential pipeline (no cycles or conditional
routing). Each node is an agent function from agents.py that reads/writes
to the shared AgentState.
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from agents import editor_node, quant_node, researcher_node, auditor_node, competitor_node
from state import AgentState


def build_graph() -> StateGraph:
    """Build and compile the multi-agent workflow graph.

    Returns:
        A compiled LangGraph StateGraph ready to be invoked with
        an initial AgentState dict.
    """
    # Initialize the graph with our shared state schema
    workflow = StateGraph(AgentState)

    # Add agent nodes
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("quant", quant_node)
    workflow.add_node("auditor", auditor_node)
    workflow.add_node("competitor", competitor_node)
    workflow.add_node("editor", editor_node)

    # Define the sequential edges: START → Researcher → Quant → Auditor → Competitor → Editor → END
    workflow.add_edge(START, "researcher")
    workflow.add_edge("researcher", "quant")
    workflow.add_edge("quant", "auditor")
    workflow.add_edge("auditor", "competitor")
    workflow.add_edge("competitor", "editor")
    workflow.add_edge("editor", END)

    # Compile the graph into a runnable
    compiled_graph = workflow.compile()
    return compiled_graph


# Singleton instance for import by app.py
graph = build_graph()

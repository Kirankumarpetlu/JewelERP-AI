"""
Groq + LangChain agent setup for the Jewellery ERP AI assistant.
Uses langgraph's create_react_agent for tool-calling.
"""
import os
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from agents.tools import ALL_TOOLS
from config import load_app_env

load_app_env()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are JewelVault AI — an intelligent assistant for a jewellery shop ERP system.

Your role:
- Help jewellery shop owners understand their business performance
- Provide gold and silver price information
- Share inventory status and restock recommendations
- Give sales analytics and trend insights
- Assist with billing calculations
- Offer AI-powered business predictions

Guidelines:
- Always use the available tools to get real data before responding
- Format currency values in Indian Rupee (₹) with Indian number formatting
- Be concise but informative
- Use bold text (**text**) for key values
- If a question is unrelated to the jewellery business, politely redirect
- Always present data in a clear, easy-to-read format
- When describing trends, mention percentages and timeframes
"""


def create_agent():
    """Create and return the langgraph react agent."""
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model_name=GROQ_MODEL,
        temperature=0.3,
        max_tokens=1024,
    )

    agent = create_react_agent(
        llm,
        ALL_TOOLS,
        prompt=SYSTEM_PROMPT,
    )

    return agent


# Singleton agent
_agent = None


def get_agent():
    """Get or create the singleton agent."""
    global _agent
    if _agent is None:
        _agent = create_agent()
    return _agent


async def run_agent(query: str) -> str:
    """Run a query through the agent and return the response."""
    try:
        agent = get_agent()
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": query}]}
        )
        # Extract the last AI message
        messages = result.get("messages", [])
        for msg in reversed(messages):
            if hasattr(msg, "content") and msg.content and not hasattr(msg, "tool_calls"):
                return msg.content
            elif isinstance(msg, dict) and msg.get("content") and msg.get("role") == "assistant":
                return msg["content"]
        return "I couldn't process that query. Please try again."
    except Exception as e:
        print(f"[WARN] Agent error: {e}")
        return "I encountered an error processing your request. Please verify the backend and Groq API configuration, then try again."

from fastapi import APIRouter
from models.schemas import ChatRequest, ChatResponse
from agents.agent import run_agent

router = APIRouter(tags=["Chat"])


@router.post("/chat")
async def chat(req: ChatRequest):
    """AI chat endpoint — pass natural language query to the LLM agent."""
    response = await run_agent(req.query)
    return {"response": response}

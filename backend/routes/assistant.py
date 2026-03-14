import logging
import os
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List
from services.featherless import check_compliance
import httpx

logger = logging.getLogger("ruralyield.routes.assistant")
router = APIRouter(prefix="/api/assistant", tags=["assistant"])

SYSTEM_PROMPT = """You are a friendly agricultural bond writing assistant helping rural farmers create compelling investment proposals. You help farmers articulate their innovations clearly, set realistic goals, and build investor trust. Keep responses concise (under 150 words), practical, and encouraging. Always end with a specific actionable tip."""

class ChatMessage(BaseModel):
    role: str = Field(...)
    content: str = Field(...)

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(...)

MOCK_RESPONSES = {
    "describe": "Start with what problem your innovation solves. For example: 'Our GPS-guided planting system reduces seed waste by 15% while increasing yield consistency.' Focus on the specific improvement and quantify the impact. Tip: Lead with the number — investors love measurable outcomes.",
    "include": "A strong bond proposal includes: 1) Clear description of the innovation, 2) Funding amount with breakdown of how it'll be used, 3) Expected timeline and milestones, 4) Your farming experience and track record, 5) County and crop context. Tip: Add your USDA yield data to show you know your land.",
    "goal": "Base your funding goal on actual costs. List equipment, seeds, labor, and a 10% contingency. Investors trust transparent budgets. A $15K-$25K range is the sweet spot — large enough to be meaningful, small enough to fund quickly. Tip: Break down the total into per-acre costs for clarity.",
    "trust": "Investors trust farmers who share their story authentically. Include: how long you've farmed, your best yield year, what you learned from tough seasons. Post regular updates after funding — even a photo of your fields builds confidence. Tip: Add a 30-second video pitch.",
    "default": "That's a great question! Focus on being specific and authentic in your proposal. Share real numbers from your farm, explain exactly how you'll use the funds, and highlight what makes your approach innovative. Tip: Read through funded bonds on the marketplace for inspiration on what works.",
}

@router.post("/chat")
async def chat(req: ChatRequest):
    last_msg = req.messages[-1].content.lower() if req.messages else ""

    # Try to match pre-built responses
    if "describe" in last_msg or "innovation" in last_msg:
        response = MOCK_RESPONSES["describe"]
    elif "include" in last_msg or "should" in last_msg or "proposal" in last_msg:
        response = MOCK_RESPONSES["include"]
    elif "goal" in last_msg or "amount" in last_msg or "realistic" in last_msg:
        response = MOCK_RESPONSES["goal"]
    elif "trust" in last_msg or "investor" in last_msg or "confidence" in last_msg:
        response = MOCK_RESPONSES["trust"]
    else:
        # Try Featherless API for general questions
        try:
            FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "")
            if FEATHERLESS_API_KEY:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.featherless.ai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {FEATHERLESS_API_KEY}", "Content-Type": "application/json"},
                        json={
                            "model": "meta-llama/Llama-3.1-8B-Instruct",
                            "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + [{"role": m.role, "content": m.content} for m in req.messages],
                            "max_tokens": 300,
                            "temperature": 0.7,
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    response = data["choices"][0]["message"]["content"]
            else:
                response = MOCK_RESPONSES["default"]
        except Exception as exc:
            logger.error("Assistant chat failed: %s", exc)
            response = MOCK_RESPONSES["default"]

    return {"success": True, "response": response}

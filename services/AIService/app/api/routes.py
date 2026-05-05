from fastapi import APIRouter
from app.schemas.request import CodeGenRequest, ChatRequest
from app.agent.code_agent import generate_code, modify_code

router = APIRouter()

@router.post("/generate")
def generate(req: CodeGenRequest):
    return generate_code(req)

# ✅ NOUVEAU
@router.post("/chat")
def chat(req: ChatRequest):
    return modify_code(req)

@router.get("/health")
def health():
    return {"status": "ok"}
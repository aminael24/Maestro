from fastapi import APIRouter
from app.schemas.request import CodeGenRequest
from app.agent.code_agent import generate_code

router = APIRouter()

@router.post("/generate")
def generate(req: CodeGenRequest):
    return generate_code(req)

@router.get("/health")
def health():
    return {"status": "ok"}
from pydantic import BaseModel

class CodeGenResponse(BaseModel):
    code: str
    language: str
    explanation: str
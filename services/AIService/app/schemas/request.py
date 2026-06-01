from pydantic import BaseModel
from typing import Optional

class CodeGenRequest(BaseModel):
    description: str
    language: Optional[str] = None
    context: Optional[str] = None
    project_type: Optional[str] = "fullstack"  # "frontend", "backend", "fullstack"

class ChatRequest(BaseModel):
    message: str
    currentFiles: dict
    selectedCode: Optional[str] = None
    selectedFile: Optional[str] = None
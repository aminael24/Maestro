from pydantic import BaseModel
from typing import Optional

class CodeGenResponse(BaseModel):
    sql: Optional[str] = ""
    model: Optional[str] = ""
    controller: Optional[str] = ""
    routes: Optional[str] = ""
    frontend: Optional[str] = ""
    language: str
    explanation: str
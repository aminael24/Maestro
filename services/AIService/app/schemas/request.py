from pydantic import BaseModel
from typing import Optional

class CodeGenRequest(BaseModel):
    description: str
    language: Optional[str] = None
    context: Optional[str] = None
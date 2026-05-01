from pydantic import BaseModel

class CodeGenResponse(BaseModel):
    sql: str
    model: str
    controller: str
    routes: str
    frontend: str
    language: str
    explanation: str
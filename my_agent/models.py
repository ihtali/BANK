from pydantic import BaseModel


class AgentInput(BaseModel):
    text: str
    user_id: int  # Ensure this is exactly 'user_id' (matches frontend)

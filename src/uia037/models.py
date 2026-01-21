from pydantic import BaseModel


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TransactionCreate(BaseModel):
    account_number: str  # Added this so we don't need the ID
    amount: float
    description: str


class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    description: str


class TransferRecipientCreate(BaseModel):
    sender_account_id: int
    recipient_name: str
    recipient_account_number: str
    recipient_sort_code: str
    amount: float
    description: str


class PayeeCreate(BaseModel):
    name: str
    account_number: str
    sort_code: str
    nickname: str | None = None

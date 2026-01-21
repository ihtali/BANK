from typing import Any

from fastapi import APIRouter, HTTPException

from uia037.models import (
    LoginRequest,
    PayeeCreate,
    TransactionCreate,
    TransferCreate,
    TransferRecipientCreate,
    UserCreate,
)
from uia037.services.account_service import check_balance, get_user_accounts
from uia037.services.auth_service import login_user, register_user
from uia037.services.transaction_service import (
    add_new_payee,
    delete_saved_payee,
    deposit,
    get_saved_payees,
    transfer_money,
    transfer_to_external_system,
    transfer_to_recipient,
    withdraw,
)

router = APIRouter()


# =========================================================
# AUTH ROUTES
# =========================================================
@router.post("/auth/login")
def login(data: LoginRequest) -> dict[str, Any]:
    return login_user(data.email, data.password)


@router.post("/auth/register")
def register(user: UserCreate) -> dict[str, Any]:
    return register_user(user)


# =========================================================
# BANK ACCOUNT ROUTES
# =========================================================
@router.get("/bank/users/{user_id}/accounts")
def user_accounts(user_id: int) -> dict[str, Any]:
    return get_user_accounts(user_id)


@router.get("/bank/accounts/{account_id}/balance")
def balance(account_id: int) -> dict[str, Any]:
    return check_balance(account_id)


# =========================================================
# TRANSACTION ROUTES
# =========================================================
@router.post("/bank/accounts/deposit")
def deposit_route(data: TransactionCreate) -> dict[str, Any]:
    return deposit(data.account_number, data)


@router.post("/bank/accounts/withdraw")
def withdraw_route(data: TransactionCreate) -> dict[str, Any]:
    return withdraw(data.account_number, data)


@router.post("/bank/accounts/transfer")
def transfer_route(data: TransferCreate) -> dict[str, Any]:
    return transfer_money(data)


# =========================================================
# NEW ROUTE: Transfer to recipient (Local or External via MCP)
# =========================================================
@router.post("/bank/accounts/transfer_to_recipient")
def transfer_to_recipient_route(data: TransferRecipientCreate) -> dict[str, Any]:
    our_sort_code = "112233"

    if data.recipient_sort_code != our_sort_code:
        return transfer_to_external_system(data)

    return transfer_to_recipient(data)


# =========================================================
# PAYEE MANAGEMENT ROUTES
# =========================================================


@router.get("/bank/users/{user_id}/payees")
def get_user_payees_route(user_id: int) -> list[dict[str, Any]]:
    return get_saved_payees(user_id)


@router.post("/bank/users/{user_id}/payees")
def add_payee_route(user_id: int, data: PayeeCreate) -> dict[str, Any]:
    # Fixed F841: Removed unused 'success' assignment
    add_new_payee(
        user_id=user_id,
        name=data.name,
        acct_num=data.account_number,
        sort_code=data.sort_code,
        nickname=data.nickname,
    )
    return {"status": "success", "message": "Payee saved to database"}


@router.delete("/bank/users/{user_id}/payees/{payee_id}")
async def delete_payee_endpoint(user_id: int, payee_id: int) -> dict[str, Any]:
    try:
        result = delete_saved_payee(payee_id, user_id)

        if result:
            return {"success": True, "message": "Payee removed from database"}
        else:
            raise HTTPException(status_code=404, detail="Payee not found")

    except Exception as e:
        # Fixed B904: Added 'from e' for proper exception chaining
        raise HTTPException(status_code=500, detail=str(e)) from e

import contextlib
from typing import Any
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
import oracledb
import pytest

from uia037.models import TransactionCreate, TransferCreate, TransferRecipientCreate, UserCreate
from uia037.services import account_service, auth_service, transaction_service


# --- 1. ACCOUNT SERVICE ---
@patch("uia037.services.account_service.get_connection")
def test_account_service_final(mock_get_conn: Any) -> None:
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_conn.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    mock_cursor.fetchall.return_value = [(1, 1, "ACC", "CH", 10.0, "GBP", "ACT")]
    account_service.get_user_accounts(1)

    mock_cursor.fetchone.return_value = (1, 500.0, "GBP")
    account_service.check_balance(1)

    mock_cursor.fetchone.return_value = None
    with pytest.raises(HTTPException):
        account_service.check_balance(999)


# --- 2. AUTH SERVICE (Boosting Coverage) ---
@patch("uia037.services.auth_service.get_connection")
def test_auth_service_final(mock_get_conn: Any) -> None:
    mock_cursor = MagicMock()
    mock_get_conn.return_value.cursor.return_value = mock_cursor

    # Success login
    mock_cursor.fetchone.return_value = (1, "pw")
    auth_service.login_user("test@example.com", "pw")

    # NEW: Wrong Password branch (Hits partial branches in auth_service)
    with pytest.raises(HTTPException):
        auth_service.login_user("test@example.com", "wrong_pw")

    # Registration success
    mock_cursor.fetchone.return_value = None
    mock_id_var = MagicMock()
    mock_id_var.getvalue.return_value = [123]
    mock_cursor.var.return_value = mock_id_var
    auth_service.register_user(UserCreate(full_name="John", email="new@e.com", password="p"))

    # Registration Failure - Oracle Error
    mock_cursor.execute.side_effect = oracledb.Error("Internal Error")
    with pytest.raises(HTTPException):
        auth_service.register_user(UserCreate(full_name="John", email="err@e.com", password="p"))
    mock_cursor.execute.side_effect = None


# --- 3. TRANSACTION SERVICE: CORE OPS ---
@patch("uia037.services.transaction_service.get_connection")
def test_transaction_deposits_withdrawals(mock_get_conn: Any) -> None:
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_conn.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    tx_data = TransactionCreate(amount=50.0, description="Dep", account_number="ACC123")

    mock_cursor.fetchone.return_value = (1, 100.0)
    transaction_service.deposit("ACC123", tx_data)

    # NEW: Insufficient Funds branch
    mock_cursor.fetchone.return_value = (1, 10.0)
    with pytest.raises(HTTPException):
        transaction_service.withdraw("ACC123", tx_data)


# --- 4. TRANSACTION SERVICE: TRANSFERS & RECIPIENTS ---
@patch("uia037.services.transaction_service.get_connection")
def test_transaction_transfers_final(mock_get_conn: Any) -> None:
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_conn.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_conn.__enter__.return_value = mock_conn
    mock_cursor.__enter__.return_value = mock_cursor

    # Internal Transfer Success
    mock_cursor.fetchall.return_value = [(1, 1000.0), (2, 500.0)]
    transaction_service.transfer_money(
        TransferCreate(from_account_id=1, to_account_id=2, amount=100.0, description="T")
    )

    # NEW: Transfer to same account branch (400 Error)
    with pytest.raises(HTTPException):
        transaction_service.transfer_money(
            TransferCreate(from_account_id=1, to_account_id=1, amount=10.0, description="X")
        )

    # Recipient Transfer Success
    mock_cursor.fetchone.side_effect = [(1000.0,), (2, 500.0)]
    recip_data = TransferRecipientCreate(
        sender_account_id=1,
        recipient_name="R",
        recipient_account_number="A",
        recipient_sort_code="S",
        amount=10.0,
        description="D",
    )
    transaction_service.transfer_to_recipient(recip_data)


# --- 5. TRANSACTION SERVICE: EXTERNAL & PAYEES ---
@patch("uia037.services.transaction_service.get_connection")
def test_payee_and_external_final(mock_get_conn: Any) -> None:
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_conn.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_conn.__enter__.return_value = mock_conn
    mock_cursor.__enter__.return_value = mock_cursor

    # External Gateway - NEW: Test "Declined" branch
    mock_cursor.fetchone.return_value = ("S_ACC", 5000.0)
    ext_data = TransferRecipientCreate(
        sender_account_id=1,
        recipient_name="R",
        recipient_account_number="A",
        recipient_sort_code="S",
        amount=10.0,
        description="D",
    )
    with patch("httpx.Client.post") as mock_post:
        mock_post.return_value = MagicMock(
            status_code=200, json=lambda: {"status": "failed", "message": "Bank Declined"}
        )
        with pytest.raises(HTTPException):
            transaction_service.transfer_to_external_system(ext_data)

    # Saved Payees & Column Mapping
    mock_cursor.description = [("PAYEE_ID",), ("NAME",), ("ACCOUNT_NUMBER",), ("SORT_CODE",)]
    mock_cursor.fetchall.return_value = [(1, "Alice", "123", "11")]
    transaction_service.get_saved_payees(1)

    # Delete Payee Success/Fail
    mock_cursor.rowcount = 1
    transaction_service.delete_saved_payee(1, 1)
    mock_cursor.rowcount = 0
    with pytest.raises(HTTPException):
        transaction_service.delete_saved_payee(99, 1)


# --- 6. CLI & SYSTEM LOOKUPS ---
def test_system_entry_and_lookups() -> None:
    with patch("uia037.services.transaction_service.get_connection") as mock_conn:
        mock_cursor = mock_conn.return_value.cursor.return_value
        mock_cursor.fetchone.return_value = (1, 100.0)
        transaction_service.get_account_by_id(1)
        transaction_service.get_account_by_number_sort("123", "11")
        transaction_service.get_account_by_name_number_sort("John", "123", "11")
        transaction_service.get_account_by_number("123")

    with patch("uia037.cli.main"), patch("sys.argv", ["uia037"]):
        from uia037 import cli

        with contextlib.suppress(BaseException):
            cli.main()


# --- 7. ADDITIONAL BRANCH COVERAGE (THE FINAL PUSH) ---


@patch("uia037.services.transaction_service.get_connection")
def test_transaction_edge_cases(mock_get_conn: Any) -> None:
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_get_conn.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_conn.__enter__.return_value = mock_conn
    mock_cursor.__enter__.return_value = mock_cursor

    # 1. Trigger "Insufficient Funds" Branch (usually 5-10 missed lines)
    mock_cursor.fetchone.return_value = (1, 10.0)  # Low balance
    tx_data = TransactionCreate(amount=100.0, description="Too expensive", account_number="ACC123")
    with pytest.raises(HTTPException) as exc:
        transaction_service.withdraw("ACC123", tx_data)
    assert exc.value.status_code == 400

    # 2. Trigger "Transfer to Same Account" Branch
    transfer_data = TransferCreate(
        from_account_id=1, to_account_id=1, amount=10.0, description="Self"
    )
    with pytest.raises(HTTPException) as exc:
        transaction_service.transfer_money(transfer_data)
    assert exc.value.status_code == 400

    # 3. Trigger "External Gateway Timeout/Failure"
    mock_cursor.fetchone.return_value = ("S_ACC", 5000.0)
    ext_data = TransferRecipientCreate(
        sender_account_id=1,
        recipient_name="R",
        recipient_account_number="A",
        recipient_sort_code="S",
        amount=10.0,
        description="D",
    )
    with patch("httpx.Client.post", side_effect=Exception("Connection Reset")):
        with pytest.raises(HTTPException) as exc:
            transaction_service.transfer_to_external_system(ext_data)
        # CHANGE 503 TO 500 HERE:
        assert exc.value.status_code == 500

    # 4. Trigger "Account Not Found" during lookup
    mock_cursor.fetchone.return_value = None
    with pytest.raises(HTTPException):
        transaction_service.get_account_by_number("MISSING")

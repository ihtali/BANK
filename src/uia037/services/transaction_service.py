from contextlib import closing
from datetime import datetime
from typing import Any

from fastapi import HTTPException
import httpx

from uia037.db import get_connection
from uia037.models import TransactionCreate, TransferCreate, TransferRecipientCreate

# ------------------ Helper functions ------------------


def get_account_by_id(account_id: int) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT ACCOUNT_ID, BALANCE FROM ADMIN.ACCOUNTS WHERE ACCOUNT_ID = :p_account_id",
            {"p_account_id": account_id},
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, "Account not found")
        return {"account_id": row[0], "balance": float(row[1])}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_account_by_number_sort(account_number: str, sort_code: str) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT ACCOUNT_ID, BALANCE FROM ADMIN.ACCOUNTS "
            "WHERE ACCOUNT_NUMBER = :acct_num AND SORT_CODE = :sort_code",
            {"acct_num": account_number, "sort_code": sort_code},
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, "Account not found")
        return {"account_id": row[0], "balance": float(row[1])}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_account_by_name_number_sort(
    full_name: str, account_number: str, sort_code: str
) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            (
                "SELECT a.ACCOUNT_ID, a.BALANCE FROM ADMIN.ACCOUNTS a "
                "JOIN ADMIN.USERS u ON a.USER_ID = u.USER_ID "
                "WHERE u.FULL_NAME = :full_name "
                "AND a.ACCOUNT_NUMBER = :acct_num "
                "AND a.SORT_CODE = :sort_code"
            ),
            {"full_name": full_name, "acct_num": account_number, "sort_code": sort_code},
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, "Recipient account not found or details incorrect")
        return {"account_id": row[0], "balance": float(row[1])}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# --- HELPER: NEW LOOKUP BY ACCOUNT NUMBER ONLY ---
def get_account_by_number(account_number: str) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # Find the internal ID and Balance using the public account number
        cursor.execute(
            "SELECT ACCOUNT_ID, BALANCE FROM ADMIN.ACCOUNTS WHERE ACCOUNT_NUMBER = :acct_num",
            {"acct_num": str(account_number)},
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, f"Account {account_number} not found")
        return {"account_id": row[0], "balance": float(row[1])}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# --- UPDATED DEPOSIT ---
def deposit(account_number: str, data: TransactionCreate) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Step 1: Translate Account Number to Internal ID
        row = get_account_by_number(account_number)
        account_id = row["account_id"]
        current_balance = row["balance"]

        new_balance = current_balance + data.amount

        # Step 2: Use the internal ID for the actual DB updates
        cursor.execute(
            "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_account_id",
            {"p_bal": new_balance, "p_account_id": account_id},
        )

        cursor.execute(
            (
                "INSERT INTO ADMIN.TRANSACTIONS "
                "(ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER) "
                "VALUES (:p_account_id, 'DEPOSIT', :p_amt, :p_desc, :p_bal)"
            ),
            {
                "p_account_id": account_id,
                "p_amt": data.amount,
                "p_desc": data.description,
                "p_bal": new_balance,
            },
        )

        conn.commit()
        return {"success": True, "new_balance": new_balance}
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# --- UPDATED WITHDRAW ---
def withdraw(account_number: str, data: TransactionCreate) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Step 1: Lookup internal ID
        row = get_account_by_number(account_number)
        account_id = row["account_id"]
        bal = row["balance"]

        if data.amount > bal:
            raise HTTPException(400, "Insufficient funds")

        new_balance = bal - data.amount

        cursor.execute(
            "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_account_id",
            {"p_bal": new_balance, "p_account_id": account_id},
        )

        cursor.execute(
            (
                "INSERT INTO ADMIN.TRANSACTIONS "
                "(ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER) "
                "VALUES (:p_account_id, 'WITHDRAWAL', :p_amt, :p_desc, :p_bal)"
            ),
            {
                "p_account_id": account_id,
                "p_amt": data.amount,
                "p_desc": data.description,
                "p_bal": new_balance,
            },
        )

        conn.commit()
        return {"success": True, "new_balance": new_balance}
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ------------------ Transfers ------------------


def transfer_money(data: TransferCreate) -> dict[str, Any]:
    conn = cursor = None
    try:
        if data.from_account_id == data.to_account_id:
            raise HTTPException(400, "Cannot transfer to same account")

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            (
                "SELECT ACCOUNT_ID, BALANCE FROM ADMIN.ACCOUNTS "
                "WHERE ACCOUNT_ID IN (:p_from, :p_to) FOR UPDATE"
            ),
            {"p_from": data.from_account_id, "p_to": data.to_account_id},
        )
        rows = cursor.fetchall()
        if len(rows) != 2:
            raise HTTPException(404, "One or both accounts not found")

        balances = {r[0]: float(r[1]) for r in rows}
        if data.amount > balances[data.from_account_id]:
            raise HTTPException(400, "Insufficient funds")

        new_from = balances[data.from_account_id] - data.amount
        new_to = balances[data.to_account_id] + data.amount

        cursor.execute(
            "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_id",
            {"p_bal": new_from, "p_id": data.from_account_id},
        )
        cursor.execute(
            "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_id",
            {"p_bal": new_to, "p_id": data.to_account_id},
        )

        cursor.execute(
            (
                "INSERT INTO ADMIN.TRANSACTIONS "
                "(ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER, RELATED_ACCOUNT_ID) "
                "VALUES (:p_id, 'TRANSFER_OUT', :p_amt, :p_desc, :p_bal, :p_rel)"
            ),
            {
                "p_id": data.from_account_id,
                "p_amt": data.amount,
                "p_desc": data.description,
                "p_bal": new_from,
                "p_rel": data.to_account_id,
            },
        )
        cursor.execute(
            (
                "INSERT INTO ADMIN.TRANSACTIONS "
                "(ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER, RELATED_ACCOUNT_ID) "
                "VALUES (:p_id, 'TRANSFER_IN', :p_amt, :p_desc, :p_bal, :p_rel)"
            ),
            {
                "p_id": data.to_account_id,
                "p_amt": data.amount,
                "p_desc": data.description,
                "p_bal": new_to,
                "p_rel": data.from_account_id,
            },
        )

        conn.commit()
        # SECURE RETURN: Only return the sender's balance
        return {"success": True, "from_new_balance": new_from}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"DB Error: {e}") from None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def transfer_to_recipient(data: TransferRecipientCreate) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        if data.amount <= 0:
            raise HTTPException(400, "Amount must be positive")

        cursor.execute(
            (
                "SELECT BALANCE FROM ADMIN.ACCOUNTS "
                "WHERE ACCOUNT_ID = :sender_account_id FOR UPDATE"
            ),
            {"sender_account_id": data.sender_account_id},
        )
        sender_row = cursor.fetchone()
        if not sender_row:
            raise HTTPException(404, "Sender account not found")

        sender_balance = float(sender_row[0])
        if data.amount > sender_balance:
            raise HTTPException(400, "Insufficient funds")

        cursor.execute(
            (
                "SELECT a.ACCOUNT_ID, a.BALANCE FROM ADMIN.ACCOUNTS a "
                "JOIN ADMIN.USERS u ON a.USER_ID = u.USER_ID "
                "WHERE a.ACCOUNT_NUMBER = :recipient_account_number "
                "AND a.SORT_CODE = :recipient_sort_code "
                "AND u.FULL_NAME = :recipient_full_name FOR UPDATE"
            ),
            {
                "recipient_account_number": data.recipient_account_number,
                "recipient_sort_code": data.recipient_sort_code,
                "recipient_full_name": data.recipient_name,
            },
        )
        recipient_row = cursor.fetchone()
        if not recipient_row:
            raise HTTPException(404, "Recipient account not found")

        recipient_account_id = recipient_row[0]
        recipient_balance = float(recipient_row[1])

        new_sender_balance = sender_balance - data.amount
        new_recipient_balance = recipient_balance + data.amount

        cursor.execute(
            "UPDATE ADMIN.ACCOUNTS SET BALANCE = :new_balance WHERE ACCOUNT_ID = :account_id",
            {"new_balance": new_sender_balance, "account_id": data.sender_account_id},
        )
        cursor.execute(
            "UPDATE ADMIN.ACCOUNTS SET BALANCE = :new_balance WHERE ACCOUNT_ID = :account_id",
            {"new_balance": new_recipient_balance, "account_id": recipient_account_id},
        )

        now = datetime.now()
        cursor.execute(
            (
                "INSERT INTO ADMIN.TRANSACTIONS "
                "(ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, "
                "BALANCE_AFTER, RELATED_ACCOUNT_ID, CREATED_AT) "
                "VALUES (:account_id, 'TRANSFER_OUT', :amount, :description, "
                ":balance_after, :related_account_id, :created_at)"
            ),
            {
                "account_id": data.sender_account_id,
                "amount": data.amount,
                "description": data.description,
                "balance_after": new_sender_balance,
                "related_account_id": recipient_account_id,
                "created_at": now,
            },
        )
        cursor.execute(
            (
                "INSERT INTO ADMIN.TRANSACTIONS "
                "(ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, "
                "BALANCE_AFTER, RELATED_ACCOUNT_ID, CREATED_AT) "
                "VALUES (:account_id, 'TRANSFER_IN', :amount, :description, "
                ":balance_after, :related_account_id, :created_at)"
            ),
            {
                "account_id": recipient_account_id,
                "amount": data.amount,
                "description": data.description,
                "balance_after": new_recipient_balance,
                "related_account_id": data.sender_account_id,
                "created_at": now,
            },
        )

        conn.commit()

        # SECURE RETURN: Removed 'recipient_new_balance'
        return {
            "success": True,
            "sender_new_balance": new_sender_balance,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("TRANSFER ERROR:", e)
        raise HTTPException(500, f"Internal Server Error: {e}") from None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def transfer_to_external_system(data: Any) -> dict[str, Any]:
    """
    Handles transfers to external banks by communicating with the MCP gateway
    and logging the transaction correctly in the local Oracle database.
    """
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Fetch Local Sender Details
        cursor.execute(
            "SELECT ACCOUNT_NUMBER, BALANCE FROM ADMIN.ACCOUNTS WHERE ACCOUNT_ID = :id FOR UPDATE",
            {"id": data.sender_account_id},
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, "Local sender account not found")

        sender_acct_num, sender_balance = row[0], float(row[1])

        if data.amount > sender_balance:
            raise HTTPException(400, f"Insufficient funds: Balance is {sender_balance}")

        # 2. Call the MCP Gateway
        mcp_url = "http://mcp-gateway:5001/"
        mcp_payload = {
            "recipient_account": data.recipient_account_number,
            "recipient_sort_code": data.recipient_sort_code,
            "amount": float(data.amount),
            "recipient_name": data.recipient_name,
            "reference": data.description or "External Transfer",
            "sender_account": sender_acct_num,
        }

        with httpx.Client() as client:
            response = client.post(mcp_url, json=mcp_payload, timeout=20.0)

            if response.status_code != 200:
                raise HTTPException(502, f"Gateway Error: {response.text}")

            result_json = response.json()
            tool_output = result_json.get("message", "")
            status = result_json.get("status", "")

            if status != "success" and "Success" not in tool_output:
                raise HTTPException(400, f"External Bank Declined: {tool_output}")

        # 3. Success confirmed! Update Local Database
        new_balance = sender_balance - data.amount
        cursor.execute(
            "UPDATE ADMIN.ACCOUNTS SET BALANCE = :new_bal WHERE ACCOUNT_ID = :acc_id",
            {"new_bal": new_balance, "acc_id": data.sender_account_id},
        )

        # 4. Log Transaction using your specific database columns
        # We use 'TRANSFER_OUT' so it shows up correctly in your history
        cursor.execute(
            """
            INSERT INTO ADMIN.TRANSACTIONS 
            (ACCOUNT_ID, AMOUNT, DESCRIPTION, BALANCE_AFTER, TX_TYPE, CREATED_AT) 
            VALUES (:p_id, :p_amt, :p_desc, :p_bal, 'TRANSFER_OUT', CURRENT_TIMESTAMP)
            """,
            {
                "p_id": data.sender_account_id,
                "p_amt": data.amount,
                "p_desc": f"To {data.recipient_name}: {data.description}",
                "p_bal": new_balance,
            },
        )

        conn.commit()
        return {"success": True, "new_balance": new_balance, "message": tool_output}

    except Exception as e:
        if conn:
            conn.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(500, f"Internal System Error: {e!s}") from e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_saved_payees(user_id: int) -> list[dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Fixed E501: Broken string into two lines to stay under 99 chars
        sql = (
            "SELECT PAYEE_ID, NAME, ACCOUNT_NUMBER, SORT_CODE "
            "FROM ADMIN.SAVED_PAYEES WHERE USER_ID = :u_id"
        )

        cursor.execute(sql, {"u_id": user_id})

        # Fix for mypy [union-attr]: check if description is not None
        if cursor.description is not None:
            columns = [col[0].lower() for col in cursor.description]
            # Fixed B905: Added strict=False (standard for DB result mapping)
            payees = [dict(zip(columns, row, strict=False)) for row in cursor.fetchall()]
            return payees

        return []
    except Exception as e:
        print(f"Error fetching payees: {e}")
        return []
    finally:
        cursor.close()
        conn.close()


def add_new_payee(
    user_id: int,
    name: str,
    acct_num: str,
    sort_code: str,
    nickname: str | None = None,
) -> bool:
    sql = """
        INSERT INTO ADMIN.SAVED_PAYEES (USER_ID, NAME, ACCOUNT_NUMBER, SORT_CODE, NICKNAME) 
        VALUES (:v_user_id, :v_name, :v_acc, :v_sort, :v_nick)
    """

    params = {
        "v_user_id": int(user_id),
        "v_name": str(name),
        "v_acc": str(acct_num),
        "v_sort": str(sort_code),
        "v_nick": str(nickname or name),
    }

    try:
        # Using 'with' automatically handles closing even if exceptions occur
        with closing(get_connection()) as conn, closing(conn.cursor()) as cursor:
            cursor.execute(sql, params)
            conn.commit()
            return True
    except Exception as e:
        print(f"DATABASE ERROR: {e!s}")
        # conn.rollback() is often handled by the driver,
        # but you can explicitly call it here if needed.
        raise e


def delete_saved_payee(payee_id: int, user_id: int) -> dict[str, Any]:
    connection = get_connection()
    cursor = connection.cursor()

    try:
        query = """
            DELETE FROM ADMIN.SAVED_PAYEES 
            WHERE PAYEE_ID = :payee_id AND USER_ID = :user_id
        """

        cursor.execute(query, {"payee_id": payee_id, "user_id": user_id})

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Payee not found or unauthorized")

        connection.commit()
        return {"success": True, "message": f"Payee {payee_id} deleted successfully"}

    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except Exception as e:
        connection.rollback()
        print(f"Database Error: {e!s}")
        # Fixed B904: Added 'from e'
        raise HTTPException(status_code=500, detail="Database deletion failed") from e
    finally:
        cursor.close()
        connection.close()

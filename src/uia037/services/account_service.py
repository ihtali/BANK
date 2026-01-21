from typing import Any

from fastapi import HTTPException

from uia037.db import get_connection


def get_user_accounts(user_id: int) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT ACCOUNT_ID, USER_ID, ACCOUNT_NUMBER, ACCOUNT_TYPE, BALANCE, CURRENCY, STATUS
            FROM ADMIN.ACCOUNTS
            WHERE USER_ID = :p_user_id
            """,
            {"p_user_id": user_id},
        )
        rows = cursor.fetchall()
        return {
            "success": True,
            "data": [
                {
                    "account_id": r[0],
                    "user_id": r[1],
                    "account_number": r[2],
                    "account_type": r[3],
                    "balance": float(r[4]),
                    "currency": r[5],
                    "status": r[6],
                }
                for r in rows
            ],
        }
    except Exception as e:
        raise HTTPException(500, f"DB Error: {e}") from e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def check_balance(account_id: int) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT ACCOUNT_ID, BALANCE, CURRENCY
            FROM ADMIN.ACCOUNTS
            WHERE ACCOUNT_ID = :p_account_id
            """,
            {"p_account_id": account_id},
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, "Account not found")
        return {
            "success": True,
            "data": {
                "account_id": row[0],
                "balance": float(row[1]),
                "currency": row[2],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"DB Error: {e}") from e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

from typing import Any

from fastapi import HTTPException
import oracledb

from uia037.db import get_connection
from uia037.models import UserCreate


def login_user(email: str, password: str) -> dict[str, Any]:
    conn = cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT USER_ID, PASSWORD
            FROM ADMIN.USERS
            WHERE EMAIL = :p_email
            """,
            {"p_email": email},
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(401, "Invalid email or password")

        user_id, stored_password = row
        if stored_password != password:
            raise HTTPException(401, "Invalid email or password")

        return {"success": True, "data": {"user_id": int(user_id), "email": email}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Database authentication error: {e}") from e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def register_user(user: UserCreate) -> dict[str, Any]:
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Check if user already exists
        cursor.execute("SELECT 1 FROM ADMIN.USERS WHERE EMAIL = :p_email", {"p_email": user.email})
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User already exists")

        # 2. Insert User and get ID
        new_user_id_var = cursor.var(oracledb.NUMBER)
        cursor.execute(
            """
            INSERT INTO ADMIN.USERS (FULL_NAME, EMAIL, PASSWORD)
            VALUES (:p_fn, :p_em, :p_pw)
            RETURNING USER_ID INTO :p_user_id
            """,
            {
                "p_fn": user.full_name,
                "p_em": user.email,
                "p_pw": user.password,
                "p_user_id": new_user_id_var,
            },
        )
        user_id = int(new_user_id_var.getvalue()[0])

        # 3. Insert Account - LPAD ensures exactly 8 characters
        cursor.execute(
            """
            INSERT INTO ADMIN.ACCOUNTS 
            (USER_ID, ACCOUNT_NUMBER, SORT_CODE, ACCOUNT_TYPE, BALANCE, CURRENCY, STATUS)
            VALUES 
            (:p_uid, LPAD(TO_CHAR(:p_uid), 8, '0'), '112233', 'CHECKING', 0.0, 'GBP', 'ACTIVE')
            """,
            {"p_uid": user_id},
        )

        conn.commit()
        return {"success": True, "data": {"user_id": user_id, "email": user.email}}

    except oracledb.Error as oe:
        if conn:
            conn.rollback()
        print(f"DATABASE ERROR: {oe!s}")
        # Fixed B904: Added 'from oe'
        raise HTTPException(status_code=500, detail=f"DB Error: {oe!s}") from oe
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

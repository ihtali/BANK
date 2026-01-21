# from uia037.db import get_connection
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# import oracledb

# app = FastAPI(
#     title="SecureBank API",
#     version="1.0.0",
#     docs_url="/docs",
#     redoc_url="/redoc",
#     openapi_url="/openapi.json",
# )

# # =========================================================
# # MODELS
# # =========================================================

# class UserCreate(BaseModel):
#     full_name: str
#     email: str
#     password: str

# class LoginRequest(BaseModel):
#     email: str
#     password: str

# class TransactionCreate(BaseModel):
#     amount: float
#     description: str

# class TransferCreate(BaseModel):
#     from_account_id: int
#     to_account_id: int
#     amount: float
#     description: str


# # =========================================================
# # LOGIN
# # =========================================================

# @app.post("/auth/login")
# def login_user(data: LoginRequest):
#     conn = cursor = None
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute(
#             """
#             SELECT USER_ID, PASSWORD
#             FROM ADMIN.USERS
#             WHERE EMAIL = :p_email
#             """,
#             {"p_email": data.email},
#         )

#         row = cursor.fetchone()
#         if not row:
#             raise HTTPException(401, "Invalid email or password")

#         user_id, stored_password = row

#         if stored_password != data.password:
#             raise HTTPException(401, "Invalid email or password")

#         return {
#             "success": True,
#             "data": {
#                 "user_id": int(user_id),
#                 "email": data.email,
#             },
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(500, f"DB Error: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# # =========================================================
# # REGISTER
# # =========================================================

# @app.post("/auth/register")
# def register(user: UserCreate):
#     conn = cursor = None
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute(
#             "SELECT USER_ID FROM ADMIN.USERS WHERE EMAIL = :p_email",
#             {"p_email": user.email},
#         )
#         if cursor.fetchone():
#             raise HTTPException(400, "Email already registered")

#         new_user_id = cursor.var(oracledb.NUMBER)

#         cursor.execute(
#             """
#             INSERT INTO ADMIN.USERS (FULL_NAME, EMAIL, PASSWORD)
#             VALUES (:p_fn, :p_em, :p_pw)
#             RETURNING USER_ID INTO :p_user_id
#             """,
#             {
#                 "p_fn": user.full_name,
#                 "p_em": user.email,
#                 "p_pw": user.password,
#                 "p_user_id": new_user_id,
#             },
#         )

#         user_id = int(new_user_id.getvalue()[0])
#         account_number = f"AUTO{user_id:06d}"

#         cursor.execute(
#             """
#             INSERT INTO ADMIN.ACCOUNTS
#             (USER_ID, ACCOUNT_NUMBER, ACCOUNT_TYPE, BALANCE, CURRENCY, STATUS, CREATED_AT)
#             VALUES
#             (:p_user_id, :p_acnum, 'CHECKING', 0, 'GBP', 'ACTIVE', CURRENT_TIMESTAMP)
#             """,
#             {"p_user_id": user_id, "p_acnum": account_number},
#         )

#         conn.commit()

#         return {
#             "success": True,
#             "user_id": user_id,
#             "account_number": account_number,
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(500, f"DB Error: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# # =========================================================
# # GET USER ACCOUNTS  ✅ FIXED (NO ORA-01745)
# # =========================================================

# @app.get("/bank/users/{user_id}/accounts")
# def get_user_accounts(user_id: int):
#     conn = cursor = None
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute(
#             """
#             SELECT ACCOUNT_ID,
#                    USER_ID,
#                    ACCOUNT_NUMBER,
#                    ACCOUNT_TYPE,
#                    BALANCE,
#                    CURRENCY,
#                    STATUS
#             FROM ADMIN.ACCOUNTS
#             WHERE USER_ID = :p_user_id
#             """,
#             {"p_user_id": user_id},
#         )

#         rows = cursor.fetchall()

#         return {
#             "success": True,
#             "data": [
#                 {
#                     "account_id": r[0],
#                     "user_id": r[1],
#                     "account_number": r[2],
#                     "account_type": r[3],
#                     "balance": float(r[4]),
#                     "currency": r[5],
#                     "status": r[6],
#                 }
#                 for r in rows
#             ],
#         }

#     except Exception as e:
#         raise HTTPException(500, f"DB Error: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# # =========================================================
# # BALANCE
# # =========================================================

# @app.get("/bank/accounts/{account_id}/balance")
# def check_balance(account_id: int):
#     conn = cursor = None
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute(
#             """
#             SELECT ACCOUNT_ID, BALANCE, CURRENCY
#             FROM ADMIN.ACCOUNTS
#             WHERE ACCOUNT_ID = :p_account_id
#             """,
#             {"p_account_id": account_id},
#         )

#         row = cursor.fetchone()
#         if not row:
#             raise HTTPException(404, "Account not found")

#         return {
#             "success": True,
#             "data": {
#                 "account_id": row[0],
#                 "balance": float(row[1]),
#                 "currency": row[2],
#             },
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(500, f"DB Error: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# # =========================================================
# # DEPOSIT
# # =========================================================

# @app.post("/bank/accounts/{account_id}/deposit")
# def deposit(account_id: int, data: TransactionCreate):
#     conn = cursor = None
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute(
#             "SELECT BALANCE FROM ADMIN.ACCOUNTS WHERE ACCOUNT_ID = :p_account_id",
#             {"p_account_id": account_id},
#         )

#         row = cursor.fetchone()
#         if not row:
#             raise HTTPException(404, "Account not found")

#         new_balance = float(row[0]) + data.amount

#         cursor.execute(
#             "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_account_id",
#             {"p_bal": new_balance, "p_account_id": account_id},
#         )

#         cursor.execute(
#             """
#             INSERT INTO ADMIN.TRANSACTIONS
#             (ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER)
#             VALUES (:p_account_id, 'DEPOSIT', :p_amt, :p_desc, :p_bal)
#             """,
#             {
#                 "p_account_id": account_id,
#                 "p_amt": data.amount,
#                 "p_desc": data.description,
#                 "p_bal": new_balance,
#             },
#         )

#         conn.commit()

#         return {"success": True, "new_balance": new_balance}

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(500, f"DB Error: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# # =========================================================
# # WITHDRAW
# # =========================================================

# @app.post("/bank/accounts/{account_id}/withdraw")
# def withdraw(account_id: int, data: TransactionCreate):
#     conn = cursor = None
#     try:
#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute(
#             "SELECT BALANCE FROM ADMIN.ACCOUNTS WHERE ACCOUNT_ID = :p_account_id",
#             {"p_account_id": account_id},
#         )

#         row = cursor.fetchone()
#         if not row:
#             raise HTTPException(404, "Account not found")

#         bal = float(row[0])
#         if data.amount > bal:
#             raise HTTPException(400, "Insufficient funds")

#         new_balance = bal - data.amount

#         cursor.execute(
#             "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_account_id",
#             {"p_bal": new_balance, "p_account_id": account_id},
#         )

#         cursor.execute(
#             """
#             INSERT INTO ADMIN.TRANSACTIONS
#             (ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER)
#             VALUES (:p_account_id, 'WITHDRAWAL', :p_amt, :p_desc, :p_bal)
#             """,
#             {
#                 "p_account_id": account_id,
#                 "p_amt": data.amount,
#                 "p_desc": data.description,
#                 "p_bal": new_balance,
#             },
#         )

#         conn.commit()

#         return {"success": True, "new_balance": new_balance}

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(500, f"DB Error: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()


# # =========================================================
# # TRANSFER
# # =========================================================

# @app.post("/bank/accounts/transfer")
# def transfer_money(data: TransferCreate):
#     conn = cursor = None
#     try:
#         if data.from_account_id == data.to_account_id:
#             raise HTTPException(400, "Cannot transfer to same account")

#         conn = get_connection()
#         cursor = conn.cursor()

#         cursor.execute(
#             """
#             SELECT ACCOUNT_ID, BALANCE
#             FROM ADMIN.ACCOUNTS
#             WHERE ACCOUNT_ID IN (:p_from, :p_to)
#             FOR UPDATE
#             """,
#             {
#                 "p_from": data.from_account_id,
#                 "p_to": data.to_account_id,
#             },
#         )

#         rows = cursor.fetchall()
#         if len(rows) != 2:
#             raise HTTPException(404, "One or both accounts not found")

#         balances = {r[0]: float(r[1]) for r in rows}

#         if data.amount > balances[data.from_account_id]:
#             raise HTTPException(400, "Insufficient funds")

#         new_from = balances[data.from_account_id] - data.amount
#         new_to = balances[data.to_account_id] + data.amount

#         cursor.execute(
#             "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_id",
#             {"p_bal": new_from, "p_id": data.from_account_id},
#         )
#         cursor.execute(
#             "UPDATE ADMIN.ACCOUNTS SET BALANCE = :p_bal WHERE ACCOUNT_ID = :p_id",
#             {"p_bal": new_to, "p_id": data.to_account_id},
#         )

#         cursor.execute(
#             """
#             INSERT INTO ADMIN.TRANSACTIONS
#             (ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER, RELATED_ACCOUNT_ID)
#             VALUES (:p_id, 'TRANSFER_OUT', :p_amt, :p_desc, :p_bal, :p_rel)
#             """,
#             {
#                 "p_id": data.from_account_id,
#                 "p_amt": data.amount,
#                 "p_desc": data.description,
#                 "p_bal": new_from,
#                 "p_rel": data.to_account_id,
#             },
#         )

#         cursor.execute(
#             """
#             INSERT INTO ADMIN.TRANSACTIONS
#             (ACCOUNT_ID, TX_TYPE, AMOUNT, DESCRIPTION, BALANCE_AFTER, RELATED_ACCOUNT_ID)
#             VALUES (:p_id, 'TRANSFER_IN', :p_amt, :p_desc, :p_bal, :p_rel)
#             """,
#             {
#                 "p_id": data.to_account_id,
#                 "p_amt": data.amount,
#                 "p_desc": data.description,
#                 "p_bal": new_to,
#                 "p_rel": data.from_account_id,
#             },
#         )

#         conn.commit()

#         return {
#             "success": True,
#             "from_new_balance": new_from,
#             "to_new_balance": new_to,
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(500, f"DB Error: {e}")
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()

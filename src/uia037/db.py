from fastapi import HTTPException
import oracledb


def get_connection() -> oracledb.Connection:
    try:
        conn = oracledb.connect(
            user="ADMIN",
            password="Openconsulting@37data",
            dsn="uia037_high",
            config_dir="/opt/oracle/wallet",
        )
        return conn
    except Exception as e:
        raise HTTPException(500, f"DB connection failed: {e!s}") from e


WALLET_PATH = "/opt/oracle/wallet"

DB_USER = "ADMIN"
DB_PASSWORD = "Openconsulting@37data"
WALLET_PASSWORD = "Openconsulting@37data"

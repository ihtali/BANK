from unittest.mock import MagicMock, patch

from fastapi import HTTPException
import pytest

from uia037.db import get_connection


def test_db_connection_success() -> None:
    """Tests that a successful connection returns a connection object."""
    with patch("oracledb.connect") as mock_connect:
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        conn = get_connection()
        assert conn == mock_conn
        mock_connect.assert_called_once()


def test_db_connection_exception() -> None:
    """Tests the error handling when the database is unreachable."""
    with patch("oracledb.connect", side_effect=Exception("Database Offline")):
        with pytest.raises(HTTPException) as exc:
            get_connection()
        assert exc.value.status_code == 500
        assert "DB connection failed" in exc.value.detail

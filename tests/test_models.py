from pydantic import ValidationError
import pytest

from uia037.models import TransactionCreate, TransferCreate, UserCreate


def test_models_validation() -> None:
    # Valid
    user = UserCreate(full_name="Test", email="t@t.com", password="pw")
    assert user.full_name == "Test"

    # Invalid Transaction (missing description)
    with pytest.raises(ValidationError):
        TransactionCreate(amount=10.0)  # type: ignore[call-arg]

    # Valid Transfer
    transfer = TransferCreate(from_account_id=1, to_account_id=2, amount=5.0, description="test")
    assert transfer.amount == 5.0

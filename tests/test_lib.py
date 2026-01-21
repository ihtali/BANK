import pytest

from uia037.lib import InvalidFactorialError, factorial


def test_factorial_zero() -> None:
    assert factorial(0) == 1


def test_factorial_positive() -> None:
    assert factorial(5) == 120
    assert factorial(3) == 6
    assert factorial(1) == 1


def test_factorial_large() -> None:
    assert factorial(7) == 5040


def test_factorial_invalid_negative() -> None:
    with pytest.raises(InvalidFactorialError) as exc_info:
        factorial(-1)

    assert "less than zero" in str(exc_info.value)

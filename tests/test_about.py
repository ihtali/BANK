from uia037.__about__ import __version__


def test_about_version_exists() -> None:
    # Must not be empty or None
    assert isinstance(__version__, str)
    assert len(__version__) > 0

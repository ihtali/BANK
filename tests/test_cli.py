from uia037 import cli


def test_cli_main_runs() -> None:
    # The main function should exist and be callable
    assert callable(cli.main)

    # Run it — it should not raise any exception
    cli.main()

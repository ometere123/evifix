from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
README = (ROOT / "README.md").read_text()
CLIENT = (ROOT / "frontend" / "src" / "lib" / "client.ts").read_text()


def test_readme_network_lock_matches_client_guard():
    """README's advertised network lock must match the values client.ts actually enforces.

    This catches doc drift: if client.ts is ever repointed to a different
    chain/RPC/explorer without updating README's "Network lock" section (or
    vice versa), this test fails instead of silently shipping a misleading doc.
    """
    for value in ("61999", "0xF22F", "https://studio.genlayer.com/api", "https://explorer-studio.genlayer.com"):
        assert value in README, f"README network lock section is missing {value!r}"
        assert value in CLIENT, f"client.ts no longer enforces {value!r} advertised by README"

"""Document the finalized outcome boundary for patch evidence."""

from pathlib import Path


def test_live_evidence_documentation_mentions_finalized_gate() -> None:
    architecture = Path(__file__).parents[2] / "docs" / "ARCHITECTURE.md"
    text = architecture.read_text(encoding="utf-8")
    assert "finalized" in text.lower()
    assert "evidence" in text.lower()


def test_escrow_source_keeps_gate_as_authority() -> None:
    source = (Path(__file__).parents[2] / "contracts" / "evifix_escrow.py").read_text(encoding="utf-8")
    assert "GATE_VERIFIED" in source
    assert "summary.get(\"status\")" in source

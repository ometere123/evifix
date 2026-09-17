"""Regression coverage for deterministic escrow conservation.

The escrow must never report more released and refunded value than it has
received. This is intentionally a source-level invariant test because the
economic state is finalized on-chain and cannot be reconstructed from a
frontend receipt.
"""

from pathlib import Path


ESCROW = Path(__file__).parents[2] / "contracts" / "evifix_escrow.py"


def test_escrow_tracks_funded_released_and_refunded_totals() -> None:
    source = ESCROW.read_text(encoding="utf-8")
    assert "self.total_funded += gl.message.value" in source
    assert "self.total_released += amount" in source
    assert "self.total_refunded += amount" in source
    assert '"total_unsettled": self.total_funded - self.total_released - self.total_refunded' in source


def test_escrow_pays_only_after_terminal_gate_state() -> None:
    source = ESCROW.read_text(encoding="utf-8")
    release = source.split("def release_patch", 1)[1].split("def refund_patch", 1)[0]
    assert 'summary.get("status") == GATE_VERIFIED' in release
    assert "self._pay(escrow.beneficiary, amount)" in release

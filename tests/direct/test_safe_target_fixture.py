from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SAFE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_safe.py").read_text()


def test_safe_fixture_keeps_gate_only_upgrade_boundary():
    assert "if gl.message.sender_address != self.evifix_gate" in SAFE
    assert "owner_replace_code" not in SAFE
    assert "hashlib.sha256(candidate_code).hexdigest()" in SAFE


def test_safe_fixture_exposes_generation_readback():
    assert "def get_baseline_generation" in SAFE
    assert "return self.baseline_generation" in SAFE

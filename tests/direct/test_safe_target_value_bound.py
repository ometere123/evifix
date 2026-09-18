from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SAFE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_safe.py").read_text()


def test_protected_value_is_bounded_before_storage():
    assert "MAX_PROTECTED_VALUE_BYTES = 256" in SAFE
    assert 'value.encode("utf-8")' in SAFE
    assert 'protected value is too large' in SAFE


def test_patch_boundary_remains_gate_only():
    assert "if gl.message.sender_address != self.evifix_gate" in SAFE
    assert "hashlib.sha256(candidate_code).hexdigest()" in SAFE

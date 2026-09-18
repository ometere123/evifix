from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SAFE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_safe.py").read_text()

def test_fresh_live_proof_preserves_the_bounded_value_guard():
    assert "MAX_PROTECTED_VALUE_BYTES = 256" in SAFE
    assert 'raise gl.vm.UserError("protected value is too large")' in SAFE
    assert "actual_hash = hashlib.sha256(candidate_code).hexdigest()" in SAFE

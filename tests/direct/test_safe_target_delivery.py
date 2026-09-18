from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SAFE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_safe.py").read_text()


def test_safe_fixture_rejects_oversized_protected_values():
    assert "MAX_PROTECTED_VALUE_BYTES = 256" in SAFE
    assert 'raise gl.vm.UserError("protected value is too large")' in SAFE


def test_safe_fixture_keeps_immutable_candidate_delivery():
    assert "actual_hash = hashlib.sha256(candidate_code).hexdigest()" in SAFE
    assert "code.truncate()" in SAFE
    assert "code.extend(candidate_code)" in SAFE

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SAFE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_safe.py").read_text()


def test_safe_fixture_declares_the_exact_boundary():
    assert "MAX_PROTECTED_VALUE_BYTES = 256" in SAFE
    assert "if len(value.encode("utf-8")) > MAX_PROTECTED_VALUE_BYTES" in SAFE


def test_safe_fixture_preserves_byte_integrity_check():
    assert "actual_hash = hashlib.sha256(candidate_code).hexdigest()" in SAFE
    assert "Delivered candidate bytes do not match" in SAFE

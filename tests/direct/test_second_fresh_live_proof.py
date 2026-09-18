def test_second_fresh_live_proof_keeps_the_hash_guard():
    from pathlib import Path

    safe = Path(__file__).resolve().parents[2] / "contracts" / "fixtures" / "evifix_target_v2_safe.py"
    source = safe.read_text()
    assert "actual_hash = hashlib.sha256(candidate_code).hexdigest()" in source
    assert "MAX_PROTECTED_VALUE_BYTES = 256" in source

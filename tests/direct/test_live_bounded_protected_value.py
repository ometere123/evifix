from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_safe.py").read_text()

def test_protected_value_input_is_bounded_and_normalized():
    assert "normalized = value.strip()" in SOURCE
    assert "if len(normalized) > 256:" in SOURCE
    assert "Protected value exceeds the bounded limit" in SOURCE
    assert "self.protected_value = normalized" in SOURCE

def test_patch_path_preserves_gate_and_hash_verification():
    assert "Only EviFix may deliver a patch receipt" in SOURCE
    assert "Delivered candidate bytes do not match the receipt candidate hash" in SOURCE

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE = (ROOT / "contracts" / "evifix_gate.py").read_text()
TARGET = (ROOT / "contracts" / "evifix_target_v1.py").read_text()
UNSAFE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_unsafe.py").read_text()


def test_gate_has_no_self_upgrade_authority():
    assert "root.upgraders" not in GATE
    assert "apply_evifix_patch" in GATE


def test_target_uses_receipt_protocol_not_candidate_pull_protocol():
    assert "verify_patch_receipt" in TARGET
    assert "apply_evifix_patch" in TARGET
    assert "record_activation" in GATE


def test_target_rehashes_exact_delivered_candidate_before_replace():
    assert "hashlib.sha256(candidate_code).hexdigest()" in TARGET
    assert "code.truncate()" in TARGET
    assert "code.extend(candidate_code)" in TARGET


def test_baseline_continuity_is_persisted_target_side():
    for token in ("baseline_hash", "last_receipt_hash", "last_capsule_id", "baseline_generation"):
        assert token in TARGET


def test_gate_contains_declared_observed_scope_and_evidence_epoch_controls():
    for token in (
        "UNDECLARED_SEMANTIC_CHANGE_",
        "FORBIDDEN_SEMANTIC_CHANGE_",
        "EVIDENCE_EPOCH_UNCHANGED",
        "submit_evidence_epoch",
        "PatchReceipt",
        "InvariantProfile",
        "PatchCapsule",
    ):
        assert token in GATE


def test_unsafe_fixture_contains_real_bypass_patterns():
    assert "owner_replace_code" in UNSAFE
    assert "code.extend(candidate_code)" in UNSAFE
    assert "unrestricted_value_change" in UNSAFE

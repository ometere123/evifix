from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE = (ROOT / "contracts" / "evifix_gate.py").read_text()
TARGET = (ROOT / "contracts" / "evifix_target_v1.py").read_text()
UNSAFE = (ROOT / "contracts" / "fixtures" / "evifix_target_v2_unsafe.py").read_text()


def test_gate_has_no_self_upgrade_authority():
    assert "root.upgraders" not in GATE
    assert "code.extend" not in GATE


def test_target_assigns_only_gate_as_upgrader():
    assert "root.upgraders.get().append(evifix_gate)" in TARGET
    assert "append(self.owner)" not in TARGET


def test_target_rehashes_candidate_before_install():
    assert "hashlib.sha256(candidate_code).hexdigest()" in TARGET
    assert "is_upgrade_authorized" in TARGET
    assert 'emit(on="finalized").confirm_install' in TARGET


def test_unsafe_fixture_contains_bypass_for_adversarial_review():
    assert "owner_replace_code" in UNSAFE
    assert "code.extend(replacement)" in UNSAFE

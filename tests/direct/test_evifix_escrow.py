import json
import sys

import pytest


def _address(value) -> str:
    if isinstance(value, (bytes, bytearray)):
        return "0x" + bytes(value).hex()
    return str(value)


GATE_ADDRESS = "0x" + "11" * 20


def _deploy_escrow(direct_deploy, target, opener, status="READY", expires_at=2_000_000_000):
    """Deploy one contract per test and replace the cross-call with a deterministic stub.

    GenVM Direct Mode permits one Contract subclass per process.  A deployed
    mock gate plus the escrow therefore collides with the runner's global
    contract registration.  Patching the escrow module's interface preserves
    the production call boundary without adding a second contract class.
    """
    escrow = direct_deploy("contracts/evifix_escrow.py")
    summary = {
        "capsule_id": 1,
        "target": _address(target),
        "opener": _address(opener),
        "status": status,
        "expires_at": expires_at,
    }

    class GateCallStub:
        def __init__(self, _address):
            pass

        def view(self):
            return self

        def get_capsule_summary(self, _capsule_id):
            return json.dumps(summary, separators=(",", ":"))

    module = sys.modules["_contract_evifix_escrow"]
    module.EviFixGate = GateCallStub
    return escrow, summary


def _set_contract_time(timestamp):
    """Update the raw message timestamp used by the escrow's clock helper."""
    sys.modules["genlayer.gl"].message_raw["datetime"] = timestamp


def test_funding_binds_capsule_opener_and_exact_value(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    escrow, _ = _deploy_escrow(direct_deploy, direct_charlie, direct_bob)
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15

    escrow_id = escrow.fund_patch(
        GATE_ADDRESS,
        1,
        _address(direct_bob),
        2_000_000_300,
    )
    stored = escrow.get_escrow(escrow_id)
    assert str(stored.sponsor).lower() == _address(direct_alice).lower()
    assert str(stored.beneficiary).lower() == _address(direct_bob).lower()
    assert stored.amount == 10**15
    assert escrow.get_escrow_for_capsule(GATE_ADDRESS, 1) == escrow_id


def test_funding_rejects_wrong_beneficiary_and_duplicate_capsule(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    escrow, _ = _deploy_escrow(direct_deploy, direct_charlie, direct_bob)
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    with pytest.raises(AssertionError, match="beneficiary must be the capsule opener"):
        escrow.fund_patch(GATE_ADDRESS, 1, _address(direct_charlie), 2_000_000_300)

    escrow_id = escrow.fund_patch(GATE_ADDRESS, 1, _address(direct_bob), 2_000_000_300)
    assert escrow_id == 1
    with pytest.raises(AssertionError, match="capsule already has escrow"):
        escrow.fund_patch(GATE_ADDRESS, 1, _address(direct_bob), 2_000_000_300)


def test_release_requires_verified_status_and_beneficiary(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    escrow, _ = _deploy_escrow(direct_deploy, direct_charlie, direct_bob, status="READY")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    escrow_id = escrow.fund_patch(GATE_ADDRESS, 1, _address(direct_bob), 2_000_000_300)

    direct_vm.warp("2033-05-18T03:38:30Z")
    direct_vm.sender = direct_bob
    _set_contract_time("2033-05-18T03:38:30Z")
    with pytest.raises(AssertionError, match="patch is not finalized as verified"):
        escrow.release_patch(escrow_id)

    direct_vm.sender = direct_charlie
    with pytest.raises(AssertionError, match="only beneficiary can claim escrow"):
        escrow.release_patch(escrow_id)


def test_release_and_refund_are_terminal_and_accounted(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    escrow, summary = _deploy_escrow(direct_deploy, direct_charlie, direct_bob, status="READY")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    escrow_id = escrow.fund_patch(GATE_ADDRESS, 1, _address(direct_bob), 2_000_000_300)

    summary["status"] = "VERIFIED"
    direct_vm.warp("2033-05-18T03:38:30Z")
    direct_vm.sender = direct_bob
    _set_contract_time("2033-05-18T03:38:30Z")
    escrow.release_patch(escrow_id)
    stored = escrow.get_escrow(escrow_id)
    assert stored.status == "RELEASED"
    assert stored.released_amount == 10**15
    accounting = escrow.get_accounting()
    assert accounting["total_funded"] == 10**15
    assert accounting["total_released"] == 10**15
    assert accounting["total_refunded"] == 0
    assert accounting["total_unsettled"] == 0
    with pytest.raises(AssertionError, match="escrow is already settled"):
        escrow.release_patch(escrow_id)


def test_terminal_failure_refunds_sponsor(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    escrow, summary = _deploy_escrow(direct_deploy, direct_charlie, direct_bob, status="READY")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    escrow_id = escrow.fund_patch(GATE_ADDRESS, 1, _address(direct_bob), 2_000_000_300)
    summary["status"] = "REJECTED"
    escrow.refund_patch(escrow_id)
    stored = escrow.get_escrow(escrow_id)
    assert stored.status == "REFUNDED"
    assert stored.refunded_amount == 10**15
    assert json.loads(json.dumps(escrow.get_accounting(), default=int))["total_unsettled"] == 0

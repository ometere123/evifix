import json


def _address(value) -> str:
    if isinstance(value, (bytes, bytearray)):
        return "0x" + bytes(value).hex()
    return str(value)


def _deploy_stub(direct_deploy, target, opener, status="READY", expires_at=2_000_000_000):
    return direct_deploy(
        "contracts/fixtures/evifix_gate_escrow_stub.py",
        _address(target),
        _address(opener),
        status,
        expires_at,
    )


def test_funding_binds_capsule_opener_and_exact_value(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    stub = _deploy_stub(direct_deploy, direct_charlie, direct_bob)
    escrow = direct_deploy("contracts/evifix_escrow.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15

    escrow_id = escrow.fund_patch(
        _address(stub.address),
        1,
        _address(direct_bob),
        2_000_000_300,
    )
    stored = escrow.get_escrow(escrow_id)
    assert stored.sponsor == direct_alice
    assert stored.beneficiary == direct_bob
    assert stored.amount == 10**15
    assert escrow.get_escrow_for_capsule(_address(stub.address), 1) == escrow_id


def test_funding_rejects_wrong_beneficiary_and_duplicate_capsule(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    stub = _deploy_stub(direct_deploy, direct_charlie, direct_bob)
    escrow = direct_deploy("contracts/evifix_escrow.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    with direct_vm.expect_revert("beneficiary must be the capsule opener"):
        escrow.fund_patch(_address(stub.address), 1, _address(direct_charlie), 2_000_000_300)

    escrow_id = escrow.fund_patch(_address(stub.address), 1, _address(direct_bob), 2_000_000_300)
    assert escrow_id == 1
    with direct_vm.expect_revert("capsule already has escrow"):
        escrow.fund_patch(_address(stub.address), 1, _address(direct_bob), 2_000_000_300)


def test_release_requires_verified_status_and_beneficiary(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    stub = _deploy_stub(direct_deploy, direct_charlie, direct_bob, status="READY")
    escrow = direct_deploy("contracts/evifix_escrow.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    escrow_id = escrow.fund_patch(_address(stub.address), 1, _address(direct_bob), 2_000_000_300)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("patch is not finalized as verified"):
        escrow.release_patch(escrow_id)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("only beneficiary can claim escrow"):
        escrow.release_patch(escrow_id)


def test_release_and_refund_are_terminal_and_accounted(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    stub = _deploy_stub(direct_deploy, direct_charlie, direct_bob, status="VERIFIED")
    escrow = direct_deploy("contracts/evifix_escrow.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    escrow_id = escrow.fund_patch(_address(stub.address), 1, _address(direct_bob), 2_000_000_300)

    direct_vm.warp("2033-05-18T03:33:30Z")
    direct_vm.sender = direct_bob
    escrow.release_patch(escrow_id)
    stored = escrow.get_escrow(escrow_id)
    assert stored.status == "RELEASED"
    assert stored.released_amount == 10**15
    accounting = escrow.get_accounting()
    assert accounting["total_funded"] == 10**15
    assert accounting["total_released"] == 10**15
    assert accounting["total_refunded"] == 0
    assert accounting["total_unsettled"] == 0
    with direct_vm.expect_revert("escrow is already settled"):
        escrow.release_patch(escrow_id)


def test_terminal_failure_refunds_sponsor(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    stub = _deploy_stub(direct_deploy, direct_charlie, direct_bob, status="REJECTED")
    escrow = direct_deploy("contracts/evifix_escrow.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10**15
    escrow_id = escrow.fund_patch(_address(stub.address), 1, _address(direct_bob), 2_000_000_300)
    escrow.refund_patch(escrow_id)
    stored = escrow.get_escrow(escrow_id)
    assert stored.status == "REFUNDED"
    assert stored.refunded_amount == 10**15
    assert json.loads(json.dumps(escrow.get_accounting(), default=int))["total_unsettled"] == 0

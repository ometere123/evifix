import hashlib
import json
import re
import time

CONSTITUTION = """
EviFix Security Constitution v1
1. Preserve persistent storage compatibility across every code replacement.
2. Do not introduce a new owner, admin, or external path that can bypass the evidence gate.
3. Preserve existing user rights and value-movement restrictions.
4. Keep EviFix as the sole code-upgrade authority for the protected target.
5. Bind every release to exact candidate bytes, immutable source, fresh CI evidence, and independent audit evidence.
6. Treat semantic uncertainty as inconclusive, never as authorization.
7. Execute irreversible upgrade consequences only after GenLayer finality.
8. Keep bounded expiry, retry, evidence repair, reconciliation, and timeout paths.
""".strip()

SOURCE_PREFIX = "https://raw.githubusercontent.com/evifix-labs/protected-app/"
CI_PREFIX = "https://raw.githubusercontent.com/evifix-labs/protected-app-ci/"
AUDIT_PREFIX = "https://raw.githubusercontent.com/independent-audit-labs/evifix-audits/"
SOURCE_AUTHORITY = "evifix-labs/protected-app"
CI_AUTHORITY = "evifix-labs/protected-app-ci"
AUDIT_AUTHORITY = "independent-audit-labs/evifix-audits"

PARENT_COMMIT = "a" * 40
CANDIDATE_COMMIT = "b" * 40
CI_COMMIT = "c" * 40
AUDIT_COMMIT = "d" * 40
REPAIR_CI_COMMIT = "e" * 40
REPAIR_AUDIT_COMMIT = "f" * 40

PARENT_URL = SOURCE_PREFIX + PARENT_COMMIT + "/contracts/target_v1.py"
CANDIDATE_URL = SOURCE_PREFIX + CANDIDATE_COMMIT + "/contracts/target_v2.py"
CI_URL = CI_PREFIX + CI_COMMIT + "/evidence/ci.json"
AUDIT_URL = AUDIT_PREFIX + AUDIT_COMMIT + "/evidence/audit.json"
REPAIR_CI_URL = CI_PREFIX + REPAIR_CI_COMMIT + "/evidence/ci.json"
REPAIR_AUDIT_URL = AUDIT_PREFIX + REPAIR_AUDIT_COMMIT + "/evidence/audit.json"

PARENT_BYTES = b"class TargetV1:\n    pass\n"
CANDIDATE_BYTES = b"class TargetV2:\n    pass\n"
PARENT_HASH = hashlib.sha256(PARENT_BYTES).hexdigest()
CANDIDATE_HASH = hashlib.sha256(CANDIDATE_BYTES).hexdigest()


def _address_arg(value) -> str:
    if isinstance(value, (bytes, bytearray)):
        raw = bytes(value)
        if len(raw) != 20:
            raise AssertionError(f"Direct Mode address must be 20 bytes, got {len(raw)}")
        return "0x" + raw.hex()
    return str(value)


def _register(gate, direct_vm, target, owner):
    direct_vm.sender = target
    gate.register_target(
        _address_arg(owner),
        CONSTITUTION,
        SOURCE_AUTHORITY,
        CI_AUTHORITY,
        AUDIT_AUTHORITY,
        SOURCE_PREFIX,
        CI_PREFIX,
        AUDIT_PREFIX,
        "1.0.0",
        PARENT_URL,
        PARENT_HASH,
        24 * 60 * 60,
        2 * 24 * 60 * 60,
        24 * 60 * 60,
    )


def _create(gate, direct_vm, target, owner, ci_id="ci-run-0001", audit_id="audit-run-0001"):
    direct_vm.sender = owner
    return gate.create_proposal(
        _address_arg(target),
        "2.0.0",
        CANDIDATE_URL,
        CANDIDATE_BYTES,
        CI_URL,
        ci_id,
        AUDIT_URL,
        audit_id,
    )


def _semantic(value="PASS"):
    return {
        "storage_layout": value,
        "authorization_surface": value,
        "user_rights": value,
        "upgrade_authority": value,
        "external_call_safety": value,
        "value_flow": value,
        "evidence_integrity": value,
        "consensus_semantics": value,
        "finality_safety": value,
        "liveness_recovery": value,
        "change_scope": value,
        "constitution": value,
    }


def _evidence(gate, target, proposal_id, ci_id="ci-run-0001", audit_id="audit-run-0001", now=None):
    now = int(time.time()) if now is None else now
    summary = json.loads(gate.get_proposal_summary(proposal_id))
    common = {
        "schema": "evifix-evidence-v1",
        "target": _address_arg(target),
        "parent_sha256": summary["parent_code_hash"],
        "candidate_sha256": summary["candidate_code_hash"],
        "policy_fingerprint": summary["policy_fingerprint"],
        "candidate_version": summary["candidate_version"],
        "source_commit": CANDIDATE_COMMIT,
        "published_at": now - 30,
        "expires_at": now + 3600,
    }
    ci = {
        **common,
        "kind": "ci",
        "evidence_id": ci_id,
        "issuer": CI_AUTHORITY,
        "checks": {
            "genvm_lint": True,
            "typecheck": True,
            "schema": True,
            "direct_tests": True,
            "adversarial_tests": True,
            "interface_tests": True,
            "frontend_build": True,
        },
        "test_count": 42,
        "toolchain_digest": "f" * 64,
    }
    audit = {
        **common,
        "kind": "audit",
        "evidence_id": audit_id,
        "issuer": AUDIT_AUTHORITY,
        "verdict": "PASS",
        "independent_review": True,
        "findings_open": 0,
    }
    return ci, audit


def _mock_review(direct_vm, gate, target, proposal_id, semantic_value="PASS"):
    ci, audit = _evidence(gate, target, proposal_id)
    direct_vm.mock_web(re.escape(PARENT_URL), {"status": 200, "body": PARENT_BYTES.decode()})
    direct_vm.mock_web(re.escape(CANDIDATE_URL), {"status": 200, "body": CANDIDATE_BYTES.decode()})
    direct_vm.mock_web(re.escape(CI_URL), {"status": 200, "body": json.dumps(ci)})
    direct_vm.mock_web(re.escape(AUDIT_URL), {"status": 200, "body": json.dumps(audit)})
    direct_vm.mock_llm(r"EVIFIX_SEMANTIC_REVIEW_V1", json.dumps(_semantic(semantic_value)))


def test_registration_requires_independent_audit_publisher(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Independent audit publisher must differ from source publisher"):
        gate.register_target(
            _address_arg(direct_alice), CONSTITUTION,
            SOURCE_AUTHORITY, CI_AUTHORITY, "evifix-labs/audits",
            SOURCE_PREFIX, CI_PREFIX, "https://raw.githubusercontent.com/evifix-labs/audits/",
            "1.0.0", PARENT_URL, PARENT_HASH,
            3600, 3600, 3600,
        )


def test_mutable_branch_candidate_is_rejected(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _register(gate, direct_vm, direct_bob, direct_alice)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Candidate source URL is not an approved immutable source"):
        gate.create_proposal(
            _address_arg(direct_bob), "2.0.0",
            SOURCE_PREFIX + "main/contracts/target_v2.py",
            CANDIDATE_BYTES, CI_URL, "ci-main-0001", AUDIT_URL, "audit-main-0001",
        )


def test_candidate_bytes_are_frozen_and_hash_bound(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _register(gate, direct_vm, direct_bob, direct_alice)
    proposal_id = _create(gate, direct_vm, direct_bob, direct_alice)
    assert gate.get_candidate_hash(proposal_id) == CANDIDATE_HASH
    summary = json.loads(gate.get_proposal_summary(proposal_id))
    assert summary["candidate_code_hash"] == CANDIDATE_HASH
    assert summary["status"] == "PROPOSED"


def test_tampered_candidate_source_requires_evidence_repair(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _register(gate, direct_vm, direct_bob, direct_alice)
    proposal_id = _create(gate, direct_vm, direct_bob, direct_alice)
    direct_vm.mock_web(re.escape(PARENT_URL), {"status": 200, "body": PARENT_BYTES.decode()})
    direct_vm.mock_web(re.escape(CANDIDATE_URL), {"status": 200, "body": "tampered"})
    gate.review_proposal(proposal_id)
    summary = json.loads(gate.get_proposal_summary(proposal_id))
    assert summary["status"] == "EVIDENCE_REPAIR_REQUIRED"
    assert summary["last_review_code"] == "CANDIDATE_SOURCE_HASH_MISMATCH"


def test_inconclusive_is_first_class_and_cannot_authorize(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _register(gate, direct_vm, direct_bob, direct_alice)
    proposal_id = _create(gate, direct_vm, direct_bob, direct_alice)
    _mock_review(direct_vm, gate, direct_bob, proposal_id, "INCONCLUSIVE")
    gate.review_proposal(proposal_id)
    summary = json.loads(gate.get_proposal_summary(proposal_id))
    assert summary["status"] == "INCONCLUSIVE"
    assert summary["decision"] == "INCONCLUSIVE"
    assert len(summary["review_digest"]) == 64
    assert gate.is_upgrade_authorized(proposal_id, _address_arg(direct_bob), CANDIDATE_HASH) is False
    with direct_vm.expect_revert("Proposal is not reviewable"):
        gate.review_proposal(proposal_id)


def test_inconclusive_requires_new_evidence_not_llm_retry_grinding(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _register(gate, direct_vm, direct_bob, direct_alice)
    proposal_id = _create(gate, direct_vm, direct_bob, direct_alice)
    _mock_review(direct_vm, gate, direct_bob, proposal_id, "INCONCLUSIVE")
    gate.review_proposal(proposal_id)
    original_hash = gate.get_candidate_hash(proposal_id)

    direct_vm.sender = direct_alice
    gate.repair_evidence(
        proposal_id,
        CANDIDATE_URL,
        REPAIR_CI_URL,
        "ci-run-0002",
        REPAIR_AUDIT_URL,
        "audit-run-0002",
    )
    summary = json.loads(gate.get_proposal_summary(proposal_id))
    assert summary["status"] == "PROPOSED"
    assert gate.get_candidate_hash(proposal_id) == original_hash


def test_semantic_failure_is_terminal_rejection(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _register(gate, direct_vm, direct_bob, direct_alice)
    proposal_id = _create(gate, direct_vm, direct_bob, direct_alice)
    _mock_review(direct_vm, gate, direct_bob, proposal_id, "FAIL")
    gate.review_proposal(proposal_id)
    summary = json.loads(gate.get_proposal_summary(proposal_id))
    assert summary["status"] == "REJECTED"
    assert summary["decision"] == "REJECT"
    assert gate.get_active_proposal(_address_arg(direct_bob)) == 0


def test_evidence_ids_cannot_be_replayed_after_cancellation(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _register(gate, direct_vm, direct_bob, direct_alice)
    proposal_id = _create(gate, direct_vm, direct_bob, direct_alice)
    direct_vm.sender = direct_alice
    gate.cancel_proposal(proposal_id)
    with direct_vm.expect_revert("Evidence identifier has already been used"):
        gate.create_proposal(
            _address_arg(direct_bob), "2.0.1", CANDIDATE_URL,
            CANDIDATE_BYTES + b"#2", CI_URL, "ci-run-0001", AUDIT_URL, "audit-run-0001",
        )

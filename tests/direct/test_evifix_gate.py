import hashlib
import json
import re
import time

PROFILE = {
    "schema": "evifix-invariant-profile-v2",
    "rules": [
        {"id": "I01", "domain": "authorization", "text": "Owner withdrawal authority must not expand."},
        {"id": "I02", "domain": "storage", "text": "Persistent storage compatibility must remain intact."},
        {"id": "I03", "domain": "upgrade_authority", "text": "EviFix must remain the only code-upgrade authority."},
        {"id": "I04", "domain": "finality", "text": "Irreversible patch activation must remain finality-bound."},
    ],
    "permitted_domains": ["liveness", "interface", "storage"],
    "forbidden_domains": ["authorization", "upgrade_authority", "value_flow"],
}
PROFILE_JSON = json.dumps(PROFILE, separators=(",", ":"))

SOURCE_PREFIX = "https://raw.githubusercontent.com/evifix-labs/protected-app/"
BUILD_PREFIX = "https://raw.githubusercontent.com/evifix-build-labs/evidence/"
REVIEW_PREFIX = "https://raw.githubusercontent.com/independent-review-labs/evifix/"
EVIDENCE_POLICY = {
    "schema": "evifix-evidence-policy-v2",
    "required_claims": ["BUILD_RESULT", "TEST_RESULT", "INDEPENDENT_REVIEW"],
    "min_independent_issuers": 2,
    "authorities": [
        {"id": "build-lab", "prefix": BUILD_PREFIX},
        {"id": "review-lab", "prefix": REVIEW_PREFIX},
    ],
}
EVIDENCE_POLICY_JSON = json.dumps(EVIDENCE_POLICY, separators=(",", ":"))

BASELINE_COMMIT = "a" * 40
CANDIDATE_COMMIT = "b" * 40
MANIFEST_COMMIT = "c" * 40
BUILD_COMMIT = "d" * 40
TEST_COMMIT = "e" * 40
REVIEW_COMMIT = "f" * 40
MANIFEST2_COMMIT = "1" * 40

BASELINE_URL = SOURCE_PREFIX + BASELINE_COMMIT + "/contracts/target_v1.py"
CANDIDATE_URL = SOURCE_PREFIX + CANDIDATE_COMMIT + "/contracts/target_v2.py"
MANIFEST_URL = BUILD_PREFIX + MANIFEST_COMMIT + "/bundles/capsule.json"
MANIFEST2_URL = BUILD_PREFIX + MANIFEST2_COMMIT + "/bundles/capsule.json"
BUILD_URL = BUILD_PREFIX + BUILD_COMMIT + "/claims/build.json"
TEST_URL = BUILD_PREFIX + TEST_COMMIT + "/claims/test.json"
REVIEW_URL = REVIEW_PREFIX + REVIEW_COMMIT + "/claims/review.json"

BASELINE_BYTES = b"class TargetV1:\n    pass\n"
CANDIDATE_BYTES = b"class TargetV2:\n    pass\n"
BASELINE_HASH = hashlib.sha256(BASELINE_BYTES).hexdigest()
CANDIDATE_HASH = hashlib.sha256(CANDIDATE_BYTES).hexdigest()


def _address_arg(value) -> str:
    if isinstance(value, (bytes, bytearray)):
        raw = bytes(value)
        if len(raw) != 20:
            raise AssertionError(f"Direct Mode address must be 20 bytes, got {len(raw)}")
        return "0x" + raw.hex()
    return str(value)


def _anchor(gate, direct_vm, target, owner):
    direct_vm.sender = target
    gate.anchor_target(
        _address_arg(owner),
        PROFILE_JSON,
        SOURCE_PREFIX,
        EVIDENCE_POLICY_JSON,
        "1.0.0",
        BASELINE_URL,
        BASELINE_HASH,
        24 * 60 * 60,
        2 * 24 * 60 * 60,
        24 * 60 * 60,
    )


def _open(gate, direct_vm, target, owner, declared=None, code=CANDIDATE_BYTES):
    direct_vm.sender = owner
    return gate.open_patch_capsule(
        _address_arg(target),
        "2.0.0",
        CANDIDATE_URL,
        code,
        "Fix timeout handling without changing authority or value movement.",
        json.dumps(declared or ["liveness"]),
    )


def _claim(capsule_id, target, profile_hash, claim_id, kind, issuer, summary, now):
    return {
        "schema": "evifix-claim-v2",
        "claim_id": claim_id,
        "kind": kind,
        "issuer": issuer,
        "capsule_id": capsule_id,
        "target": _address_arg(target),
        "baseline_sha256": BASELINE_HASH,
        "candidate_sha256": CANDIDATE_HASH,
        "profile_hash": profile_hash,
        "result": "PASS",
        "summary": summary,
        "published_at": now - 30,
        "expires_at": now + 3600,
    }


def _evidence(gate, target, capsule_id, now=None):
    now = int(time.time()) if now is None else now
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    profile_hash = summary["profile_hash"]
    build = _claim(capsule_id, target, profile_hash, "build-001", "BUILD_RESULT", "build-lab", "Build completed successfully.", now)
    tests = _claim(capsule_id, target, profile_hash, "tests-001", "TEST_RESULT", "build-lab", "Direct and adversarial tests passed.", now)
    review = _claim(capsule_id, target, profile_hash, "review-001", "INDEPENDENT_REVIEW", "review-lab", "Independent review found no blocking issue.", now)

    build_raw = json.dumps(build, separators=(",", ":"))
    tests_raw = json.dumps(tests, separators=(",", ":"))
    review_raw = json.dumps(review, separators=(",", ":"))
    manifest = {
        "schema": "evifix-evidence-bundle-v2",
        "bundle_id": "bundle-001",
        "publisher": "build-lab",
        "capsule_id": capsule_id,
        "target": _address_arg(target),
        "baseline_sha256": BASELINE_HASH,
        "candidate_sha256": CANDIDATE_HASH,
        "profile_hash": profile_hash,
        "candidate_version": "2.0.0",
        "source_commit": CANDIDATE_COMMIT,
        "published_at": now - 20,
        "expires_at": now + 3600,
        "claims": [
            {
                "claim_id": "build-001",
                "kind": "BUILD_RESULT",
                "issuer": "build-lab",
                "artifact_url": BUILD_URL,
                "artifact_sha256": hashlib.sha256(build_raw.encode()).hexdigest(),
            },
            {
                "claim_id": "tests-001",
                "kind": "TEST_RESULT",
                "issuer": "build-lab",
                "artifact_url": TEST_URL,
                "artifact_sha256": hashlib.sha256(tests_raw.encode()).hexdigest(),
            },
            {
                "claim_id": "review-001",
                "kind": "INDEPENDENT_REVIEW",
                "issuer": "review-lab",
                "artifact_url": REVIEW_URL,
                "artifact_sha256": hashlib.sha256(review_raw.encode()).hexdigest(),
            },
        ],
    }
    return json.dumps(manifest, separators=(",", ":")), build_raw, tests_raw, review_raw


def _delta(**changes):
    value = {
        "storage": "UNCHANGED",
        "authorization": "UNCHANGED",
        "user_rights": "UNCHANGED",
        "upgrade_authority": "UNCHANGED",
        "external_calls": "UNCHANGED",
        "value_flow": "UNCHANGED",
        "evidence": "UNCHANGED",
        "consensus": "UNCHANGED",
        "finality": "UNCHANGED",
        "liveness": "UNCHANGED",
        "interface": "UNCHANGED",
    }
    value.update(changes)
    return value


def _adjudication(value="PASS"):
    return {
        "invariants": {rule["id"]: value for rule in PROFILE["rules"]},
        "evidence_semantics": value,
    }


def _mock_review(direct_vm, gate, target, capsule_id, delta=None, adjudication=None, manifest_url=MANIFEST_URL):
    manifest, build, tests, review = _evidence(gate, target, capsule_id)
    direct_vm.mock_web(re.escape(BASELINE_URL), {"status": 200, "body": BASELINE_BYTES.decode()})
    direct_vm.mock_web(re.escape(CANDIDATE_URL), {"status": 200, "body": CANDIDATE_BYTES.decode()})
    direct_vm.mock_web(re.escape(manifest_url), {"status": 200, "body": manifest})
    direct_vm.mock_web(re.escape(BUILD_URL), {"status": 200, "body": build})
    direct_vm.mock_web(re.escape(TEST_URL), {"status": 200, "body": tests})
    direct_vm.mock_web(re.escape(REVIEW_URL), {"status": 200, "body": review})
    direct_vm.mock_llm(r"EVIFIX_SEMANTIC_DELTA_V2", json.dumps(delta or _delta(liveness="MUTATED")))
    direct_vm.mock_llm(r"EVIFIX_INVARIANT_ADJUDICATION_V2", json.dumps(adjudication or _adjudication()))


def _ready(gate, direct_vm, target, owner, declared=None):
    capsule_id = _open(gate, direct_vm, target, owner, declared=declared)
    direct_vm.sender = owner
    gate.submit_evidence_epoch(capsule_id, MANIFEST_URL)
    return capsule_id


def test_profile_requires_independent_generic_evidence_policy(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    weak_policy = dict(EVIDENCE_POLICY)
    weak_policy["authorities"] = [
        {"id": "one", "prefix": "https://raw.githubusercontent.com/evifix-labs/one/"},
        {"id": "two", "prefix": "https://raw.githubusercontent.com/evifix-labs/two/"},
    ]
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Evidence policy does not provide independent corroboration"):
        gate.anchor_target(
            _address_arg(direct_alice), PROFILE_JSON, SOURCE_PREFIX,
            json.dumps(weak_policy), "1.0.0", BASELINE_URL, BASELINE_HASH,
            3600, 3600, 3600,
        )


def test_capsule_freezes_exact_candidate_and_baseline_generation(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    capsule_id = _open(gate, direct_vm, direct_bob, direct_alice)
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    assert summary["candidate_code_hash"] == CANDIDATE_HASH
    assert summary["baseline_code_hash"] == BASELINE_HASH
    assert summary["baseline_generation"] == 0
    assert summary["status"] == "AWAITING_EVIDENCE"


def test_declared_change_domain_must_be_permitted(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Declared change domain is not permitted by this profile"):
        gate.open_patch_capsule(
            _address_arg(direct_bob), "2.0.0", CANDIDATE_URL, CANDIDATE_BYTES,
            "Attempt to alter code-upgrade authority.", json.dumps(["upgrade_authority"]),
        )


def test_evidence_epoch_is_explicit_and_manifest_cannot_be_replayed(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    capsule_id = _open(gate, direct_vm, direct_bob, direct_alice)
    direct_vm.sender = direct_alice
    gate.submit_evidence_epoch(capsule_id, MANIFEST_URL)
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    assert summary["evidence_epoch"] == 1
    gate.cancel_capsule(capsule_id)
    capsule2 = _open(gate, direct_vm, direct_bob, direct_alice, code=CANDIDATE_BYTES + b"#2")
    with direct_vm.expect_revert("Evidence manifest URL has already been used for this target"):
        gate.submit_evidence_epoch(capsule2, MANIFEST_URL)


def test_undeclared_observed_semantic_change_is_terminal_rejection(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    capsule_id = _ready(gate, direct_vm, direct_bob, direct_alice, declared=["liveness"])
    _mock_review(direct_vm, gate, direct_bob, capsule_id, delta=_delta(liveness="MUTATED", interface="ADDED"))
    gate.review_capsule(capsule_id)
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    assert summary["status"] == "REJECTED"
    assert summary["decision"] == "REJECT"
    assert summary["last_review_code"] == "UNDECLARED_SEMANTIC_CHANGE_INTERFACE"
    assert gate.get_active_capsule(_address_arg(direct_bob)) == 0


def test_forbidden_observed_change_is_terminal_even_if_other_change_is_declared(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    capsule_id = _ready(gate, direct_vm, direct_bob, direct_alice, declared=["liveness"])
    _mock_review(direct_vm, gate, direct_bob, capsule_id, delta=_delta(liveness="MUTATED", upgrade_authority="RELAXED"))
    gate.review_capsule(capsule_id)
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    assert summary["status"] == "REJECTED"
    assert summary["last_review_code"] == "FORBIDDEN_SEMANTIC_CHANGE_UPGRADE_AUTHORITY"


def test_inconclusive_delta_is_first_class_and_cannot_issue_receipt(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    capsule_id = _ready(gate, direct_vm, direct_bob, direct_alice)
    _mock_review(direct_vm, gate, direct_bob, capsule_id, delta=_delta(liveness="INCONCLUSIVE"))
    gate.review_capsule(capsule_id)
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    assert summary["status"] == "INCONCLUSIVE"
    assert summary["decision"] == "INCONCLUSIVE"
    assert summary["receipt_hash"] == ""
    with direct_vm.expect_revert("Patch capsule is not reviewable"):
        gate.review_capsule(capsule_id)


def test_inconclusive_requires_new_evidence_epoch_and_same_bundle_is_blocked(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    capsule_id = _ready(gate, direct_vm, direct_bob, direct_alice)
    _mock_review(direct_vm, gate, direct_bob, capsule_id, delta=_delta(liveness="INCONCLUSIVE"))
    gate.review_capsule(capsule_id)
    frozen_hash = gate.get_candidate_hash(capsule_id)

    direct_vm.sender = direct_alice
    gate.submit_evidence_epoch(capsule_id, MANIFEST2_URL)
    assert gate.get_candidate_hash(capsule_id) == frozen_hash

    # The new immutable URL deliberately serves byte-for-byte identical evidence.
    _mock_review(direct_vm, gate, direct_bob, capsule_id, delta=_delta(liveness="MUTATED"), manifest_url=MANIFEST2_URL)
    gate.review_capsule(capsule_id)
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    assert summary["status"] == "EVIDENCE_REPAIR_REQUIRED"
    assert summary["last_review_code"] == "EVIDENCE_EPOCH_UNCHANGED"


def test_all_pass_within_declared_scope_issues_bound_receipt(direct_vm, direct_deploy, direct_alice, direct_bob):
    gate = direct_deploy("contracts/evifix_gate.py")
    _anchor(gate, direct_vm, direct_bob, direct_alice)
    capsule_id = _ready(gate, direct_vm, direct_bob, direct_alice)
    _mock_review(direct_vm, gate, direct_bob, capsule_id, delta=_delta(liveness="MUTATED"))
    gate.review_capsule(capsule_id)
    summary = json.loads(gate.get_capsule_summary(capsule_id))
    assert summary["status"] == "RECEIPT_ISSUED"
    assert summary["decision"] == "APPROVE"
    assert len(summary["evidence_bundle_hash"]) == 64
    assert len(summary["delta_hash"]) == 64
    assert len(summary["decision_hash"]) == 64
    assert len(summary["receipt_hash"]) == 64
    assert gate.verify_patch_receipt(
        capsule_id,
        _address_arg(direct_bob),
        BASELINE_HASH,
        CANDIDATE_HASH,
        summary["receipt_hash"],
    ) is True
    assert gate.verify_patch_receipt(
        capsule_id,
        _address_arg(direct_bob),
        "0" * 64,
        CANDIDATE_HASH,
        summary["receipt_hash"],
    ) is False

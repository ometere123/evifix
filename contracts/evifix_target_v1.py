# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import hashlib


@gl.contract_interface
class EviFixGate:
    class View:
        def verify_patch_receipt(
            self,
            capsule_id: u256,
            target: str,
            baseline_hash: str,
            candidate_hash: str,
            receipt_hash: str,
        ) -> bool: ...

    class Write:
        def anchor_target(
            self,
            owner: str,
            invariant_profile_json: str,
            source_prefix: str,
            evidence_policy_json: str,
            baseline_version: str,
            baseline_source_url: str,
            baseline_code_hash: str,
            max_evidence_age_seconds: int,
            capsule_ttl_seconds: int,
            activation_timeout_seconds: int,
        ) -> None: ...

        def record_activation(
            self,
            capsule_id: u256,
            receipt_hash: str,
            candidate_hash: str,
            generation: u256,
        ) -> None: ...


class EviFixTarget(gl.Contract):
    # Persistent v1 layout. Compatible patches must preserve these fields in order.
    owner: Address
    evifix_gate: Address
    product_name: str
    protected_value: str
    baseline_hash: str
    last_receipt_hash: str
    last_capsule_id: u256
    baseline_generation: u256
    enrolled_with_evifix: bool

    def __init__(self, evifix_gate: Address, product_name: str, initial_value: str):
        self.owner = gl.message.sender_address
        self.evifix_gate = evifix_gate
        self.product_name = product_name
        self.protected_value = initial_value
        self.baseline_hash = ""
        self.last_receipt_hash = ""
        self.last_capsule_id = u256(0)
        self.baseline_generation = u256(0)
        self.enrolled_with_evifix = False

        # EviFix is the sole GenVM code upgrader. The owner is deliberately not an upgrader.
        root = gl.storage.Root.get()
        root.upgraders.get().append(evifix_gate)

    def _only_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")

    def _is_hex_hash(self, value: str) -> bool:
        if len(value) != 64:
            return False
        for char in value:
            if char not in "0123456789abcdef":
                return False
        return True

    @gl.public.write
    def set_protected_value(self, value: str) -> None:
        self._only_owner()
        self.protected_value = value

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def get_protected_value(self) -> str:
        return self.protected_value

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def get_product_name(self) -> str:
        return self.product_name

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def get_owner(self) -> Address:
        return self.owner

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def get_evifix_gate(self) -> Address:
        return self.evifix_gate

    @gl.public.write
    def enrol_with_evifix(
        self,
        invariant_profile_json: str,
        source_prefix: str,
        evidence_policy_json: str,
        baseline_version: str,
        baseline_source_url: str,
        baseline_code_hash: str,
        max_evidence_age_seconds: int,
        capsule_ttl_seconds: int,
        activation_timeout_seconds: int,
    ) -> None:
        self._only_owner()
        if self.enrolled_with_evifix:
            raise gl.vm.UserError("Already enrolled with EviFix")
        normalized_hash = baseline_code_hash.lower()
        if not self._is_hex_hash(normalized_hash):
            raise gl.vm.UserError("baseline_code_hash must be a lowercase SHA-256 digest")

        # Anchor the target-local baseline before finality. If this transaction does not
        # finalize, neither this state nor the gate-side profile becomes authoritative.
        self.baseline_hash = normalized_hash
        self.enrolled_with_evifix = True

        EviFixGate(self.evifix_gate).emit(on="finalized").anchor_target(
            str(self.owner),
            invariant_profile_json,
            source_prefix,
            evidence_policy_json,
            baseline_version,
            baseline_source_url,
            normalized_hash,
            max_evidence_age_seconds,
            capsule_ttl_seconds,
            activation_timeout_seconds,
        )

    @gl.public.write
    def apply_evifix_patch(
        self,
        capsule_id: u256,
        receipt_hash: str,
        baseline_hash: str,
        candidate_hash: str,
        candidate_code: bytes,
    ) -> None:
        if gl.message.sender_address != self.evifix_gate:
            raise gl.vm.UserError("Only EviFix may deliver a patch receipt")
        if not self.enrolled_with_evifix:
            raise gl.vm.UserError("Target is not enrolled with EviFix")

        normalized_baseline = baseline_hash.lower()
        normalized_candidate = candidate_hash.lower()
        if self.baseline_hash != normalized_baseline:
            raise gl.vm.UserError("Local verified baseline does not match the receipt baseline")
        actual_hash = hashlib.sha256(candidate_code).hexdigest()
        if actual_hash != normalized_candidate:
            raise gl.vm.UserError("Delivered candidate bytes do not match the receipt candidate hash")

        gate = EviFixGate(self.evifix_gate)
        if not gate.view().verify_patch_receipt(
            capsule_id,
            str(gl.message.contract_address),
            normalized_baseline,
            normalized_candidate,
            receipt_hash,
        ):
            raise gl.vm.UserError("Patch receipt is absent, stale, consumed, or mismatched")

        next_generation = u256(int(self.baseline_generation) + 1)

        # Persist the activation attestation before code replacement. A compatible patch
        # preserves these fields and therefore carries the verified baseline forward.
        self.baseline_hash = actual_hash
        self.last_receipt_hash = receipt_hash
        self.last_capsule_id = capsule_id
        self.baseline_generation = next_generation

        root = gl.storage.Root.get()
        code = root.code.get()
        code.truncate()
        code.extend(candidate_code)

        gate.emit(on="finalized").record_activation(
            capsule_id,
            receipt_hash,
            actual_hash,
            next_generation,
        )

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def evifix_baseline_hash(self) -> str:
        return self.baseline_hash

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def evifix_last_receipt_hash(self) -> str:
        return self.last_receipt_hash

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def evifix_last_capsule_id(self) -> u256:
        return self.last_capsule_id

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def evifix_generation(self) -> u256:
        return self.baseline_generation

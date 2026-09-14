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
        def record_activation(
            self,
            capsule_id: u256,
            receipt_hash: str,
            candidate_hash: str,
            generation: u256,
        ) -> None: ...


class EviFixTarget(gl.Contract):
    # Exact v1 persistent prefix is preserved.
    owner: Address
    evifix_gate: Address
    product_name: str
    protected_value: str
    baseline_hash: str
    last_receipt_hash: str
    last_capsule_id: u256
    baseline_generation: u256
    enrolled_with_evifix: bool

    def _only_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")

    @gl.public.write
    def set_protected_value(self, value: str) -> None:
        self._only_owner()
        self.protected_value = value.strip()

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

    @gl.public.view  # pyright: ignore[reportUnknownMemberType]
    def get_release_label(self) -> str:
        return "EviFix safe fixture v2"

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
        self.baseline_hash = actual_hash
        self.last_receipt_hash = receipt_hash
        self.last_capsule_id = capsule_id
        self.baseline_generation = next_generation
        root = gl.storage.Root.get()
        code = root.code.get()
        code.truncate()
        code.extend(candidate_code)
        gate.emit(on="finalized").record_activation(capsule_id, receipt_hash, actual_hash, next_generation)

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

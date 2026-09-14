# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import hashlib


@gl.contract_interface
class EviFixGate:
    class View:
        def is_upgrade_authorized(self, proposal_id: u256, target: str, candidate_hash: str) -> bool: ...
        def get_candidate_code(self, proposal_id: u256) -> bytes: ...

    class Write:
        def confirm_install(self, proposal_id: u256, candidate_hash: str) -> None: ...


class EviFixTarget(gl.Contract):
    # v1 storage order preserved exactly.
    owner: Address
    evifix_gate: Address
    product_name: str
    protected_value: str
    installed_proposal_id: u256
    installed_candidate_hash: str
    registered_with_evifix: bool

    def _only_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")

    @gl.public.write
    def set_protected_value(self, value: str) -> None:
        self._only_owner()
        self.protected_value = value

    @gl.public.view
    def get_protected_value(self) -> str:
        return self.protected_value

    @gl.public.view
    def get_product_name(self) -> str:
        return self.product_name

    @gl.public.view
    def get_owner(self) -> Address:
        return self.owner

    @gl.public.view
    def get_evifix_gate(self) -> Address:
        return self.evifix_gate

    @gl.public.view
    def release_fingerprint(self) -> str:
        payload = f"{self.product_name}:{self.protected_value}:{self.installed_candidate_hash}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @gl.public.write
    def evifix_upgrade(self, proposal_id: u256, candidate_hash: str) -> None:
        if gl.message.sender_address != self.evifix_gate:
            raise gl.vm.UserError("Only EviFix gate may upgrade this target")
        gate = EviFixGate(self.evifix_gate)
        normalized_hash = candidate_hash.lower()
        if not gate.view().is_upgrade_authorized(proposal_id, str(gl.message.contract_address), normalized_hash):
            raise gl.vm.UserError("EviFix authorization is absent, stale, or mismatched")
        candidate_code = gate.view().get_candidate_code(proposal_id)
        actual_hash = hashlib.sha256(candidate_code).hexdigest()
        if actual_hash != normalized_hash:
            raise gl.vm.UserError("Approved candidate bytes do not match approved hash")
        self.installed_proposal_id = proposal_id
        self.installed_candidate_hash = actual_hash
        root = gl.storage.Root.get()
        code = root.code.get()
        code.truncate()
        code.extend(candidate_code)
        gate.emit(on="finalized").confirm_install(proposal_id, actual_hash)

    @gl.public.view
    def evifix_installed_proposal_id(self) -> u256:
        return self.installed_proposal_id

    @gl.public.view
    def evifix_installed_candidate_hash(self) -> str:
        return self.installed_candidate_hash

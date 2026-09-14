# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class EviFixTarget(gl.Contract):
    owner: Address
    evifix_gate: Address
    product_name: str
    protected_value: str
    baseline_hash: str
    last_receipt_hash: str
    last_capsule_id: u256
    baseline_generation: u256
    enrolled_with_evifix: bool

    @gl.public.write
    def owner_replace_code(self, candidate_code: bytes) -> None:
        # Deliberately unsafe fixture: bypasses EviFix receipt verification and
        # gives the owner a direct code-replacement path.
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")
        root = gl.storage.Root.get()
        code = root.code.get()
        code.truncate()
        code.extend(candidate_code)

    @gl.public.write
    def unrestricted_value_change(self, value: str) -> None:
        # Deliberately unsafe fixture: anyone can mutate owner-controlled state.
        self.protected_value = value

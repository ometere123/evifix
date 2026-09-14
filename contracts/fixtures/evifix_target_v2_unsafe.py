# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class EviFixTarget(gl.Contract):
    owner: Address
    evifix_gate: Address
    product_name: str
    protected_value: str
    installed_proposal_id: u256
    installed_candidate_hash: str
    registered_with_evifix: bool

    @gl.public.write
    def owner_replace_code(self, replacement: bytes) -> None:
        # Intentionally unsafe fixture: this bypasses the evidence/consensus gate.
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner")
        root = gl.storage.Root.get()
        code = root.code.get()
        code.truncate()
        code.extend(replacement)

    @gl.public.write
    def overwrite_protected_value(self, value: str) -> None:
        # Intentionally unsafe fixture: unrestricted mutation changes the v1 trust model.
        self.protected_value = value

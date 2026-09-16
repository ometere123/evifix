# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class EviFixGateEscrowStub(gl.Contract):
    target: Address
    opener: Address
    status: str
    expires_at: u256

    def __init__(self, target: str, opener: str, status: str, expires_at: u256):
        self.target = Address(target)
        self.opener = Address(opener)
        self.status = status
        self.expires_at = expires_at

    @gl.public.write
    def set_status(self, status: str) -> None:
        self.status = status

    @gl.public.view
    def get_capsule_summary(self, capsule_id: u256) -> str:
        return json.dumps({
            "capsule_id": int(capsule_id),
            "target": str(self.target),
            "opener": str(self.opener),
            "status": self.status,
            "expires_at": int(self.expires_at),
        }, separators=(",", ":"))

# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""Deterministic reward escrow for finalized EviFix patch outcomes.

The EviFix gate owns semantic review and receipt issuance. This contract owns
only GEN custody and deterministic release/refund rules. A sponsor funds one
specific immutable patch capsule; the capsule opener is the only beneficiary.
The reward is released only after the gate reports VERIFIED, which means the
target-side activation and gate-side finality attestation completed. Every
other terminal outcome refunds the sponsor. Pending outcomes can be refunded
only after the capsule's immutable activation deadline has expired.

The GenLayer consensus/appeal process is the contest boundary for the patch
decision. This contract never interprets source text or chooses an outcome.
"""

from dataclasses import dataclass
from datetime import datetime
import json
from genlayer import *


ESCROW_SCHEMA = "evifix-escrow-v1"
STATUS_FUNDED = "FUNDED"
STATUS_RELEASED = "RELEASED"
STATUS_REFUNDED = "REFUNDED"

GATE_VERIFIED = "VERIFIED"
GATE_REJECTED = "REJECTED"
GATE_EXPIRED = "EXPIRED"
GATE_CANCELLED = "CANCELLED"
GATE_ACTIVATION_FAILED = "ACTIVATION_FAILED"
GATE_PENDING = (
    "AWAITING_EVIDENCE",
    "READY",
    "EVIDENCE_REPAIR_REQUIRED",
    "REVIEW_RETRY_REQUIRED",
    "INCONCLUSIVE",
    "RECEIPT_ISSUED",
)
GATE_TERMINAL_FAILURES = (
    GATE_REJECTED,
    GATE_EXPIRED,
    GATE_CANCELLED,
    GATE_ACTIVATION_FAILED,
)
MIN_CLAIM_WINDOW = u256(60)
MAX_CLAIM_WINDOW = u256(30 * 24 * 60 * 60)


@allow_storage
@dataclass
class Escrow:
    escrow_id: u256
    gate: Address
    capsule_id: u256
    sponsor: Address
    beneficiary: Address
    amount: u256
    funded_at: u256
    claim_after: u256
    activation_deadline: u256
    status: str
    terminal_reason: str
    released_amount: u256
    refunded_amount: u256


@gl.contract_interface
class EviFixGate:
    class View:
        def get_capsule_summary(self, capsule_id: u256) -> str: ...


class EviFixEscrow(gl.Contract):
    next_id: u256
    escrows: TreeMap[u256, Escrow]
    escrow_by_capsule: TreeMap[str, u256]
    total_funded: u256
    total_released: u256
    total_refunded: u256
    escrow_count: u256

    def __init__(self):
        self.next_id = u256(1)
        self.total_funded = u256(0)
        self.total_released = u256(0)
        self.total_refunded = u256(0)
        self.escrow_count = u256(0)

    def _now(self) -> u256:
        return u256(int(datetime.fromisoformat(str(gl.message_raw["datetime"]).replace("Z", "+00:00")).timestamp()))

    def _zero(self) -> Address:
        return Address("0x0000000000000000000000000000000000000000")

    def _capsule_key(self, gate: Address, capsule_id: u256) -> str:
        return str(gate).lower() + ":" + str(int(capsule_id))

    def _get(self, escrow_id: u256) -> Escrow:
        assert escrow_id in self.escrows, "unknown escrow"
        return self.escrows[escrow_id]

    def _summary(self, gate: Address, capsule_id: u256) -> dict:
        raw = EviFixGate(gate).view().get_capsule_summary(capsule_id)
        try:
            data = json.loads(raw)
        except Exception:
            raise gl.vm.UserError("EviFix capsule summary is invalid")
        assert isinstance(data, dict), "EviFix capsule summary is invalid"
        return data

    def _pay(self, recipient: Address, amount: u256) -> None:
        if amount > 0:
            @gl.evm.contract_interface
            class Recipient:
                class View:
                    pass
                class Write:
                    pass
            Recipient(recipient).emit_transfer(value=amount)

    def _require_terminal_failure(self, escrow: Escrow, summary: dict[object, object], now: u256) -> str:
        status = summary.get("status")
        assert isinstance(status, str), "EviFix capsule status is invalid"
        if status in GATE_TERMINAL_FAILURES:
            return status
        assert status in GATE_PENDING, "EviFix capsule is not refundable"
        expires_raw = summary.get("expires_at")
        assert isinstance(expires_raw, int) and not isinstance(expires_raw, bool), "EviFix deadline is invalid"
        assert now > u256(expires_raw), "EviFix capsule is still active"
        assert now >= escrow.claim_after, "escrow refund window has not opened"
        return "CAPSULE_DEADLINE_EXPIRED"

    @gl.public.write.payable
    def fund_patch(
        self,
        gate: str,
        capsule_id: u256,
        beneficiary: str,
        claim_after: u256,
    ) -> u256:
        gate_address = Address(str(gate))
        beneficiary_address = Address(str(beneficiary))
        sponsor = Address(str(gl.message.sender_address))
        assert gate_address != self._zero(), "gate is required"
        assert beneficiary_address != self._zero(), "beneficiary is required"
        assert beneficiary_address != sponsor, "sponsor cannot be beneficiary"
        assert gl.message.value > 0, "exact escrow funding is required"
        key = self._capsule_key(gate_address, capsule_id)
        assert self.escrow_by_capsule.get(key, u256(0)) == u256(0), "capsule already has escrow"

        summary = self._summary(gate_address, capsule_id)
        assert summary.get("status") in GATE_PENDING, "capsule is not fundable"
        target_raw = summary.get("target")
        opener_raw = summary.get("opener")
        expires_raw = summary.get("expires_at")
        assert isinstance(target_raw, str) and isinstance(opener_raw, str), "capsule binding is invalid"
        assert Address(target_raw) != self._zero(), "capsule target is invalid"
        assert Address(opener_raw) == beneficiary_address, "beneficiary must be the capsule opener"
        assert isinstance(expires_raw, int) and not isinstance(expires_raw, bool), "capsule deadline is invalid"
        now = self._now()
        assert claim_after > now, "claim window must be in the future"
        assert claim_after >= u256(expires_raw) + MIN_CLAIM_WINDOW, "claim window starts too early"
        assert claim_after <= u256(expires_raw) + MAX_CLAIM_WINDOW, "claim window is too long"

        escrow_id = self.next_id
        self.next_id += u256(1)
        self.escrows[escrow_id] = Escrow(
            escrow_id,
            gate_address,
            capsule_id,
            sponsor,
            beneficiary_address,
            gl.message.value,
            now,
            claim_after,
            u256(expires_raw),
            STATUS_FUNDED,
            "",
            u256(0),
            u256(0),
        )
        self.escrow_by_capsule[key] = escrow_id
        self.next_id = escrow_id + u256(1)
        self.escrow_count += u256(1)
        self.total_funded += gl.message.value
        return escrow_id

    @gl.public.write
    def release_patch(self, escrow_id: u256) -> None:
        escrow = self._get(escrow_id)
        assert escrow.status == STATUS_FUNDED, "escrow is already settled"
        assert gl.message.sender_address == escrow.beneficiary, "only beneficiary can claim escrow"
        now = self._now()
        assert now >= escrow.claim_after, "claim window has not opened"
        summary = self._summary(escrow.gate, escrow.capsule_id)
        assert summary.get("status") == GATE_VERIFIED, "patch is not finalized as verified"

        amount = escrow.amount
        escrow.status = STATUS_RELEASED
        escrow.terminal_reason = "FINALIZED_PATCH_VERIFIED"
        escrow.released_amount = amount
        self.escrows[escrow_id] = escrow
        self.total_released += amount
        self._pay(escrow.beneficiary, amount)

    @gl.public.write
    def refund_patch(self, escrow_id: u256) -> None:
        escrow = self._get(escrow_id)
        assert escrow.status == STATUS_FUNDED, "escrow is already settled"
        assert gl.message.sender_address == escrow.sponsor, "only sponsor can refund escrow"
        summary = self._summary(escrow.gate, escrow.capsule_id)
        reason = self._require_terminal_failure(escrow, summary, self._now())

        amount = escrow.amount
        escrow.status = STATUS_REFUNDED
        escrow.terminal_reason = reason
        escrow.refunded_amount = amount
        self.escrows[escrow_id] = escrow
        self.total_refunded += amount
        self._pay(escrow.sponsor, amount)

    @gl.public.view
    def get_escrow(self, escrow_id: u256) -> Escrow:
        return self._get(escrow_id)

    @gl.public.view
    def get_escrow_for_capsule(self, gate: str, capsule_id: u256) -> u256:
        return self.escrow_by_capsule.get(self._capsule_key(Address(str(gate)), capsule_id), u256(0))

    @gl.public.view
    def get_accounting(self) -> dict:
        return {
            "schema": ESCROW_SCHEMA,
            "escrow_count": self.escrow_count,
            "total_funded": self.total_funded,
            "total_released": self.total_released,
            "total_refunded": self.total_refunded,
            "total_unsettled": self.total_funded - self.total_released - self.total_refunded,
        }

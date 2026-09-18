# ReferralRail v2 public capacity verification

This document is the public deliverable for a ReferralRail v2 PUBLIC_WEB judgment.

Campaign 9 position 1 challenge:
ReferralRailV2:9:1:0xb29Ead15B1E8A2420faE84de974088f67a15ccC2:abebdef1d1a6d1c22e03959136edad64

The protected input is bounded before storage. The safety fix keeps the upgrade boundary gate-only. Candidate bytes are hashed and verified before the protected value is accepted. The relevant implementation and regression tests are in the evifix repository:

https://github.com/ometere123/evifix/blob/referralrail-v2-live-success-1789729305/contracts/safety.py
https://github.com/ometere123/evifix/tree/referralrail-v2-live-success-1789729305/tests

The ReferralRail protocol test has max_positions equal to 2 and unit funding equal to 400000000000000 wei. Position 1 is assigned to candidate 0xb29Ead15B1E8A2420faE84de974088f67a15ccC2. A separate position is assigned to candidate 0x24fAe7cD031Ed702Be63BDeA8912141805B996bd. The second candidate intentionally submits a page that does not satisfy the position challenge. When that judgment fails, the protocol decreases occupied capacity and reopens one position. A third accepted position then uses the reopened slot. Only the protocol contract can mark a position successful, release escrow, pay the candidate and referrer, or refund the employer.

This page is evidence input only. It cannot authorize a transfer and it does not claim that an assertion by itself is a judgment. The judge must compare the fetched content with the exact challenge and criteria.
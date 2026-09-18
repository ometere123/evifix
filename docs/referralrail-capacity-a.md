# ReferralRail v2 capacity proof

Challenge: ReferralRailV2:9:1:0xb29Ead15B1E8A2420faE84de974088f67a15ccC2:abebdef1d1a6d1c22e03959136edad64

This is a bounded public evidence record for the ReferralRail v2 capacity test. The required input change is bounded protected-value input before storage. The implementation preserves gate-only upgrade authority and candidate-byte hash verification.

The test plan uses two successful public-web positions and one failed position. Position A is this page. Position B intentionally points to evidence that does not satisfy this challenge. After B fails, the campaign must reopen one position slot. Position C then uses a new accepted candidate and the same bounded public-web gate.

The evidence is intended to be read as untrusted public content by OutcomeJudge. It does not authorize transfers. ReferralRail alone controls escrow, attribution, capacity, retries, refunds, and settlement.

Repository: https://github.com/ometere123/evifix
Branch: referralrail-v2-live-success-1789729305
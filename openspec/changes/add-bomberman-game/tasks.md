# Tasks

## 1. Server extension
- [x] 1.1 Register isolated code admission and deterministic room rules; verified by local two-client authority/capacity/isolation tests.
- [x] 1.2 Add shared rules export and game-specific SDK recovery; verified by identical rule source, package dry-run and observed same-session reconnection.
- [x] 1.3 Verify recovery timeout and document room lifecycle; run Bomberman integration including reserved seat expiry.
- [x] 1.4 Preserve all games and document new consumer/API; typecheck and all 36 regressions pass after concurrent Neon Breaker rebase.

## 2. Release and public verification
- [ ] 2.1 Push scoped commits and release v0.9.0 through existing workflow; verify tagged client artifact and backend deployment.
- [ ] 2.2 Verify public Bomberman actions and existing-games regressions; require live workflow checks and matching health version before acceptance.


# Tasks

## 1. Ring Rivals room

- [x] 1.1 Implement deterministic boxing rules and focused unit tests for attacks, defense, stamina, knockouts, timer decisions, tied-round draws, best-of-three, and disconnect pause/forfeit.
- [x] 1.2 Add isolated two-seat private room with six-character admission, validated/rate-limited inputs, snapshots, and same-session 15-second recovery; verify two-client sync, room-code rejection, capacity, isolation, reconnect, and expiry.
- [x] 1.3 Add the client opt-in for SDK reconnection and verify Ring Rivals preserves session ID while existing non-Bomberman clients retain fresh-identity behavior.

## 2. Release preparation

- [x] 2.1 Export the rules/client contract and update root README, package README, game registry, and feature catalog; verify generated package contents include all new public files.
- [x] 2.2 Add Ring Rivals live integration to deployment checks and verify health/admission/state behavior against a production-like service.
- [x] 2.3 Run Node 24 `npm ci`, `npm run typecheck`, and full `npm test`; verify all current game regressions still pass.
- [ ] 2.4 Commit and push only Ring Rivals changes; release the server and client, verify the published artifact and deployed health version, then run the game-specific live integration before declaring the server ready.

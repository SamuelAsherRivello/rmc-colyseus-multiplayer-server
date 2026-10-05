# Tasks

## 1. Reusable host relay

- [x] 1.1 Add a browser-independent participant-host lifecycle helper that records connection order, eligibility, liveness, and the latest bounded transferable payload; verify unit tests cover initial election and rejected non-host state publications.
- [x] 1.2 Integrate deterministic host departure and liveness promotion with successor state transfer; verify tests cover longest-connected promotion and empty-room closure.

## 2. Just Like Rabbits room

- [x] 2.1 Register the isolated `just-like-rabbits` game and admission endpoint with a twelve-participant capacity and fictional numbered colour identities; verify integration tests cover admission, presence, late join, and full-room rejection.
- [x] 2.2 Implement bounded, rate-limited cursor, interaction request, host snapshot, and host-transfer messages; verify two independent clients converge on valid ordered messages while invalid payloads and guests' snapshots are rejected.
- [x] 2.3 Extend the shared client state/events and API documentation additively; verify the existing client package tests and a package build remain compatible.

## 3. Regression, documentation, and release gate

- [x] 3.1 Add the game registry and README entry with capacity, lifecycle, compatible additive-deployment policy, in-memory-session interruption limitation, and consumer pinning guidance; verify the registry remains alphabetized and documentation matches the client contract.
- [x] 3.2 Run `npm run typecheck` and `npm test`, including existing-game regression, game-isolation, reconnect, and two-client relay tests; verify all configured checks pass.
- [ ] 3.3 Release and deploy a compatible package through the existing single-instance path, then record the tag, endpoint, and live two-client evidence; verify the public room accepts the game without affecting existing games and document that deployments interrupt in-memory rooms.

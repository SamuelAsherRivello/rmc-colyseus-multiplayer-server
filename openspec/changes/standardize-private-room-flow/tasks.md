# Tasks

## 1. Standardize server admission and room lifecycle

- [x] 1.1 Add four-character code generation, requested-code creation, active-code uniqueness checks, clear conflicts/errors, and per-source admission throttling; verify malformed, duplicate, custom-code, and rate-limit cases with focused integration tests.
- [x] 1.2 Add room-level replacement of disconnected reservations and a 15-second empty-room grace; verify that code rejoin gets a fresh identity, preserves connected players and game state, rejects a full connected room, and expires an unreclaimed empty room.
- [x] 1.3 Apply the shared code and seat-replacement contract to Bomberman, Gungeon, Ring Rivals, and Street Fighter; update the in-progress `add-ring-rivals-game` delta and verify each coded game's admission and recovery integration tests.

## 2. Add shared client link support and documentation

- [x] 2.1 Add browser-safe helpers for suggested codes, reading the `room` URL parameter, and building share links while preserving other query parameters; verify helper behavior and existing `MultiplayerClient` API compatibility with client tests and package dry-run.
- [x] 2.2 Document the **Play Online** / **Join Room** / **Create Room** pattern and refresh behavior in the shared-client README; update the root Custom Shared Features row with links to the exact documentation section and admission/lifecycle source; verify every linked path and line anchor.

## 3. Host resumable rooms on free Vercel services

- [ ] 3.1 Prototype Vercel Hobby WebSocket handling with two independent function instances using only first-party Vercel state services (Blob or Edge Config); verify atomic room-code admission, same-room join, ordered broadcasts, owner recovery, and reconnect behavior, and measure operations, bandwidth, and function usage for representative coded-game traffic. Stop the migration if Vercel's consistency semantics or free quotas cannot support every coded game; do not add a third-party service or weaken room continuity.
- [ ] 3.2 Implement shared room ownership, seat leases, state snapshots, and ordered message routing behind the existing room/client contract; add tests for concurrent code creation, cross-instance join, disconnect grace, and state restoration after forced socket replacement.
- [ ] 3.3 Remove Render-only Docker, Blueprint, and deploy-hook configuration; configure the Vercel Node/WebSocket entrypoint and GitHub production-branch deployment while preserving the stable Vercel endpoint; verify local Node 24 operation and a Vercel preview deployment.
- [ ] 3.4 Add planned socket renewal around 240 seconds, automatic reconnect for earlier drops, and versioned snapshot recovery; verify two clients preserve the same room and game state through multiple renewals during a session longer than ten minutes.
- [ ] 3.5 Document the free-tier limits, recoverable quota errors, endpoint settings, consumer migration steps, and exact source references; verify documented commands and links.

## 4. Full verification and release gate

- [ ] 4.1 Run `npm ci`, `npm run typecheck`, `npm test`, and the client package dry-run after the shared-state and Vercel changes; verify existing game protocols and focused cross-instance tests pass.
- [ ] 4.2 Against the public Vercel production alias, verify health, create/share/auto-join/refresh for every coded game, cross-instance room continuity through multiple planned renewals in a session longer than ten minutes, unexpected-drop recovery, and measured free-tier use; do not release if any check fails or requires a paid tier.

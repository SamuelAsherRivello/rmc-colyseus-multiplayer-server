# Tasks

## 1. Standardize server admission and room lifecycle

- [x] 1.1 Add four-character code generation, requested-code creation, active-code uniqueness checks, clear conflicts/errors, and per-source admission throttling; verify malformed, duplicate, custom-code, and rate-limit cases with focused integration tests.
- [x] 1.2 Add room-level replacement of disconnected reservations and a 15-second empty-room grace; verify that code rejoin gets a fresh identity, preserves connected players and game state, rejects a full connected room, and expires an unreclaimed empty room.
- [x] 1.3 Apply the shared code and seat-replacement contract to Bomberman, Gungeon, Ring Rivals, and Street Fighter; update the in-progress `add-ring-rivals-game` delta and verify each coded game's admission and recovery integration tests.
- [x] 1.4 Preserve the published Bomberman client's six-character invite flow: generate six characters for Bomberman, accept both six- and four-character Bomberman codes, and verify generated, custom, and join paths.

## 2. Add shared client link support and documentation

- [x] 2.1 Add browser-safe helpers for suggested codes, reading the `room` URL parameter, and building share links while preserving other query parameters; verify helper behavior and existing `MultiplayerClient` API compatibility with client tests and package dry-run.
- [x] 2.2 Document the **Play Online** / **Join Room** / **Create Room** pattern and refresh behavior in the shared-client README; update the root Custom Shared Features row with links to the exact documentation section and admission/lifecycle source; verify every linked path and line anchor.

## 3. Future shared-state migration on free Vercel services (not the bounded release gate)

- [ ] 3.1 Find a first-party Vercel design that fits Hobby quotas, then prototype two independent function instances; verify atomic room-code admission, same-room join, ordered broadcasts, owner recovery, and reconnect behavior, and measure operations, bandwidth, and function usage for representative coded-game traffic. Stop this migration if consistency semantics or free quotas cannot support every coded game; do not add a third-party service or claim continuity from process-local state.
- [ ] 3.2 Implement shared room ownership, seat leases, state snapshots, and ordered message routing behind the existing room/client contract; add tests for concurrent code creation, cross-instance join, disconnect grace, and state restoration after forced socket replacement.
- [ ] 3.3 If the shared-state migration passes, remove Render-only Docker, Blueprint, and deploy-hook configuration while preserving the stable Vercel endpoint; verify local Node 24 operation and a Vercel preview deployment.
- [ ] 3.4 Add planned socket renewal around 240 seconds, automatic reconnect for earlier drops, and versioned snapshot recovery; verify two clients preserve the same room and game state through multiple renewals during a session longer than ten minutes.
- [ ] 3.5 Document the free-tier limits, recoverable quota errors, endpoint settings, consumer migration steps, and exact source references; verify documented commands and links.

## 4. Bounded current release and future migration gates

- [ ] 4.1 For one bounded release, run Node 24 `npm ci`, `npm run check:docs`, `npm run typecheck`, `npm test`, and the client package dry-run; stage the versioned production build without moving the stable alias. Against that staged build, verify exact health version, all registered games through the live-capable suite, and a two-client relay session for 240 seconds.
- [ ] 4.2 Promote only the tested deployment to the existing stable Vercel URL, verify its exact health version and two-client relay, then publish one matching GitHub release and client tarball. If alias verification fails, restore the prior deployment before reporting success. Existing consumers configured for this URL need no URL update.
- [ ] 4.3 Before a future shared-state migration is claimed, verify cross-instance create/join/reconnect, ordered state, multiple planned renewals over a session longer than ten minutes, unexpected-drop recovery, and measured free-tier usage for every coded game. Keep this future gate open until that evidence exists.

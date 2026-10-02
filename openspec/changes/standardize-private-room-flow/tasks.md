# Tasks

## 1. Standardize server admission and room lifecycle

- [x] 1.1 Add four-character code generation, requested-code creation, active-code uniqueness checks, clear conflicts/errors, and per-source admission throttling; verify malformed, duplicate, custom-code, and rate-limit cases with focused integration tests.
- [x] 1.2 Add room-level replacement of disconnected reservations and a 15-second empty-room grace; verify that code rejoin gets a fresh identity, preserves connected players and game state, rejects a full connected room, and expires an unreclaimed empty room.
- [x] 1.3 Apply the shared code and seat-replacement contract to Bomberman, Gungeon, Ring Rivals, and Street Fighter; update the in-progress `add-ring-rivals-game` delta and verify each coded game's admission and recovery integration tests.

## 2. Add shared client link support and documentation

- [x] 2.1 Add browser-safe helpers for suggested codes, reading the `room` URL parameter, and building share links while preserving other query parameters; verify helper behavior and existing `MultiplayerClient` API compatibility with client tests and package dry-run.
- [x] 2.2 Document the **Play Online** / **Join Room** / **Create Room** pattern and refresh behavior in the shared-client README; update the root Custom Shared Features row with links to the exact documentation section and admission/lifecycle source; verify every linked path and line anchor.

## 3. Move production to a long-lived Node host

- [x] 3.1 Add a Node 24 container/runtime entrypoint with health checks and single-process matchmaking configuration; verify the image builds and a local container accepts two clients into the same coded room.
- [ ] 3.2 Select and configure a long-lived production host, replace the Vercel-specific release/deploy workflow, and publish the new backend endpoint; verify the public health endpoint and a session that remains connected beyond five minutes.
- [ ] 3.3 Document endpoint migration and coordinate updates for coded-room consumers before retiring the old endpoint; verify each migrated consumer can create, share, auto-join, and refresh a room.

## 4. Full verification

- [x] 4.1 Run `npm ci`, `npm run typecheck`, `npm test`, and client package dry-run locally; verify all existing and new checks pass.
- [ ] 4.2 Verify the health endpoint, five-minute session, private-room flow, and regression suite against the selected long-lived public endpoint.

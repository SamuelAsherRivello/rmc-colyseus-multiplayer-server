# Proposal

## Why

Private-room codes previously differed in length, admission behavior, reconnect handling, and consumer UI. The standardized local implementation is ready for a bounded Vercel Hobby release to the existing server URL. Shared authority across Vercel function instances is still unproven and remains a separate future migration.

## What Changes

- Use four uppercase alphanumeric characters (`A-Z` and `0-9`) for Gungeon, Ring Rivals, and Street Fighter. Preserve the published Bomberman client's six-character invite flow by generating six-character Bomberman codes and accepting either four or six there.
- Support an editable, prefilled code when creating a room; reject occupied codes clearly and never silently join an existing room when creation was requested.
- Standardize the consumer flow: **Play Online**, then a code field with **Join Room** and **Create Room**; after creation, show a copyable link containing the room code in the `room` query parameter.
- Keep a room code and game state available while any player is connected, allow a refresh or dropped connection to rejoin with a fresh identity, and expire an empty room after a short grace period.
- Keep server source in the GitHub repository and deploy it to Vercel Hobby (free) through the repository integration and the existing release workflow.
- Release the current process-local Colyseus server on Vercel Hobby for sessions verified within a four-minute test window, before Vercel's 300-second Function limit. Preserve the current game and client protocols; do not claim that room state survives process replacement or a reconnect routed to another instance.
- Use only the existing free GitHub access and Vercel Hobby account. Do not add an external host, database, realtime provider, paid tier, or automatic overages.
- Gate this bounded release on clean local checks, a staged production deployment, live tests for every registered game, a two-client four-minute relay session, explicit promotion to the existing stable URL, and health plus relay checks on that URL. Publish one GitHub release only after deployment verification succeeds.
- Keep the cross-instance create/join/reconnect and quota proof as a separate gate for any future shared-state migration. Its failed or missing proof does not certify that feature and does not block this explicitly bounded release.
- Document the hosting limits and the exact source, client, and admission code references.

## Capabilities

### New Capabilities

- `private-room-flow`: Standard room-code creation, joining, URL sharing, reconnect, and active-room lifecycle behavior for private-code games.
- `vercel-multiplayer-hosting`: Free Vercel-hosted, process-local WebSocket sessions with an explicit current release gate and a separate future shared-state gate.

### Modified Capabilities

- `street-fighter-duels`: Use four-character codes for new invites and permit room-code recovery of disconnected seats with a fresh identity while retaining short automatic same-seat recovery.

## Impact

- Shared client and its documentation: `multiplayer-server/packages/client/`.
- Admission, room lifecycle, and hosting adapter: `multiplayer-server/src/`, root `server.ts`, and `vercel.json`.
- Leave historical Render configuration outside this bounded release; remove it only with a separately verified hosting migration.
- Tests: existing room lifecycle and game regressions, staged live integration, four-minute relay, and stable-alias checks. Cross-instance admission/state and free-quota proofs remain future work.
- Documentation: root `README.md`, shared-client README, and the Ring Rivals planning artifacts.
- Release and deployment: keep the npm client tarball name and public API; deploy from GitHub to the existing Vercel project and use only the current free GitHub and Vercel accounts.

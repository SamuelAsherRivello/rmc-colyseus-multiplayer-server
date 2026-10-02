# Design

## Context

The server currently serializes room admission in `multiplayer-server/src/server.ts`, but code generation and lookup are split between the general code-room path and Street Fighter's token map. Bomberman and Ring Rivals keep a dropped seat for 15 seconds; Street Fighter keeps a token-bound seat for 15 seconds; Gungeon removes a dropped player and retains its room only while Colyseus keeps the room alive. The shared client stores room options in memory and exposes `state.code`, but consumers currently implement URL parsing and UI themselves. Production runs through a Vercel serverless adapter with a 300-second function limit, while room state is in memory.

See `proposal.md` for motivation and the spec deltas for observable requirements.

## Goals / Non-Goals

**Goals:**

- Give new private rooms a consistent four-character code and support a code chosen in the room form.
- Give consumers shared helpers and a documented pattern for creating, joining, copying, and auto-joining room links.
- Allow a code holder to replace a disconnected seat with a fresh identity without changing connected players' state; keep that seat claimable for as long as any player remains connected.
- Keep rooms available while a player is connected and for the existing 15-second recovery grace after an unconsented drop, including when the solo host refreshes.
- Run one authoritative Node process on a long-lived host to avoid serverless duration limits and cross-instance room splits.

**Non-Goals:**

- Restoring in-memory game state after a process crash or deployment restart.
- User accounts, permanent player identity, or storage for rooms after the empty-room grace expires.
- Changing game simulations, round rules, capacity, or player-seat order.
- Implementing each consumer game's bespoke **Play Online** screen in this server repository; the shared package documentation will specify that pattern and its integration points.

## Decisions

### Normalize private-room admission in the existing server endpoint

Keep `POST /api/join/:game` and the existing `{ create, code }` request shape. For a create request, validate and reserve an optional requested code or generate one using cryptographic random bytes and an unbiased mapping to the 36-character alphabet. Keep the existing serialized admission queue so concurrent creates cannot claim the same code. Uniqueness is per game because the game route scopes lookup; creating a room with an occupied code returns a conflict instead of joining it. Private-room joins accept exactly four-character codes after migration.

The endpoint remains the source of truth for whether a requested code is free. A client-side suggested code is not a reservation: if another player claims it first, creation returns a specific conflict and the UI lets the user edit or regenerate it. Rate-limit repeated code lookups per source to reduce enumeration of the 36^4 code space. Keep this limiter in process memory alongside the current single-process matchmaking model.

### Add browser-safe room-link helpers without changing the existing client API

Add shared helpers to generate a suggested code, read the `room` query parameter, and build a room URL while preserving existing query parameters such as `mode=online`. The helper accepts a URL string so tests and non-browser consumers do not need a global `window`. Keep `MultiplayerClient(endpoint, game, options)` and `state.code`; an updated consumer reads `room` before choosing its initial screen, connects immediately when a code is present, and otherwise presents **Play Online** followed by the code field and **Join Room** / **Create Room** actions. After successful creation, the consumer uses the returned `state.code` to create the copyable URL.

This keeps room-link behavior in the shared client contract while leaving game-specific rendering and launch behavior with each consumer. The package documentation and root feature catalog will link directly to these helpers and the server admission path.

### Reclaim offline seats with a new identity

Keep current 15-second same-identity SDK recovery for a dropped connection where the same client instance retries automatically. A distinct code-based join may replace that client's disconnected reservation with a fresh identity; keep the vacant seat claimable by code while another player remains connected, even after automatic recovery expires. Never replace a connected seat. Keep each game's existing state machine in its room class; the shared admission path only chooses the room and clears the inactive reservation through a room-level operation.

Use a 15-second empty-room grace so a solo host can refresh and rejoin from the URL. If someone reconnects during the grace, cancel disposal. An explicit leave by the last player or expiry of the empty-room grace disposes the room. A process loss still clears room state and returns the normal expired/unavailable result.

### Run one long-lived authoritative Node process on Render

Package the existing Node 24 server as a Render Docker web service. The checked-in Blueprint selects one Frankfurt instance on the always-on `0.5c-512mb` plan, turns off automatic deployment, and uses the container health endpoint. Run one service instance because `matchMaker` metadata, invite indexes, rate limits, and room state are process-local. Do not add multi-instance routing or shared persistence in this change. The release workflow deploys through a GitHub Actions deploy-hook secret and verifies the service URL stored as a repository variable; both values must be configured after the Render service is provisioned.

The existing backend hostname is Vercel-owned and cannot itself become a long-lived process. The migration must publish a stable endpoint for the new host and update the consumers that use the old endpoint before retiring it. The public client tarball name and constructor API remain unchanged.

## Risks / Trade-offs

- **Four-character codes are guessable** → Apply per-source request throttling and return retryable responses; codes remain room invitations, not user authentication.
- **Two clients can race for a suggested code** → Serialize create checks and report code-in-use without silently joining another room.
- **A code-based rejoin replaces an offline reservation** → Require possession of the room code, preserve connected seats, and invalidate the replaced identity/token.
- **The service is single-instance and process-scoped** → This removes current function timeouts and split room indexes but does not survive process loss; surface room-unavailable feedback and let players create a new room.
- **Changing the server hostname requires coordinated consumer updates** → Keep the old endpoint active during migration, update all coded-room consumers to the new endpoint, run public integration checks, then retire Vercel deployment.
- **Host vendor and production credentials are not known in the repository** → Resolve provider and endpoint before enabling the deployment job; local packaging and service checks remain host-independent.

## Migration Plan

1. Add and verify the shared room-code/link helpers, admission changes, and room-lifecycle tests locally.
2. Build a Node 24 container/runtime configuration and verify health and WebSocket admission on a single process.
3. Select/configure a long-lived host, deploy a candidate endpoint, and run the private-room and full regression suites against it.
4. Release the shared client and update coded-room consumers to use the candidate endpoint and common link flow.
5. Retire the Vercel serverless deployment only after consumers use the new endpoint.

Rollback sends consumers back to the previous client version and endpoint. Rooms created during the migration are in-memory and will end when the host process is switched; the UI must report that the room expired so players can create another.

## Open Questions

- The Render service's generated `onrender.com` URL and deploy-hook URL are operational setup inputs. Record them in GitHub Actions as `RENDER_SERVICE_URL` and `RENDER_DEPLOY_HOOK_URL`; do not commit the deploy hook.

# Design: Shared server for Street Fighter II duels

## Current verified architecture

The Vercel entry point registers isolated Colyseus rooms from a game-key map. `POST /api/join/:game` serializes room creation and obtains a seat reservation. The browser-safe racing simulation already lives in the released client package and is imported directly by its server room. Gungeon provides a separate code-based admission route. Client reconnect otherwise creates a fresh identity. The service stores rooms in memory and can lose sessions or route requests across instances.

## Proposed architecture

- Add `street-fighter-ii` to the room registry and implement `POST /api/join/street-fighter-ii` with create, code join, and token-based recovery options. Room names and code metadata stay private to this key.
- Add an exported browser-safe `StreetFighterSimulation` module in `@rmc/multiplayer-client/street-fighter`. The server room imports it directly, matching the existing racing package pattern. The game client can run the same deterministic rules locally and compare its presentation with authoritative snapshots.
- Keep connection identity separate from Colyseus session IDs. The room generates an unguessable recovery token, binds it to a seat, returns it only to that client, and replaces the session binding when the same token reconnects within 15 seconds. Snapshots never include recovery tokens.
- Validate at most 60 messages per second per session; accept monotonically increasing bounded sequence numbers and a fixed input shape. Do not accept client positions, damage, health, or outcome fields.
- Simulate at 60 fixed steps per second and broadcast compact snapshots at 20 Hz. Stop movement when an input expires. Reserve disconnects for 15 seconds before removing the seat.
- Keep the existing Gungeon private-code path, generic matchmaking protection, shared client root export, and all other room implementations unchanged.

## Verification and release

Add unit checks for input bounds, attacks, blocks, trades, timeout, round/match transitions, seat capacity, code isolation, disconnect/reclaim/expiry, and forged state. Add a two-client live probe to the deployment workflow. Run Node 24 `npm ci`, typecheck, and the complete suite; then release a new compatible client tarball and deploy the backend with the existing Release workflow.

## Limits

This uses the existing in-memory Vercel deployment. A process restart, function duration, or split instance can interrupt an active duel; the 15-second token only supports recovery while that room still exists. Durable identity, cross-instance storage, and ranked matchmaking are outside this change.

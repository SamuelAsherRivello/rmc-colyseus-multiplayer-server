# Design

## Context

The server runs Colyseus rooms from `multiplayer-server/src/server.ts`, reserves private coded rooms through `/api/join/:game`, and packages `multiplayer-server/packages/client`. Bomberman currently demonstrates a 15-second same-session recovery room, but the shared SDK reconnect is opted into only for that game. Room simulation and messages remain game-specific.

## Goals / Non-Goals

**Goals:**
- Add isolated `ring-rivals` authority and reuse the existing private code admission path.
- Preserve default reconnect behavior for every other game.
- Ensure a successful server release contains a packaged client with explicit recovery support.

**Non-Goals:**
- Reworking generic client lifecycle or changing existing game payloads.
- Persisting matches across process resets or adding account identity.

## Decisions

- Add a pure deterministic `RingRivalsSimulation` and a thin Colyseus room adapter. Process inputs on the room's fixed 30 Hz simulation interval and publish full snapshots at 20 Hz.
- Use the existing serialized code reservation helper, restricting max room size to two in the room. Validate input shape/action and per-client rate limits before passing to simulation.
- Use Colyseus `allowReconnection(client, 15)` as the single-use room seat recovery mechanism, matching current Bomberman behavior. On drop, neutralize the boxer and freeze the round clock; on expiry, forfeit/remove the disconnected seat.
- Make the shared SDK recovery opt-in by explicit game key, without changing its public default or another game's behavior.
- Update the live deployment probe with Ring Rivals-specific room admission/state assertions before releasing. Preserve unrelated OpenSpec changes and consumers.

## Risks / Trade-offs

- [Deployments restart in-memory rooms] → keep that separate from bounded socket recovery and document ephemeral matches.
- [Private codes race room admission] → reuse the serialized reservation helper and test full/expired paths.
- [Shared release can regress other games] → run the complete existing unit/integration suite and release only scoped changes.

## Migration Plan

Add the isolated server game, update package/docs/tests, run full validation, commit/push the branch through the existing release workflow, and verify the published package, service health, and two-client public room before the client pins the exact package.

# Proposal

## Why

The shared multiplayer service cannot currently host Neon Breaker Duo. A separate authoritative room and client game contract are needed so two anonymous players can share one brick-breaker match without affecting other games.

## What Changes

- Add the isolated `neon-breaker-duo` game key and a two-seat room.
- Simulate paddle input, balls, bricks, score, lives, three waves, powerups, and match transitions on the server.
- Provide complete snapshots for new clients, safe departure handling, launch/restart messages, and validation coverage.
- Document the client contract, supported-game registry, and development status; extend live verification for the new game.

## Capabilities

### New Capabilities
- `neon-breaker-duo-room`: authoritative two-player cooperative brick-breaker sessions.

### Modified Capabilities
- None.

## Impact

Adds isolated server and test modules under `multiplayer-server/src` and `multiplayer-server/test`, registers the game in `src/server.ts`, and updates the client API/consumer registry documentation. No existing game protocol changes.

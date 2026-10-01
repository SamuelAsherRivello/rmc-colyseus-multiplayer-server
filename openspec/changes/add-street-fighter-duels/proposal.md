# Proposal

## Why

The shared service has no isolated realtime duel protocol for the new Street Fighter II clone. A two-seat authoritative room lets two players share match outcomes while preserving the existing room contracts and bounded recovery behavior.

## What Changes

- Add a private `street-fighter-ii` room key with a six-character invite code, two seats, fighter selection, ready/countdown, combat, round/match results, and rematch.
- Add a browser-safe deterministic combat module to the shared client package and run that simulation authoritatively on the server.
- Validate input shape, sequence numbers, rate limits, and supported fighters; ignore client-supplied positions, health, hits, or match outcomes.
- Keep a disconnected seat for 15 seconds and allow its generated reconnect token to reclaim the same seat and match state.
- Document the protocol and Vercel in-memory session limits; add focused rules/integration checks and a live two-client deployment check.

## Capabilities

### New Capabilities
- `street-fighter-duels`: private two-player arcade matches with server-owned combat and bounded same-seat recovery.

### Modified Capabilities
- `gungeon-coop`: no requirement change. Its existing coded-room contract informs admission design, but the fighter protocol remains isolated.

## Impact

- Server: `multiplayer-server/src/server.ts`, new room and simulation registration, shared client rules export, room tests, live deployment checks, registry and docs.
- Compatibility: additive room key and client subpath; existing endpoints and exported APIs remain unchanged.
- Release: shared client and server are released together through the existing workflow; client consumers pin the exact release tarball.

# Proposal

## Why

Just Like Rabbits needs a small shared observation room whose simulation remains with a participant even when the current host disconnects. The relay needs a reusable host-election primitive and an isolated game contract before a browser client can safely rely on it.

## What Changes

- Add a reusable participant-host lifecycle: ordered eligibility, liveness loss, transferable-state handoff, and longest-connected successor election.
- Register the `just-like-rabbits` game with a twelve-participant relay room, ephemeral fictional identities, colour-only cursor relay, ordered host actions, and current-state snapshots.
- Extend the shared browser client documentation and tests for the new session contract while preserving all existing room protocols.
- Document a versioned, additive server/client release requirement and the in-memory-session interruption behavior of a deployment.

## Capabilities

### New Capabilities

- `participant-host-relay`: Relay behavior for deterministic participant-host election, liveness, and state transfer that game rooms can reuse.
- `just-like-rabbits-session`: The isolated multiplayer habitat room's admission, presence, action validation, and snapshot contract.

### Modified Capabilities

- None.

## Impact

Updates the Colyseus game registry, room implementation, shared client API documentation, integration tests, package release metadata, and game registry documentation. Existing game keys and public client methods remain compatible.

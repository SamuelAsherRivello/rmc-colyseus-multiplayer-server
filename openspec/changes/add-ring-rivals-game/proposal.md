# Proposal

## Why

Ring Rivals needs an isolated authoritative online boxing room with private invite codes and two-player-only capacity. The shared client must recover an unexpectedly disconnected player to the same seat for 15 seconds without affecting existing game protocols.

## What Changes

- Register a `ring-rivals` private room with six-character codes and capacity two.
- Add server-authoritative boxing state, bounded action input, 60-second rounds, score, knockouts, draw rules, and room-isolated snapshots.
- Enable same-session SDK reconnect for this room with a 15-second grace period and paused round timer.
- Publish the shared-client package and backend release, update registry/API docs and deployment/live integration coverage.

## Capabilities

### New Capabilities
- `ring-rivals-boxing`: Private room admission, boxing simulation, outcomes, and bounded seat recovery.

### Modified Capabilities
None.

## Impact

Changes affect the server game registry and join endpoint, a new server room/simulation, the shared client package, integration tests, deployment probe, README, game registry docs, and published npm/GitHub/Vercel releases. Existing game APIs and room keys remain unchanged.

# Proposal

## Why
Dust Circuit Rally needs authoritative four-truck racing on the existing shared backend, with a reusable simulation for offline play and prediction.

## What Changes
- Register isolated `dust-circuit-rally` admission with four human seats.
- Add waiting/ready, countdown, racing, results and replay with authoritative movement, terrain, checkpoints, pickups and AI.
- Publish track and simulation as additive shared-client exports; preserve all existing consumers.
- Test rules, synchronization, late join, disconnect substitution, fresh reconnect, capacity and isolation locally and on the deployed release.

## Capabilities
### New Capabilities
- `dust-racing`: independent arcade races and temporary anonymous session lifecycle.
### Modified Capabilities
None.

## Impact
New simulation and track modules in the shared client package, new server room, registry/docs, rule and live-capable integration tests. Existing hosting duration and in-memory reset constraints apply. Client release depends on successful backend deployment.

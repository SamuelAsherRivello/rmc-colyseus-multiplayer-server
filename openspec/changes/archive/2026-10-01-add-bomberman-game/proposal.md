# Proposal

## Why
The Bomberman consumer needs isolated authoritative private rooms and bounded identity recovery on the shared service.

## What Changes
- Register bomberman with four seats, code admission, lobby/countdown, validated inputs and authoritative arena outcomes.
- Export deterministic rules in the shared browser package and enable Bomberman-only SDK recovery.
- Add rule/integration regressions, registry/docs and live deployment coverage; preserve every existing game including concurrent Neon Breaker changes.

## Capabilities
### New Capabilities
- `bomberman-sessions`: private room authority and recovery.
### Modified Capabilities
None.

## Impact
Room/simulation, admission routing, additive client export/lifecycle, tests and documentation. Release target 0.9.0 follows concurrent 0.8.0. Existing Vercel five-minute host resets remain distinct from bounded disconnect recovery.

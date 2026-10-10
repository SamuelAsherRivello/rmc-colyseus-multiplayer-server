# Proposal

## Why
Combat Clone needs authoritative four-tank rooms and a released shared prediction contract. Extend the existing server additively before the game client is created.

## What Changes
- Isolated private `combat` rooms, four stable slots, 1–4 humans and CPU fill.
- Shared browser-safe movement/arenas/projectiles and server-only seeded Low/Medium/High CPU brains.
- One-hit respawns, Classic/Ricochet, 136-second scoring, draws and reflected self-hit penalties.
- Bounded sequenced controls, 20 Hz snapshots, same-session 15-second recovery and waiting admissions.
- Additive package export, regression/live probes, release and existing Vercel deployment.
- Retain process-local best-effort sessions as explicitly accepted for this game. Do not complete or alter the separate unfinished hosting migration.

## Capabilities
### New Capabilities
- `combat-matches`: shared movement, arenas and authoritative scoring.
- `combat-sessions`: four-slot private rooms, fair CPU decisions and bounded recovery.
### Modified Capabilities
None. Existing game protocols remain compatible.

## Impact
`multiplayer-server/src`, shared client package, tests, registry/READMEs and deployment verification. Existing credentials/workflows deliver the new release; no new provider or datastore.

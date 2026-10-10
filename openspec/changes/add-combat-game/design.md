# Design
## Context
Extend the existing Colyseus 0.17 private-room architecture. The user explicitly authorized game delivery and accepted the current Vercel process-local session limitations. Do not alter the separate hosting migration. Preserve unrelated Tetris, Music and Asteroids changes in this shared checkout.
## Goals / Non-Goals
Four stable free-for-all tanks, equal CPU/human physics, authoritative outcomes and additive shared prediction rules. No persistence, cross-instance continuity, new host or datastore.
## Decisions
- Protocol, snapshots and shared rules version 1. Input `{seq,drive,turn,fire}` only. Timestamps are simulation seconds; coordinates are pixels; angles radians. No client position/damage/score authority.
- 60 Hz fixed simulation with monotonic elapsed-time accumulator capped at 250 ms per timer; snapshots 20 Hz. Latest controls expire after 300 ms. Acknowledgements include sequence and tick.
- Exactly four numbered tanks separate from connected/recovering/waiting human reservations. Midmatch arrivals reserve seats but observe until next ready-gated match. One controller per slot. Host is oldest connected human.
- One-hit destruction, 0.6 s respawn, 1 s shield ending on fire. 136 s active clock; +1 opponent, -1 reflected owner hit clamped at zero. Collect swept impacts before destruction cleanup, permit mutual hits and deterministic earliest impact/shot-id attribution. Tied leaders draw. Results freeze until all connected humans ready; reset controls, scores and shells with 3 s countdown.
- Shared `./combat` package export contains arenas, tuning, movement, swept shell collisions and finite clearance navigation. Server-only independent seeded CPU brains use current visible state and bounded observation periods/path and bank-shot searches. Difficulty never changes tank statistics.
- Combat never participates in anonymous generic code-based recovery seat replacement. SDK recovery retains same session for 15 s while bots take over. Zero humans suspend simulation and expire after grace.
- Original Open Yard/Crossroads/Switchback geometry, 320x240 bounds, 16-frame art is a client responsibility. Equal spawn safety and bounded shell population are server responsibilities.
## Risks / Trade-offs
Process-local routing, replacement and socket-age can lose rooms and scores. UI must offer recreation rather than imply durable recovery. Concurrent projects share checkout; commit only Combat hunks/files and revalidate main before release.
## Migration Plan
Add rules/simulation/room, compatible SDK support and package export; run deterministic tests and integration/regressions; release through checked-in staged Vercel workflow with live probes and rollback. Pin the resulting asset in the game only after public verification.
## Open Questions
None blocking. User selected all match policies and authorized shipping; tuning is documented as adaptation rather than historical source fact.

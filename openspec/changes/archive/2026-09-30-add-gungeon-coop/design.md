# Design
## Context
Existing server runs independent Colyseus rooms on Vercel, with snapshot gameState and fresh reconnect. Sessions can reset after the hosting duration (~five minutes).
## Goals / Non-Goals
Goals: Server-owned combat and 1–4-player cooperative progression with reusable coded admission.
Non-Goals: Accounts or durable runs; existing games retain current admission.
## Decisions
Use a 30Hz bounded simulation and 20Hz JSON snapshots, reusing the shared client. Input expires after 300ms. Six-character room codes identify independent instances; invalid/missing join codes fail rather than entering another room. Creation assigns a random code. Hot join starts with spawn protection; departure removes owned shots and rescales subsequent spawns and active enemy damage. Three weapons: pulse pistol, scatter gun, burst carbine. Shared loot grants each player an upgrade choice between waves. Boss every fifth wave. Standing near a fallen ally revives after two seconds. Team defeat allows lowest-seat restart. Local pause zeros input while teammates continue.
## Risks / Trade-offs
In-memory hosting interruptions → clear reconnect state, documented limits, reconnect to same code if it still exists; expired codes report an explicit error. Maximum projectiles and enemy counts bound snapshots.
## Migration Plan
Add compatible optional admission options; release server/client 0.7.0, verify all existing tests plus coded dungeon sessions, then pin the released client in the landscape frontend. Rollback uses existing deployment workflow.

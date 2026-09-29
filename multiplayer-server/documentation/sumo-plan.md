# Sumo Battle implementation plan

Game key: `sumo-battle`. Capacity: 12 human players; one server-controlled training opponent only when exactly one human is connected. Competitive free-for-all, first to three credited ring-outs. Original three-quarter 3D presentation in the consuming Babylon Lite client.

Server owns fixed-step movement, dash cooldown, collision impulses, recent-hit attribution (four seconds), ring-outs, safe respawns, scores and winner. Inputs contain bounded x/z axes and a dash boolean; never positions or scores. Idle input expires after 300ms. A fall without a recent attacker awards no point. After victory, the server starts a new match after eight seconds. Local pause only clears input. Leaving removes the wrestler; fresh reconnect gets a new identity and score. No client may reset the shared match.

Shared client adds generic `gameState` snapshot/event support while retaining drawing APIs. Use the existing serialized admission route, anonymous identity/seat conventions, status, retry, subscription and teardown. Snapshot includes players, capacity, empty strokes for backward compatibility, and gameState. Broadcast state at 20Hz; simulate at 30Hz. Game rooms remain isolated.

Acceptance: deterministic movement, collision/attribution, self-fall, first-to-three and replay tests; two-client state sync, late join, departure, reconnect, 12/13 capacity and isolation integration tests; drawing regressions; typecheck; package check; release 0.2.0, deployment and live tests. Vercel sessions can terminate around five minutes and state is not durable.

- [x] Authoritative simulation and isolated room
- [x] Compatible shared client state support
- [x] Unit and multiplayer integration coverage
- [x] Documentation and deployment verification wiring
- [ ] Release and live verification


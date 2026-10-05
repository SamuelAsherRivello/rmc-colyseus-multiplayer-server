![Samuel Asher Rivello](multiplayer-server/documentation/samuel-asher-rivello-banner.png)

# RMC Colyseus Multiplayer Server

Rivello Multimedia Consulting (RMC), led by [Samuel Asher Rivello](https://www.samuelasherrivello.com/) created this relay server using Colyseus as a prototype backend for new multiplayer games.

## Live Demos

This repository provides the shared multiplayer service and has no standalone demo. Play the projects that use it:

- [**Bomberman Clone**](https://samuelasherrivello.github.io/babylon-lite-bomberman-clone/) — private competitive bomb arena; multiplayer integration in development.
- [**Dust Circuit Rally**](https://samuelasherrivello.github.io/babylon-lite-super-offroad-clone/) — race four off-road trucks in a fixed-camera landscape circuit with solo, local and online modes.
- [**Enter the Gungeon Clone**](https://samuelasherrivello.github.io/babylon-lite-enter-the-gungeon-clone/) — survive bullet waves together in private 1–4-player rooms with dodge rolls, upgrades and revives.
- [**Garden Chat**](https://samuelasherrivello.github.io/babylon-lite-garden-chat/) — wander a shared garden and chat with other visitors.
- **Just Like Rabbits** — shared rabbit observation habitat with participant-host migration. (In development.)
- [**Gauntlet Clone 2D**](https://samuelasherrivello.github.io/babylon-lite-gauntlet-clone-2d/) — cooperate to battle monsters, revive allies, and escape a tile-based dungeon.
- [**Gauntlet Clone 3D**](https://samuelasherrivello.github.io/babylon-lite-gauntlet-clone-3d/) — team up to destroy summoning altars and escape a 3D dungeon.
- [**Multiplayer Draw**](https://samuelasherrivello.github.io/babylon-lite-multiplayer-draw/) — draw together from separate computers or browser tabs.
- [**Neon Breaker Duo**](https://samuelasherrivello.github.io/babylon-lite-arkanoid-clone/) — co-operate to clear a neon brick field together. (In development)
- [**Ring Rivals**](https://samuelasherrivello.github.io/babylon-lite-ring-rivals/) — fight private online 1v1 boxing bouts from mirrored opponent-focused views. (In development)
- [**Street Fighter II Clone**](https://samuelasherrivello.github.io/babylon-lite-street-fighter-clone/) — challenge a friend to an authoritative two-player arcade duel.
- [**Sumo Battle**](https://samuelasherrivello.github.io/babylon-lite-sumo-battle/) — push opponents out of the ring in an online sumo arena.

Whenever a new game updates this server, add or update its demo bullet here and its entry in the supported game registry, keeping the demo list in alphabetical order by game name.

See the [supported game registry](multiplayer-server/documentation/games.md) for room keys and client versions.

## Table of Contents

1. [Live Demos](#live-demos)
2. [Getting Started](#getting-started)
3. [Project Details](#project-details)
4. [Credits](#credits)

## Getting Started

### 🛠 Build, Verify, and Run Project

Run the following commands from the repository root. TypeScript is checked without emitting a separate build; tsx runs the source locally.

Use Node 24 and npm:

```sh
npm ci
npm run typecheck
npm test
npm run dev
```

Local Node execution defaults to port 2567; override `PORT`. The Render-compatible Docker image defaults to port 10000. Tests start their own server on 2678.
Set `SERVER_URL` before `npm test` to run the same ownership, late-join, cleanup, fresh-reconnect, seat-reuse, and capacity checks against a live server. Live integration checks need an otherwise empty drawing session.

### 🛠 Release Version

The root `package.json` is the version source. Run the **Release** workflow with a new semantic version. It checks the configured Render service, tests, sets root/client versions, publishes a tagged GitHub Release with the client tarball, and calls **Deploy backend release**. Deployment verifies the selected source, triggers Render, checks the public health version, runs the full suite against the public endpoint, and keeps two WebSocket clients active for six minutes. To deploy manually, dispatch **Deploy backend release** with a tag that points to the current `main` commit.

The checked-in `render.yaml` configures one always-on 0.5 CPU / 512 MB web service in Frankfurt with the health endpoint and a five-minute shutdown grace. Render currently lists this compute plan at $7/month. Provision the service from the Blueprint, then configure the repository `RENDER_DEPLOY_HOOK_URL` secret and `RENDER_SERVICE_URL` variable in GitHub Actions before releasing. The workflow never prints the deploy hook. Do not commit credentials.

## Project Details

### 📝 Structure

```text
multiplayer-server/
├── src/                 # Colyseus server and game rooms
├── test/                # Integration checks
├── packages/client/     # Reusable browser client and API README
└── documentation/       # Game registry and hosting evidence
scripts/                 # Release tooling and hosting probes
.github/workflows/       # Verification, release, and deployment
server.ts                # Thin Node/Vercel entry point
package.json             # Root npm commands and release version
```

Run commands from the repository root. The Render container starts `server.ts` as a long-lived Node process. The thin Vercel adapter and its config remain available for the old endpoint during consumer migration.

### 📦 AI

[AGENTS.md](AGENTS.md) documents the layout, verification commands, and consumer-link conventions. The README and layout follow the supplied Multiplayer Draw reference, adapted for a shared backend.

### 📦 Packages

- [Colyseus](https://colyseus.io/) — rooms, admission, and realtime messaging.
- [Express](https://expressjs.com/) — HTTP health and join endpoints.
- [Shared multiplayer client](multiplayer-server/packages/client/README.md) — status, identity, occupancy, game messages, and reconnection.
- [TypeScript](https://www.typescriptlang.org/) and tsx — type checking and local execution.

### Custom Shared Features

| # | Name | Comment |
|---:|---|---|
| 1 | Hot join / hot drop | Automatic anonymous admission; remove departed presence and game-owned artwork after disconnect detection. |
| 2 | Player identity | Lowest free ordered seat; fresh session ID, server-generated deterministic name/color; existing seats remain unchanged. Active colors are distinct. |
| 3 | Shared client | `MultiplayerClient` exposes status, session ID, room ID, players, occupancy, retry, game messages, and subscription/teardown. |
| 4 | Admission and capacity | One room per game within the running instance; capacity 12 for drawing; full status with explicit retry and no normal overflow room. Direct drawing matchmaking is blocked. |
| 5 | Fresh reconnect | Exponential retry remains capped at 15 seconds. Automatic SDK recovery keeps its session identity where supported; opening a coded room link creates a fresh identity and restores the vacant seat. |
| 6 | Coded-room recovery | Automatic same-session recovery lasts 15 seconds; a room-code join can reclaim the disconnected seat with a fresh identity while any player remains in the room. |
| 7 | Private Street Fighter duels | Two-seat invite rooms, per-seat reconnect tokens, authoritative 60 Hz combat, and 15-second recovery; rooms and invites are in-memory and can end on process loss. |
| 8 | Drawing relay | Normalized strokes/cursors, active-stroke snapshots for late joiners, whole-stroke ownership enforcement, departure cleanup. |
| 9 | Coded private rooms | Four-character editable room codes, create/join/share links, URL auto-join, room-code seat recovery while anyone remains connected, and a 15-second empty-room refresh grace. See [the workflow guide](multiplayer-server/packages/client/README.md#coded-private-room-workflow), [admission and seat replacement](multiplayer-server/src/server.ts#L39), and [room recovery lifecycle](multiplayer-server/src/private-code-room.ts#L14). |

**Future feature: `persistent-user-rejoins`.** Not implemented. Every reconnect and refresh creates a fresh user, and previous artwork is removed.

New games should review this catalog and [the game registry](multiplayer-server/documentation/games.md). Add broadly useful lifecycle/UI support to the shared client, document it here, and pin its release in each consumer. Use a smaller capacity when gameplay requires it.

### Shared Client API

See [package documentation](multiplayer-server/packages/client/README.md). Build locally with
`npm pack ./multiplayer-server/packages/client --pack-destination artifacts` after creating the artifacts directory.

After release, install the exact asset URL:

```sh
npm install https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/releases/download/v0.1.0/rmc-multiplayer-client-0.1.0.tgz
```

The v0.1.0 asset is published and consumed by Multiplayer Draw. Commit the consumer lockfile. The client needs only the public backend URL, never a server deployment credential.

HTTP: `GET /api/health`; `POST /api/join/multiplayer-draw` returns a Colyseus seat reservation or 409 when full. Unknown games return 404; transient admission failures return 503. WebSocket messages are documented in the package. Drawing is limited to 100 strokes and 10,000 points per player, 2,048 points per stroke, and 64 points per batch. Erase strokes to reclaim space.

### Hosting Limits

The Render Blueprint configures one authoritative process so the in-memory room index and matchmaking state stay together. Render does not impose a fixed WebSocket duration, but connections end when the instance is replaced, including during deploys or platform maintenance. The server does not restore room state after process loss. Players can use the room link to rejoin while the room still exists; a fresh process requires a new room. See [Render WebSocket behavior](https://render.com/docs/websocket) and the [recorded hosting evidence](multiplayer-server/documentation/feasibility.md).

### Additive release policy

Games may add isolated room keys and additive shared-client capabilities after the full server regression suite passes. A deployment can interrupt active in-memory rooms, which is an accepted temporary limitation; compatible existing games reconnect using their existing protocol. Update another game only when a targeted compatibility check identifies an actual contract change, not merely because a new game was added.

There is no durable storage, account system, or separate lobby service. Keep the old Vercel endpoint running until every coded-room consumer has moved to the Render endpoint and passed its public checks.

## Credits

### 💡 Contributors

- Samuel Asher Rivello — Rivello Multimedia Consulting.

### 💡 Contact

- [LinkedIn](https://www.linkedin.com/in/SamuelAsherRivello/)
- [GitHub](https://github.com/SamuelAsherRivello/)
- [Portfolio](https://www.samuelasherrivello.com/)

### Sumo Battle

[Sumo Battle](https://samuelasherrivello.github.io/babylon-lite-sumo-battle/) ([source](https://github.com/SamuelAsherRivello/babylon-lite-sumo-battle)) adds a server-authoritative 1–12 player ring-out arena. The `sumo-battle` game uses a separate room with fixed-step movement, collision impulses, bounded inputs, dash cooldowns, ring-out credit, safe respawns, first-to-three victory and automatic replay. Solo sessions have a labeled AI opponent. The shared 0.2.0 client adds generic `gameState` while preserving 0.1.0 drawing behavior. See the [client contract](multiplayer-server/packages/client/README.md#sumo-battle-shared-client-020).

`npm test` now runs drawing regressions, deterministic sumo rule tests and sumo integration (sync, authority, late join, bot, 12/13 capacity, departure, reconnect and game isolation). Live tests require otherwise empty drawing and sumo sessions. Deployment runs these checks against the public backend and rolls back on failure. No persistent scores; hosting interruptions reset in-memory matches.
## Garden Chat
[Garden Chat live demo](https://samuelasherrivello.github.io/babylon-lite-garden-chat/) adds a 12-player social garden with authoritative movement, bumping and bounded session chat history. See the game registry and shared client API. `npm test` also verifies garden synchronization, admission, chat, bounds and isolation locally or against SERVER_URL.

## Gauntlet 3D

[Gauntlet Clone 3D](https://samuelasherrivello.github.io/babylon-lite-gauntlet-clone-3d/) ([source](https://github.com/SamuelAsherRivello/babylon-lite-gauntlet-clone-3d)) uses `gauntlet-3d`, an isolated four-seat authoritative cooperative dungeon. It adds four switchable classes, four enemy types, destructible generators, pickups, victory/defeat and leader-controlled terminal replay. Existing games retain their contracts. All players may choose the same class; seat colors remain unique. No persistent progress; hosting interruptions reset the level. The dungeon is designed for short runs within the existing hosting duration.

Verification adds deterministic dungeon rules and live-capable synchronization, capacity, late-join, class-switch, departure, retry, reconnect and isolation checks to `npm test`.


## Gauntlet 2D — Embervault

[Live demo](https://samuelasherrivello.github.io/babylon-lite-gauntlet-clone-2d/) · [Source](https://github.com/SamuelAsherRivello/babylon-lite-gauntlet-clone-2d)

The isolated `gauntlet-2d` room supports 1–4 players with server-authoritative tile movement, four switchable classes, four enemy types, generators, keys, food, treasure, revival, victory/defeat and automatic replay. Player numbers and four unique colors persist through class switches. Snapshot state uses the existing generic shared client contract. Tests cover rules, two-client synchronization, invalid input, capacity, isolation, hot drop and fresh reconnect. Session resets and hosting limits above still apply. The consumer pins the exact release artifact after live verification.

Deployment explicitly assigns the canonical public alias after a tagged checkout: detached tags otherwise only updated the team-scoped domain in observed v0.5.0 deployment. A health/version gate now precedes live tests. Recover with Deploy backend release using the existing tag; do not create another version merely to retry routing.

## Enter the Gungeon Clone

[Live demo](https://samuelasherrivello.github.io/babylon-lite-enter-the-gungeon-clone/) — [Source](https://github.com/SamuelAsherRivello/babylon-lite-enter-the-gungeon-clone). `gungeon` adds private four-character rooms for 1–4 players, readiness, authoritative arena movement/combat, dodge invulnerability, three weapon patterns, shared upgrade rewards, revival and wave/boss progression. Existing shared-client callers remain compatible; optional admission options support create/join. Two-client integration and deterministic rule tests are included in local and live deployment checks. Fresh reconnect and in-memory hosting limits above apply.


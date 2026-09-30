![Samuel Asher Rivello](multiplayer-server/documentation/samuel-asher-rivello-banner.png)

# RMC Colyseus Multiplayer Server

A reusable Colyseus backend and shared browser client for small multiplayer demos. Players join anonymously, receive a name and color, and share a room with automatic departure cleanup. Hosted on Vercel Hobby; consuming browser projects can run on GitHub Pages.

## Live Demos

This repository provides the shared multiplayer service and has no standalone demo. Play the projects that use it:

- **[Multiplayer Draw](https://samuelasherrivello.github.io/babylon-lite-multiplayer-draw/)** — draw together from separate computers or browser tabs. [Source repository](https://github.com/SamuelAsherRivello/babylon-lite-multiplayer-draw).

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

Server port defaults to 2567; override `PORT`. Tests start their own server on 2678.
Set `SERVER_URL` before 
pm test` to run the same ownership, late-join, cleanup, fresh-reconnect, seat-reuse, 12/13-capacity checks against a live server. Live integration checks need an otherwise empty drawing session.

### 🛠 Release Version

The root `package.json` is the version source. Run the **Release** workflow with a new semantic version. It tests, sets root/client versions, publishes a tagged GitHub Release with the client tarball, and explicitly calls **Deploy backend release**. This avoids relying on a bot-created release to trigger another workflow. A human-published GitHub Release also triggers deployment.

Deployment tests the tag, records the previous production deployment, deploys to Vercel, and runs live drawing checks. A failed post-deploy check attempts rollback and keeps the workflow failed. To restore a known tag manually, dispatch **Deploy backend release** with that tag.

Required repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. All three secrets are configured and verified by a successful Actions deployment. For replacement credentials, create an access token in Vercel account settings and save its generated value directly to GitHub Secrets. Release checks project access before publishing. Never commit credentials.

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
server.ts                # Thin Vercel entry point
package.json             # Root npm commands and release version
```

Run commands from the repository root. Root TypeScript and Vercel configuration use `server.ts` to load the project implementation.

### 📦 AI

[AGENTS.md](AGENTS.md) documents the layout, verification commands, and consumer-link conventions. The README and layout follow the supplied Multiplayer Draw reference, adapted for a shared backend.

### 📦 Packages

- [Colyseus](https://colyseus.io/) — rooms, admission, and realtime messaging.
- [Express](https://expressjs.com/) — HTTP health and join endpoints.
- [Shared multiplayer client](multiplayer-server/packages/client/README.md) — status, identity, occupancy, game messages, and reconnection.
- [TypeScript](https://www.typescriptlang.org/) and tsx — type checking and local execution.

### Custom Shared Features

| Feature | Available behavior |
|---|---|
| Hot join / hot drop | Automatic anonymous admission; remove departed presence and game-owned artwork after disconnect detection. |
| Player identity | Lowest free ordered seat; fresh session ID, server-generated deterministic name/color; existing seats remain unchanged. Active colors are distinct. |
| Shared client | `MultiplayerClient` exposes status, session ID, room ID, players, occupancy, retry, game messages, and subscription/teardown. |
| Admission and capacity | One room per game within the running instance; capacity 12 for drawing; full status with explicit retry and no normal overflow room. Direct drawing matchmaking is blocked. |
| Fresh reconnect | Exponential backoff, capped at 15 seconds; SDK identity restoration disabled. No persistent-user identity. |
| Drawing relay | Normalized strokes/cursors, active-stroke snapshots for late joiners, whole-stroke ownership enforcement, departure cleanup. |

**Future feature: `persistent-user-rejoins`.** Not implemented. Every reconnect and refresh creates a fresh user, and previous artwork is removed.

New games should review this catalog and [the game registry](multiplayer-server/documentation/games.md). Add broadly useful lifecycle/UI support to the shared client, document it here, and pin its release in each consumer. Use a smaller capacity when gameplay requires it.

### Shared Client API

See [package documentation](multiplayer-server/packages/client/README.md). Build locally with 
pm pack ./multiplayer-server/packages/client --pack-destination artifacts` after creating the artifacts directory.

After release, install the exact asset URL:

```sh
npm install https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/releases/download/v0.1.0/rmc-multiplayer-client-0.1.0.tgz
```

The v0.1.0 asset is published and consumed by Multiplayer Draw. Commit the consumer lockfile. The client needs only the public backend URL, never a Vercel token.

HTTP: `GET /api/health`; `POST /api/join/multiplayer-draw` returns a Colyseus seat reservation or 409 when full. Unknown games return 404; transient admission failures return 503. WebSocket messages are documented in the package. Drawing is limited to 100 strokes and 10,000 points per player, 2,048 points per stroke, and 64 points per batch. Erase strokes to reclaim space.

### Hosting Limits

This is an experimental portfolio service, not a production scaling guarantee. One Vercel deployment does not guarantee one running process; independent instances cannot share these in-memory rooms. Live tests passed with 12 connections, and two independent hosts passed an 11-minute relay test across two timeout/rejoin cycles. See the [recorded hosting evidence](multiplayer-server/documentation/feasibility.md).

Vercel's function duration ends sessions around five minutes. Rejoining creates fresh identities and deletes previous artwork. Deployments can drop sessions, and old connections may briefly remain on an older deployment. There is no durable storage, account system, lobby UI, or paid dependency.

The entry-point pattern follows [endel/colyseus-vercel](https://github.com/endel/colyseus-vercel). Runtime deployment needs explicit Express framework detection.

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

[Live demo](https://samuelasherrivello.github.io/babylon-lite-enter-the-gungeon-clone/) � [Source](https://github.com/SamuelAsherRivello/babylon-lite-enter-the-gungeon-clone). `gungeon` adds private six-character rooms for 1�4 players, readiness, authoritative arena movement/combat, dodge invulnerability, three weapon patterns, shared upgrade rewards, revival and wave/boss progression. Existing shared-client callers remain compatible; optional admission options support create/join. Two-client integration and deterministic rule tests are included in local and live deployment checks. Fresh reconnect and in-memory hosting limits above apply.

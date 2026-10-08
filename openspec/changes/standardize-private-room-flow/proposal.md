# Proposal

## Why

Private-room codes currently differ in length, admission behavior, reconnect handling, and consumer UI. Standardizing the workflow will make multiplayer easier to enter, while a free-only deployment plan must preserve room continuity across Vercel function recycling without promising availability the free platform cannot provide.

## What Changes

- Standardize private-room codes on four uppercase alphanumeric characters (`A-Z` and `0-9`) across coded-room games.
- Support an editable, prefilled code when creating a room; reject occupied codes clearly and never silently join an existing room when creation was requested.
- Standardize the consumer flow: **Play Online**, then a code field with **Join Room** and **Create Room**; after creation, show a copyable link containing the room code in the `room` query parameter.
- Keep a room code and game state available while any player is connected, allow a refresh or dropped connection to rejoin with a fresh identity, and expire an empty room after a short grace period.
- Keep server source in the GitHub repository and deploy it to Vercel Hobby (free) through the repository integration and the existing release workflow.
- Use Vercel Functions WebSocket support (currently public beta), deliberately renew connections before Hobby's 300-second cap, and automatically recover from earlier unexpected drops. Use only the existing free GitHub access and Vercel Hobby account, including Vercel's first-party services; do not add an external host, database, or realtime provider. Keep the release gate closed unless a Vercel-only design proves room consistency across function instances within free quotas.
- Add a hard production gate: do not claim the room-continuity requirement is complete or release the migration unless cross-instance create/join/reconnect and quota tests pass. If no free configuration passes, report that stability and free-only hosting conflict rather than silently weakening room behavior.
- Document the hosting limits and the exact source, client, and admission code references.

## Capabilities

### New Capabilities

- `private-room-flow`: Standard room-code creation, joining, URL sharing, reconnect, and active-room lifecycle behavior for private-code games.
- `vercel-multiplayer-hosting`: Free Vercel-hosted WebSocket sessions, shared room-state behavior, and bounded reconnect expectations.

### Modified Capabilities

- `street-fighter-duels`: Use four-character codes for new invites and permit room-code recovery of disconnected seats with a fresh identity while retaining short automatic same-seat recovery.

## Impact

- Shared client and its documentation: `multiplayer-server/packages/client/`.
- Admission, room lifecycle, and hosting adapter: `multiplayer-server/src/`, root `server.ts`, and `vercel.json`.
- Remove the Render-only container, Blueprint, and deployment configuration if the Vercel path passes its feasibility gate.
- Tests: room lifecycle, Vercel WebSocket reconnect, cross-instance admission/state, free-quota behavior, and existing game regressions.
- Documentation: root `README.md`, shared-client README, and the Ring Rivals planning artifacts.
- Release and deployment: keep the npm client tarball name and public API; deploy from GitHub to the existing Vercel project and use only the current free GitHub and Vercel accounts.

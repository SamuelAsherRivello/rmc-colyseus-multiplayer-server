# Proposal

## Why

Private room codes currently differ in length, admission behavior, reconnect handling, and consumer UI. A shared four-character code and predictable create, join, and link flow will make multiplayer easier to enter and reduce room-code and reconnect mistakes across games.

## What Changes

- Standardize private-room codes on four uppercase alphanumeric characters (`A-Z`, `0-9`) across the coded-room games.
- Support a user-editable suggested code when creating a room; reject an occupied code clearly and never silently join another room when creation was requested.
- Standardize the consumer entry flow: **Play Online**, then a code field with **Join Room** and **Create Room**; a successfully created room exposes a copyable link.
- Put the room code in a `room` URL parameter. Opening or refreshing a room link automatically joins that room, with a fresh player identity.
- Keep a room available while any player is connected. Let a room-code join replace a disconnected seat with a fresh identity; preserve a short disconnect grace so a solo host can refresh and reclaim the room. Dispose the room after the grace when nobody reconnects, or when the server loses the in-memory room.
- Move the multiplayer service from short-lived serverless execution to a long-lived Node host so active connections and in-memory rooms are not cut off by the current five-minute function limit. Do not promise recovery through process loss or deployments.
- Document the shared workflow, exact client contract, and code references in the README and shared-client documentation; align the in-progress Ring Rivals change with the shared contract.

## Capabilities

### New Capabilities

- `private-room-flow`: Standard room-code creation, joining, URL sharing, reconnect, and active-room lifecycle behavior for private-code games.

### Modified Capabilities

- `street-fighter-duels`: Use four-character codes for new invites and permit room-code recovery of disconnected seats with a fresh identity while retaining short automatic same-seat recovery.

## Impact

- Shared client: `multiplayer-server/packages/client/index.js` and its public documentation/API.
- Admission and room lifecycle: `multiplayer-server/src/server.ts` and private room classes for Bomberman, Gungeon, Ring Rivals, and Street Fighter II.
- Tests: focused private-room integration coverage plus the existing game regression suite.
- Documentation: root `README.md`, `multiplayer-server/packages/client/README.md`, and the Ring Rivals planning artifacts.
- Hosting and release: replace the Vercel serverless deployment path with a long-lived Node deployment; preserve the npm client tarball name and public `MultiplayerClient` API.

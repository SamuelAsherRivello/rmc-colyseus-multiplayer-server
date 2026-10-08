# Design

## Context

The repository already contains a thin Vercel entrypoint and a Colyseus `Server.serverless()` export. The newly added room lifecycle, code index, rate limiter, and matchmaking queue are process-local, so they do not by themselves support multiple Vercel Function instances. Vercel's WebSocket Functions are currently public beta on all plans; each connection is pinned to one instance, new connections may reach another instance, and Hobby closes a connection at 300 seconds. See [Vercel WebSocket behavior and limits](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections) and [Hobby plan limits](https://vercel.com/docs/plans/hobby).

## Goals / Non-Goals

**Goals:**

- Keep source in the existing GitHub repository and deploy its production branch to the existing Vercel project on the free Hobby plan.
- Use only the current free GitHub and Vercel accounts; do not add a Marketplace database, external realtime service, or other hosting provider.
- Preserve the four-character create/join/link workflow and room state when a Vercel connection closes and reconnects, including reconnects handled by a different function instance.
- Keep room codes active while a participant is connected, preserve state during reconnect, and expire empty rooms after the existing short grace period.
- Keep all production dependencies within explicitly free quotas, without automatic paid overages.
- Gate release on measured cross-instance correctness and quota usage; do not trade away predictable room behavior to claim free hosting works.

**Non-Goals:**

- Promise an uninterrupted WebSocket longer than Vercel Hobby's 300-second maximum.
- Claim a free plan has an uptime SLA, unlimited traffic, or durable disaster recovery.
- Keep process-local Colyseus matchmaking as the sole source of room ownership on Vercel.
- Introduce a paid Vercel, database, or realtime plan.
- Introduce any third-party runtime, database, or realtime provider, even if that provider offers a free tier.

## Decisions

### Keep GitHub as source and deploy with Vercel Hobby

The existing GitHub repository remains the source of truth. The Vercel project imports the personal GitHub repository and builds the service from its production branch; preview deployments remain separate from production. Keep the existing stable Vercel project URL, restore Vercel deployment in the release workflow, and use the existing `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` credentials. Remove Render-only Docker and Blueprint deployment paths. Preserve `server.ts` as a thin adapter and use the Node runtime supported by the existing Colyseus `Server.serverless()` entrypoint.

### Renew sockets before the Hobby limit

Vercel Hobby permits WebSocket connections but limits each Function connection to 300 seconds. Treat that as a normal renewal interval: after each connection is accepted, the server tells the client when to renew; target renewal at about 240 seconds, with a small randomized delay so players do not all reconnect at once. The client opens a replacement connection, rejoins through the room code, fetches an authoritative versioned snapshot, and resumes before closing the old socket where the transport permits. Keep the existing short disconnected-seat grace for the handoff. If Vercel, a deployment, or a network closes a socket sooner, use the same automatic recovery path. The acceptance criterion is a continuous **room session** across planned and unexpected socket replacements, not one uninterrupted TCP/WebSocket connection.

### Keep room authority within first-party Vercel services

Each connection can land on a different Function instance, so in-memory room metadata, seat reservations, simulation state, and broadcasts cannot be authoritative. The user constraint permits only GitHub and Vercel. Evaluate Vercel Blob and Edge Config as the only first-party shared-state candidates; do not add a Vercel Marketplace database or an external provider.

Vercel Blob supports conditional writes with ETags, but Hobby includes 2,000 advanced operations per month and allows 900 advanced operations per minute. One 20 Hz snapshot write per active room would require 72,000 writes per room-hour and 1,200 per minute, exceeding both published limits. Blob is object storage rather than a realtime message bus. Overwritten blobs may be cached for up to 60 seconds unless a cache-bypassing read is used. Edge Config is optimized for frequently read, rarely changed configuration and Hobby includes 100 writes per month. Neither is assumed to support authoritative room traffic; task 3.1 must verify any Vercel-only design against actual semantics and quotas.

Do not use GitHub APIs or repository commits as a runtime room store. They are the source and release path, not the ordered low-latency data plane. If no first-party Vercel design safely supports code uniqueness, active leases, cross-instance ordered state, and recovery within free quotas, stop the hosting migration and document the conflict. Do not substitute per-instance rooms or weaken the continuity requirement.

### Keep the existing client API and add resumable snapshots

Keep `MultiplayerClient(endpoint, game, options)`, current room keys, and the four-character code helpers. Add only the transport/resume behavior needed to reconnect a dropped socket, rejoin using the same code, request the newest versioned snapshot, and reject stale or reordered commands. Keep game-specific simulations isolated. The endpoint should return a clear expired/unavailable result when the room lease or shared state is gone.

### Deploy from GitHub and verify the production alias

Vercel's Git integration performs deployment from GitHub. Retain the repository's Vercel token/org/project settings only for checked-in verification/release automation; do not introduce a paid host or an alternate deployment source. Verify health, all coded-room admission paths, forced socket replacement after 300 seconds, cross-instance resume, and measured free-tier consumption before marking the hosting tasks complete.

## Risks / Trade-offs

- **WebSocket support is public beta** → Keep the production migration gated and test the actual Colyseus entrypoint and deployed project, not just a local WebSocket server.
- **Function instances do not share memory or guaranteed room affinity** → Make shared state and ordering part of the room authority; reject or block rollout if a second instance can fork a room.
- **Hobby sockets close after 300 seconds** → Renew around 240 seconds, restore the same logical room, and use automatic reconnect for earlier drops. A brief reconnect state is expected; losing room state is not an acceptable recovery result.
- **Vercel's first-party storage quotas or consistency may not support realtime room state** → Measure Vercel usage and test conditional writes, reads, ordering, and recovery. If the free limits or semantics fail, keep the release gate closed; do not add a third-party store or silently upgrade.
- **The free configuration has no availability SLA** → Describe the deployment as best effort and surface service/room unavailability honestly. The feature must still meet the tested stability contract during normal service operation.
- **The Vercel project may pause or throttle at Hobby limits** → Include quota-exhaustion and cold-start checks in verification and retain rollback to the last working Vercel deployment.

## Migration Plan

1. Keep the currently deployed Vercel service available while preparing changes in GitHub.
2. Prototype the shared-state adapter with two independent function instances and verify unique create, same-room join, concurrent admission, replacement-seat recovery, and ordered state broadcast.
3. Measure all four coded games under representative play against the candidate store's free limits. If the free limits are insufficient, stop before production migration and report the conflict with the free-only requirement.
4. Implement planned socket renewal around 240 seconds, automatic reconnect for earlier drops, and versioned snapshot resume; verify a session across repeated renewals lasting more than ten minutes.
5. Deploy from the production GitHub branch to the existing Vercel project, verify its health and public game flows, then migrate consumers while keeping the same stable server URL.
6. Release the shared client and backend together only after the cross-instance and free-quota gates pass.

Rollback switches the Vercel project back to the prior deployment. Shared room data uses an explicit schema version and TTL; a rollback that cannot read the current schema returns a clear room-unavailable response and lets players create a new room.

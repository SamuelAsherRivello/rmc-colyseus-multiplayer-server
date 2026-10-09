# Design

## Context

The repository already contains a thin Vercel entrypoint and a Colyseus `Server.serverless()` export. The room lifecycle, code index, rate limiter, and matchmaking queue are process-local. A separate-process probe confirmed that another instance cannot join an active code and can claim the same code independently. Vercel's WebSocket Functions are currently public beta on all plans; each connection is pinned to one instance, new connections may reach another instance, and Hobby closes a connection at 300 seconds. See [Vercel WebSocket behavior and limits](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections) and [Hobby plan limits](https://vercel.com/docs/plans/hobby).

## Goals / Non-Goals

**Goals:**

- Keep source in the existing GitHub repository and deploy its production branch to the existing Vercel project and stable URL on the free Hobby plan.
- Use only the current free GitHub and Vercel accounts; do not add a Marketplace database, external realtime service, or other hosting provider.
- Preserve the four-character create/join/link workflow for Gungeon, Ring Rivals, and Street Fighter and the published six-character Bomberman invite flow. Keep game protocols and process-local recovery while the owning Function remains available.
- Verify each registered game against a staged production build and the stable alias, with a two-client session lasting four minutes.
- Keep all production dependencies within explicitly free quotas, without automatic paid overages.
- Reserve cross-instance continuity and multi-renewal sessions for a separately gated future shared-state migration.

**Non-Goals:**

- Promise an uninterrupted WebSocket longer than Vercel Hobby's 300-second maximum.
- Claim a free plan has an uptime SLA, unlimited traffic, or durable disaster recovery.
- Claim that the current process-local release preserves a room when another Function handles a join or when the owning Function ends.
- Add planned 240-second renewal or versioned snapshot migration in this bounded release.
- Introduce a paid Vercel, database, or realtime plan.
- Introduce any third-party runtime, database, or realtime provider, even if that provider offers a free tier.

## Decisions

### Keep GitHub as source and deploy with Vercel Hobby

The existing GitHub repository remains the source of truth. The checked-in release workflow builds the verified `main` commit with the Vercel CLI and the existing `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` credentials. Preserve `server.ts` as a thin adapter and use Node 24. Leave historical Render files untouched in this release. The client package and server protocol remain backward compatible so consumers configured for the stable alias need no URL change.

### Bound the current release to the Hobby connection limit

Vercel Hobby permits WebSocket connections but limits a Function connection to 300 seconds. The current release does not implement planned renewal or persistent room authority. Its acceptance test is a live, uninterrupted two-client relay session for 240 seconds. Existing short SDK recovery remains where already implemented, and other games retain their current fresh-retry behavior. A socket close, process replacement, or differently routed join can end the room; document that limitation and do not advertise a ten-minute continuous session.

### Defer cross-instance authority to a separate migration gate

Each connection can land on a different Function instance, so in-memory room metadata, seat reservations, simulation state, and broadcasts cannot guarantee global authority. The current release retains this process-local limitation. Future work may evaluate only first-party Vercel state services under the free-only constraint; do not add a Vercel Marketplace database or external provider.

Vercel Blob supports conditional writes with ETags, but Hobby includes 2,000 advanced operations per month and allows 900 advanced operations per minute. One 20 Hz snapshot write per active room would require 72,000 writes per room-hour and 1,200 per minute, exceeding both published limits. Blob is object storage rather than a realtime message bus. Overwritten blobs may be cached for up to 60 seconds unless a cache-bypassing read is used. Edge Config is optimized for frequently read, rarely changed configuration and Hobby includes 100 writes per month. Neither is assumed to support authoritative room traffic; task 3.1 must verify any Vercel-only design against actual semantics and quotas.

Do not use GitHub APIs or repository commits as a runtime room store. They are the source and release path, not the ordered low-latency data plane. Cross-instance code uniqueness, active leases, ordered state, and recovery remain unimplemented. Do not mark the future shared-state migration complete until a first-party design passes its own correctness and quota proof. Its open gate is distinct from the bounded current release.

### Keep the existing client API

Keep `MultiplayerClient(endpoint, game, options)`, current room keys, and four-character code helpers; add the six-character Bomberman compatibility exception at admission. Keep game-specific simulations isolated. The bounded release does not introduce a new snapshot schema or claim recovery after an owning process disappears. A later shared-state migration must add versioned snapshots and explicit stale-command handling without breaking this API.

### Deploy from GitHub and verify the production alias

The release workflow first pushes the new versioned commit to `main`, then builds a production deployment without assigning the stable domain. Verify staged health, the full live-capable test suite for every registered game, and a 240-second two-client relay session. Promote that exact deployment to `https://rmc-colyseus-multiplayer-server.vercel.app`, verify the stable alias's health version and a two-client relay, then publish one matching GitHub tag, release, and client tarball. A failed stage must not create a GitHub release or move the alias. This uses the existing project and free Vercel credentials.

## Risks / Trade-offs

- **WebSocket support is public beta** → Keep the production migration gated and test the actual Colyseus entrypoint and deployed project, not just a local WebSocket server.
- **Function instances do not share memory or guaranteed room affinity** → Document process-local rooms; do not claim cross-instance uniqueness or recovery in the current release. A failed live game test blocks promotion.
- **Hobby sockets close after 300 seconds** → Test an uninterrupted 240-second session and state the maximum and recovery limits to consumers.
- **First-party storage quotas cannot carry the current 20 Hz state stream** → Do not add shared storage to this release; keep the future migration gate open without a paid tier or third-party provider.
- **The free configuration has no availability SLA** → Describe the deployment as best effort and surface service/room unavailability honestly. The feature must still meet the tested stability contract during normal service operation.
- **The Vercel project may pause or throttle at Hobby limits** → Include quota-exhaustion and cold-start checks in verification and retain rollback to the last working Vercel deployment.

## Migration Plan

1. Keep the currently deployed stable alias available while verifying local Node 24 checks and the next version.
2. Push the versioned source commit to `main`; stage a production Vercel deployment without alias assignment.
3. Verify staged health, all registered game protocols, and a two-client 240-second relay. Stop before promotion if any check fails.
4. Promote the tested deployment to the same stable URL used by existing consumers; verify that URL's exact version and two-client relay.
5. Publish one GitHub release and the unchanged client tarball name from the verified commit.
6. Keep cross-instance room ownership, planned renewal, and longer-than-ten-minute continuity behind their separate future proof.

Rollback switches the Vercel project back to the prior deployment if stable-alias verification fails. In-memory rooms can end during promotion or rollback, so clients may need to create a fresh room. No shared-state schema migration occurs in this bounded release.

# Spec Delta

## Purpose

Defines a bounded, free-only Vercel release for the current process-local server. Cross-instance room continuity is a separate future migration and is not a claim of this release.

## ADDED Requirements

### Requirement: Production source is deployed from GitHub to the stable Vercel Hobby alias
The production server SHALL be built from the project's verified GitHub `main` commit, run on the existing Vercel Hobby project, and serve the existing stable URL without requiring a paid host or data tier.

#### Scenario: A verified version is released
- **WHEN** the staged deployment passes the release checks and is promoted
- **THEN** `https://rmc-colyseus-multiplayer-server.vercel.app/api/health` reports the new version and existing consumers can continue using that same server URL

### Requirement: Hosting uses only the user's free GitHub and Vercel services
The bounded production release SHALL use only the user's current free GitHub access and Vercel Hobby account. It SHALL NOT add a third-party host, database, realtime provider, paid tier, or automatic overages.

#### Scenario: A design requires an external provider
- **WHEN** a proposed deployment dependency requires a third-party service or paid capacity
- **THEN** it is excluded from this release

### Requirement: Current WebSocket sessions are verified within the Hobby duration limit
The bounded release SHALL verify a live two-client relay session for 240 seconds, below Vercel Hobby's 300-second Function limit. It SHALL document that the current client does not provide planned renewal or guaranteed state recovery after the owning Function ends.

#### Scenario: Two clients play within the verified window
- **WHEN** two clients remain in a relay room for four minutes on the staged production deployment
- **THEN** they stay in the same room and continue receiving server-mediated messages without a socket drop during that test

#### Scenario: A Function ends or a reconnect reaches another instance
- **WHEN** the owning Function ends or a room-code request reaches another instance
- **THEN** the service is permitted to lose that process-local room; the release documentation does not promise the same room or state across that boundary

### Requirement: Current room authority is described accurately
Room-code ownership, admission, seat reservations, game state, and broadcasts SHALL be described as process-local for this release. Existing in-process room-code recovery and game-specific SDK reconnection SHALL remain compatible, but cross-instance uniqueness and recovery SHALL NOT be claimed.

#### Scenario: A code exists only on another instance
- **WHEN** a join request is handled by an instance without that room
- **THEN** the service may return its existing room-unavailable or not-found response and does not create a duplicate room as a side effect of that join

### Requirement: Bounded release passes local, staged, and alias checks
The workflow SHALL run Node 24 clean install, documentation check, typecheck, the full test suite, and client packaging. It SHALL stage the versioned production build without moving the stable URL, verify staged health, every registered game's live-capable tests, and a 240-second two-client relay, then promote that exact build. It SHALL verify the stable URL's exact version and two-client relay before publishing one GitHub tag, release, and unchanged client tarball name.

#### Scenario: A staged check fails
- **WHEN** health, a game integration, packaging, or the four-minute relay fails before promotion
- **THEN** the stable URL remains on the previous deployment and no GitHub release is published

#### Scenario: Stable alias verification fails after promotion
- **WHEN** the promoted stable URL does not serve the selected version or relay two clients
- **THEN** the release is not published and the previous deployment is restored before calling the rollout successful

### Requirement: Future shared-state migration has its own gate
Any later claim of cross-instance room continuity, planned renewal, or sessions longer than the Function limit SHALL require a separate implementation and tests for atomic code creation, cross-instance join and state recovery, ordered messages, and representative first-party free-tier usage. This future gate SHALL NOT be marked complete by the bounded release.

#### Scenario: Future cross-instance proof fails
- **WHEN** a later shared-state design forks rooms or exceeds the approved free-tier budget
- **THEN** that migration remains blocked without changing the bounded release's documented behavior

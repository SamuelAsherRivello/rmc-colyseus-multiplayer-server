# Spec Delta

## Purpose

Defines a free-only Vercel deployment whose WebSocket connections may be short-lived while its logical multiplayer rooms remain resumable across function instances.

## ADDED Requirements

### Requirement: Production source is deployed from GitHub to Vercel Hobby
The production server SHALL be built from the project's GitHub repository and run on Vercel Hobby without requiring a paid host or paid data tier.

#### Scenario: Production branch is updated
- **WHEN** a verified change is merged to the production branch
- **THEN** Vercel builds and deploys that GitHub revision to the stable production alias

### Requirement: Hosting uses only the user's free GitHub and Vercel services
The production architecture SHALL use only the user's current free GitHub access and Vercel Hobby account, including first-party Vercel services, and SHALL NOT depend on a third-party host, database, or realtime provider.

#### Scenario: A design requires an external provider
- **WHEN** cross-instance room consistency depends on a third-party runtime, database, or realtime service
- **THEN** the migration remains blocked and no such provider is added

### Requirement: WebSockets renew before the Hobby duration limit
The system SHALL treat Vercel Hobby's 300-second WebSocket maximum as a planned renewal interval. The client SHALL start renewal around 240 seconds after a connection is accepted, rejoin the same room code, and recover the latest authoritative game state before the platform limit. It SHALL also recover if the platform, a deployment, or the network closes a connection earlier.

#### Scenario: Planned socket renewal
- **WHEN** a WebSocket has been open for about 240 seconds
- **THEN** the client renews it, rejoins the same room, applies the newest authoritative snapshot, and keeps the shared room URL and game state

#### Scenario: Platform closes a socket early
- **WHEN** Vercel, a deployment, or a network closes a WebSocket before planned renewal
- **THEN** the client automatically reconnects to the same room and recovers the latest authoritative game state

#### Scenario: A play session lasts longer than five minutes
- **WHEN** two players remain in a match for more than ten minutes
- **THEN** planned socket renewals complete without changing rooms, losing authoritative state, or requiring either player to reload the page

### Requirement: Room authority is shared across Vercel instances
Room-code ownership, admission, seat reservations, authoritative game state, and ordered room messages SHALL use a shared coordination path so a connection handled by another function instance joins the same logical room.

#### Scenario: A rejoin reaches a different function instance
- **WHEN** a player joins or reconnects to a room code on a function instance other than the one that handled the previous connection
- **THEN** the player reaches the same room state and no duplicate room or conflicting seat is created

#### Scenario: Concurrent creates request the same code
- **WHEN** separate function instances concurrently create a room with the same code
- **THEN** exactly one request succeeds and the other receives a code-in-use response

### Requirement: Vercel resources stay within free quotas
The production configuration SHALL use only the user's free GitHub and Vercel services, SHALL NOT enable paid overages or automatic upgrades, and SHALL provide a recoverable error when a Vercel free quota prevents admission or state updates.

#### Scenario: A free-tier quota is reached
- **WHEN** Vercel rejects work because a Hobby or first-party storage quota is exhausted
- **THEN** the client receives a clear retryable service-unavailable result and the system does not incur a paid charge

### Requirement: Cross-instance behavior passes a release gate
The production migration SHALL NOT be released until tests prove coded-room creation, cross-instance join, state recovery after a forced socket replacement, and representative free-tier resource use.

#### Scenario: A cross-instance or quota test fails
- **WHEN** any coded game forks room state across instances or exceeds the approved free-tier budget during representative play
- **THEN** the migration remains blocked and the limitation is documented instead of marking hosting complete

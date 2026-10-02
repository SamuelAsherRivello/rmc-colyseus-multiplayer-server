# Spec Delta

## Purpose

Defines a consistent private-room code, link, and recovery flow that game clients can share while keeping each game’s room state and gameplay isolated.

## ADDED Requirements

### Requirement: New private rooms use four-character codes
The service SHALL create private rooms with a unique four-character uppercase code drawn from `A-Z` and `0-9`, and SHALL allow clients to request a specific valid code when creating a room.

#### Scenario: Create with a suggested code
- **WHEN** a client requests creation with an unused four-character code
- **THEN** the service creates a private room using that code and returns it with the join reservation

#### Scenario: Requested code is already in use
- **WHEN** a client requests creation with a code already assigned to an active room for that game
- **THEN** the service rejects creation with a code-in-use error and does not join the existing room

#### Scenario: Malformed code
- **WHEN** a client submits a code with an unsupported length or character
- **THEN** the service returns a clear admission error without creating or joining a room

### Requirement: Room links automatically join the coded room
The shared client contract SHALL use a `room` URL query parameter for a private-room code and SHALL preserve other query parameters when building a share link.

#### Scenario: Open a shared room link
- **WHEN** a player opens a game URL containing a valid `room` code
- **THEN** the game automatically enters its online flow and attempts to join that room

#### Scenario: Refresh in a coded room
- **WHEN** a player refreshes while the room remains available
- **THEN** the page reads the same code from the URL and rejoins that room with a fresh player identity

### Requirement: Room-code rejoin can replace a disconnected seat
When a valid room code is used to join a room with a disconnected seat, the service SHALL admit a fresh identity by releasing or replacing that seat, while preserving connected players and their room state. A disconnected seat SHALL remain claimable by code for as long as at least one player remains connected to the room; the 15-second automatic recovery window SHALL NOT shorten this room-code availability.

#### Scenario: Rejoin while another player remains connected
- **WHEN** a player reconnects by room code while another player remains connected
- **THEN** the joining player receives a fresh identity in the same room and connected players retain their current state

#### Scenario: Rejoin after automatic recovery expires
- **WHEN** a player rejoins by code after the 15-second automatic recovery window while another player is still connected
- **THEN** the same room admits a fresh identity into the vacant seat and preserves the connected player's room state

#### Scenario: Reclaim a solo room after refresh
- **WHEN** the only player disconnects during a refresh and rejoins by code within the disconnect grace period
- **THEN** the same room remains available and admits the player with a fresh identity

#### Scenario: Connected capacity is full
- **WHEN** all seats are occupied by connected players and another player uses the code
- **THEN** the service reports that the room is full without displacing a connected player

### Requirement: Private-room codes are protected from rapid guessing
The service SHALL limit repeated room-code admission attempts from a source and SHALL return a retryable error after the configured attempt limit is reached.

#### Scenario: Repeated invalid codes
- **WHEN** a source exceeds the room-code admission attempt limit
- **THEN** further attempts are rejected temporarily without affecting active rooms

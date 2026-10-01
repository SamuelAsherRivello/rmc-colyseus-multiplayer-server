# street-fighter-duels

## Purpose

Provide private, authoritative two-player Street Fighter II style matches with character selection, timed rounds, match outcomes, and bounded same-seat recovery.

## Requirements

### Requirement: Private two-seat admission
The service SHALL create rooms for `street-fighter-ii` by invite code, accept only two connected or reserved seats, and isolate each room from other game keys and invite codes.

#### Scenario: Invite join
- **WHEN** a host creates a duel and a second client joins its six-character code
- **THEN** both clients receive the same room state and the room remains limited to those two seats

#### Scenario: Invalid or full code
- **WHEN** a client submits a malformed, expired, or full-room code
- **THEN** the service returns a specific admission error without creating another room

### Requirement: Authoritative arcade combat
The service SHALL own fighter choice, ready/countdown state, fixed-step movement, stage bounds, attack windows, hits, blocks, damage, stun, health, round timer, round outcomes, match score, and rematch state. It SHALL accept bounded input frames only and SHALL ignore client-provided outcomes or positions.

#### Scenario: Invalid input
- **WHEN** a client submits an unsupported fighter, malformed axes/actions, stale sequence, or client-authored health/hit data
- **THEN** the input is rejected and authoritative state does not change

#### Scenario: Shared match outcome
- **WHEN** both players send legal actions during a round
- **THEN** the server broadcasts one authoritative state and resolves simultaneous attacks and round outcomes consistently

### Requirement: Fifteen-second seat recovery
The service SHALL reserve a disconnected player's seat, fighter choice, and match identity for 15 seconds and permit only the matching server-issued reconnect token to reclaim it. Expired reservations SHALL be released.

#### Scenario: Reclaim a seat
- **WHEN** a disconnected player reconnects with its room code and valid token within 15 seconds
- **THEN** the same seat and fighter are restored and the other client sees the same match state

#### Scenario: Expired or invalid token
- **WHEN** the reservation expires or a different client submits an invalid token
- **THEN** the reserved seat cannot be stolen and the client receives a recoverable error

### Requirement: Existing game isolation
The new room and shared-client exports SHALL be additive and SHALL NOT change existing games' admission, message, simulation, or reconnect behavior.

#### Scenario: Existing game regression
- **WHEN** the existing game integration suite runs after adding the fighter duel
- **THEN** all existing room behaviors and client APIs continue to pass

# Spec Delta

## MODIFIED Requirements

### Requirement: Private two-seat admission
The service SHALL create rooms for `street-fighter-ii` with unique four-character uppercase alphanumeric invite codes, accept only two connected or reserved seats, and isolate each room from other game keys and invite codes. A room-code join may replace a disconnected reserved seat with a fresh identity without displacing a connected player.

#### Scenario: Invite join
- **WHEN** a host creates a duel and a second client joins its four-character code
- **THEN** both clients receive the same room state and the room remains limited to those two seats

#### Scenario: Rejoin a disconnected seat by code
- **WHEN** a player refreshes and joins the same code while the previous seat is disconnected
- **THEN** the room admits a fresh identity into that seat, preserves the connected opponent and current match state, and invalidates the previous seat token

#### Scenario: Invalid or full code
- **WHEN** a client submits a malformed, expired, or full-room code
- **THEN** the service returns a specific admission error without creating another room

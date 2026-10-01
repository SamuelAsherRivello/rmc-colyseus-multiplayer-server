# Spec Delta

## Purpose

Provides two anonymous players a small, isolated, server-authoritative cooperative brick-breaker session with safe admission and complete late-join state.

## ADDED Requirements

### Requirement: Authoritative cooperative session
The room MUST admit at most two players. Each player MUST control a paddle that can move across the full board width; the paddles MAY overlap. Player 1's paddle center MUST be 50 logical pixels above the original y=540 paddle row, and Player 2's center MUST be 100 logical pixels above it. The room MUST own bounded paddle positions and all ball, brick, score, life, wave, powerup, victory, defeat, and restart outcomes. Player messages MUST NOT directly set shared outcomes.

#### Scenario: Player action advances shared simulation
- **WHEN** a player sends a valid full-width movement or launch action
- **THEN** the authoritative simulation applies that action at that player's fixed paddle row and broadcasts the same resulting game state to both clients

#### Scenario: Paddles can overlap anywhere across the board
- **WHEN** both players move to the same legal horizontal position
- **THEN** both paddle centers reach that position without lane restrictions and remain at their separate vertical rows

#### Scenario: Ball can be returned by either vertical defense row
- **WHEN** a descending ball crosses either paddle row within that paddle's horizontal bounds
- **THEN** the authoritative simulation bounces the ball upward from the paddle that it struck

#### Scenario: Invalid message cannot alter outcomes
- **WHEN** a player sends an out-of-bounds, malformed, over-rate, or forged score/board message
- **THEN** the room ignores it and retains server-owned state

### Requirement: Admission, snapshots, and departure
The game MUST use the `neon-breaker-duo` game key, admit no more than two simultaneous players, provide current snapshots to late joiners, center a departed player's paddle while allowing the match to continue, and keep sessions isolated from every other game key. Paddle snapshots MUST include each paddle's authoritative y coordinate.

#### Scenario: Late joiner receives current snapshot
- **WHEN** a player joins an active room
- **THEN** the room supplies current players and complete game state

#### Scenario: Capacity and isolation
- **WHEN** a third player requests the occupied game or a client requests another game key
- **THEN** the third player receives full status and the other game remains in a different room with its own state

#### Scenario: Departure frees lane
- **WHEN** one client leaves
- **THEN** their paddle is centered at its assigned vertical row and the remaining client continues the same match

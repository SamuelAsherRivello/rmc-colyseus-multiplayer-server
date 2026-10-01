# Spec Delta

## Purpose

Provides two anonymous players a small, isolated, server-authoritative cooperative brick-breaker session with safe admission and complete late-join state.

## ADDED Requirements

### Requirement: Authoritative cooperative session
The room MUST admit at most two players and give them separate left/right defense lanes. It MUST own bounded paddle positions and all ball, brick, score, life, wave, powerup, victory, defeat, and restart outcomes. Player messages MUST NOT directly set shared outcomes.

#### Scenario: Player action advances shared simulation
- **WHEN** a player sends a valid lane movement or launch action
- **THEN** the authoritative simulation applies that action and broadcasts the same resulting game state to both clients

#### Scenario: Invalid message cannot alter outcomes
- **WHEN** a player sends an out-of-bounds, malformed, over-rate, or forged score/board message
- **THEN** the room ignores it and retains server-owned state

### Requirement: Admission, snapshots, and departure
The game MUST use the `neon-breaker-duo` game key, admit no more than two simultaneous players, provide current snapshots to late joiners, center a departed player's lane while allowing the match to continue, and keep sessions isolated from every other game key.

#### Scenario: Late joiner receives current snapshot
- **WHEN** a player joins an active room
- **THEN** the room supplies current players and complete game state

#### Scenario: Capacity and isolation
- **WHEN** a third player requests the occupied game or a client requests another game key
- **THEN** the third player receives full status and the other game remains in a different room with its own state

#### Scenario: Departure frees lane
- **WHEN** one client leaves
- **THEN** their lane is neutralized and the remaining client continues the same match

# Spec Delta

## Purpose

Runs the multiplayer service as a long-lived Node process so WebSocket sessions and in-memory rooms are not constrained by short serverless function lifetimes.

## ADDED Requirements

### Requirement: The multiplayer service supports long-lived connections
The production service SHALL run on a Node host that supports persistent WebSocket connections without the current five-minute function execution limit.

#### Scenario: Active session exceeds five minutes
- **WHEN** a player remains connected longer than five minutes
- **THEN** the hosting platform does not terminate the session solely because of a function-duration limit

### Requirement: In-memory rooms use one authoritative process
The service SHALL route room creation, code lookup, and room joins to the same authoritative process while room state remains in memory.

#### Scenario: Join an active room
- **WHEN** a client joins a code created by an active room
- **THEN** matchmaking reserves a seat in that room rather than creating or selecting an isolated room on another process

### Requirement: Room state is process-scoped
The service SHALL keep the documented room lifetime bounded by the host process; it SHALL NOT claim to restore in-memory game state after process loss or deployment restart.

#### Scenario: Host process is lost
- **WHEN** the authoritative process stops or loses its in-memory state
- **THEN** its room codes and game state are no longer joinable and clients receive a recoverable room-unavailable result

# Gungeon cooperative arena

## Purpose

Provide private server-authoritative cooperative bullet arenas with code-based admission, safe lifecycle transitions and shared wave progression.

## Requirements
### Requirement: Private cooperative sessions
The service SHALL support room creation and joining by shareable code for one to four players, readiness, hot join/drop and explicit full/expired-room errors without impacting other games.
#### Scenario: Hot join and capacity
- **WHEN** four players join one code and a fifth tries joining
- **THEN** four receive the same current world and the fifth receives full status
#### Scenario: Isolation
- **WHEN** another code or another game is joined
- **THEN** its players and actions do not affect this run
### Requirement: Authoritative arena rules
The server SHALL validate movement, aiming, shooting, dodge invulnerability/cooldown, cover, destructible props, damage, loot, revival, scaling, wave progression and restart. It SHALL offer three distinct weapons and upgrades, chase/aimed/radial enemies and a boss every five waves. Friendly fire SHALL be disabled.
#### Scenario: Forged client state
- **WHEN** a client sends positions, health, damage or malformed input
- **THEN** it cannot change authoritative outcomes
#### Scenario: Team progression
- **WHEN** all enemies die
- **THEN** shared rewards and an upgrade break precede the next wave
#### Scenario: Defeat and replay
- **WHEN** all connected players are down
- **THEN** the run ends and the lowest active seat can restart the team
### Requirement: Lifecycle and compatibility
The client SHALL expose code-aware admission and current state, stop stale actions and rejoin after disconnect while preserving existing game APIs.
#### Scenario: Reconnect
- **WHEN** a player disconnects and retries
- **THEN** it rejoins the same existing code with a fresh identity or reports that the room expired

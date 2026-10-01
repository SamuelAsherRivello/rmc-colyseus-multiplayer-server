# bomberman-sessions Specification

## Purpose
Provide isolated authoritative Bomberman rooms and bounded session recovery without changing other consumers.

## Requirements
### Requirement: Private authoritative arena
The service SHALL admit at most four players to coded Bomberman rooms, require at least two ready players to start, validate sequenced movement/actions, and own bombs, collision, blasts and round outcomes.
#### Scenario: Shared detonation
- **WHEN** two ready clients enter one code and one places a bomb
- **THEN** both receive matching authoritative detonation and elimination outcomes
### Requirement: Identity recovery
The service SHALL reserve an unconsented disconnected seat for 15 seconds, stop its input while retaining vulnerability, and restore its identity on successful recovery. Consent leave or expired recovery SHALL remove the seat.
#### Scenario: Brief interruption
- **WHEN** a dropped connection recovers within the allowed window
- **THEN** the same session identity and score remain in the room
### Requirement: Existing-game compatibility
Other registered games SHALL retain their admission and lifecycle behavior after the extension.
#### Scenario: Regression verification
- **WHEN** the extended backend is released
- **THEN** all existing-game integration checks and new Bomberman checks pass locally and on the public endpoint

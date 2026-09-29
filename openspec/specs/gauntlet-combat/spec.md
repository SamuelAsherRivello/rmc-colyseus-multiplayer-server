# gauntlet-combat

## Purpose
Provide verified gauntlet-combat behavior for the cooperative Gauntlet-inspired 3D dungeon game.

## Requirements

### Requirement: Classes and enemies
Players SHALL instantly switch among warrior, valkyrie, wizard and elf without healing, with ghosts, grunts, demons and lobbers present.

#### Scenario: Classes and enemies acceptance
- **WHEN** a wounded player switches class
- **THEN** identity, position and health fraction are preserved

### Requirement: Complete level
The game SHALL provide collision, attacks, enemy damage, generators, food, key, treasure, victory, defeat and replay.

#### Scenario: Complete level acceptance
- **WHEN** the team destroys all generators and reaches the exit with the key
- **THEN** the room enters victory and can restart without changing identities

### Requirement: Shared pause
Local pause SHALL stop only that player input and SHALL NOT reset or pause the shared room.

#### Scenario: Shared pause acceptance
- **WHEN** a player pauses while others continue
- **THEN** the simulation continues and stale controls stop

# Dust Racing Specification

## Purpose
Provide fair four-truck arcade races with validated progress and reliable temporary multiplayer participation.

## Requirements

### Requirement: Authoritative races
The server SHALL control movement, collisions, terrain, jumps, nitro, pickups, checkpoint order, three-lap completion, results and replay. Races SHALL end within 120 seconds, with a 15-second finishing window after the first finisher. Recovery SHALL not advance validated progress.

#### Scenario: Validated completion
- **WHEN** a racer crosses the finish forward after every required checkpoint on three laps
- **THEN** the server records its finish time and ranks finishers before unfinished racers

#### Scenario: Invalid input
- **WHEN** a client submits invalid, stale or unauthorized actions or claims a result
- **THEN** shared outcomes remain authoritative and missing control inputs expire

### Requirement: Four human seats and four racing trucks
The service SHALL admit up to four humans, reject a fifth, fill the race grid with AI, and allow the lowest active human seat to start when every present human is ready. Countdown SHALL freeze the roster. Late arrivals SHALL wait for the next race. A departed truck SHALL become AI for that race; reconnect SHALL create a fresh participant. Empty sessions SHALL be cleaned up.

#### Scenario: Late join and departure
- **WHEN** a human joins after countdown or a racing human leaves
- **THEN** the arrival waits and the departed racer continues as labeled AI without granting its result to a reconnect

### Requirement: Compatibility and recovery
The shared package SHALL preserve existing consumers, expose racing simulation and track to offline clients, and keep racing state isolated. Hosting resets SHALL not promise retained progress.

#### Scenario: Existing consumers
- **WHEN** drawing, sumo, garden or gauntlet clients use the new release
- **THEN** their existing contracts remain valid and their rooms cannot modify racing state

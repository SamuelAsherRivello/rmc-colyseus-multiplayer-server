# Spec Delta

## Purpose

Provide reusable relay behavior for a participant-run shared simulation to migrate authority safely when its current host leaves.

## ADDED Requirements

### Requirement: Deterministic eligible host election

The relay SHALL elect the longest continuously connected eligible participant as host and expose the current host identity to room participants.

#### Scenario: First participant joins
- **WHEN** the first eligible participant joins an empty room
- **THEN** the relay designates that participant as the host

#### Scenario: Later participant joins
- **WHEN** another eligible participant joins an occupied room
- **THEN** the existing host remains host

### Requirement: Transferable state handoff

The relay SHALL accept a bounded valid transferable snapshot only from the current host and SHALL supply the latest accepted snapshot to a promoted successor.

#### Scenario: Host publishes a snapshot
- **WHEN** the elected host submits a valid transferable snapshot
- **THEN** the relay sequences and stores it for room participants and a future successor

#### Scenario: Guest attempts publication
- **WHEN** a guest submits a transferable snapshot
- **THEN** the relay rejects it without replacing the stored state

### Requirement: Automatic successor promotion

The relay SHALL promote the longest-connected remaining eligible participant when the host leaves or fails configured liveness checks, and SHALL close an empty room without assigning an orphan host.

#### Scenario: Host departs
- **WHEN** the current host disconnects while an eligible guest remains
- **THEN** the guest becomes host and receives the latest transferable state

#### Scenario: No participant remains
- **WHEN** the last host leaves the room
- **THEN** the room closes without a successor election

# Spec Delta

## Purpose

Provide a bounded, isolated relay contract for shared Just Like Rabbits observation sessions and their static-browser clients.

## ADDED Requirements

### Requirement: Habitat room admission and presence

The relay SHALL admit up to twelve participants to one `just-like-rabbits` room and SHALL assign each an ephemeral unique number, fictional name, and colour.

#### Scenario: Participant joins available habitat
- **WHEN** a participant joins while fewer than twelve seats are occupied
- **THEN** it receives current presence, host identity, and the latest habitat state

#### Scenario: Habitat reaches capacity
- **WHEN** a thirteenth participant attempts to join
- **THEN** admission returns a full result and the participant does not join the room

### Requirement: Ordered bounded room messages

The relay SHALL distribute validated color-only cursor updates, guest interaction requests, and host habitat snapshots in monotonic order while enforcing sender ownership, payload bounds, and rate limits.

#### Scenario: Valid guest request arrives
- **WHEN** an admitted guest submits a valid cue, cultivation, or speed request within its rate limit
- **THEN** the relay forwards its ordered request to the current host without mutating habitat state itself

#### Scenario: Invalid request arrives
- **WHEN** a participant submits malformed, out-of-range, impersonated, or over-rate data
- **THEN** the relay rejects the data and leaves the stored habitat state unchanged

### Requirement: Room and protocol isolation

The Just Like Rabbits room SHALL not admit to, publish into, or alter a room owned by another registered game.

#### Scenario: Different game is active
- **WHEN** a Just Like Rabbits participant and another game participant connect to the same server process
- **THEN** their room identifiers, presence, and game messages remain isolated

### Requirement: Additive compatible deployment

The relay SHALL preserve existing registered game keys and shared-client behavior when deploying Just Like Rabbits. A deployment MAY end in-memory rooms, and the service SHALL document that temporary interruption without requiring unrelated game-client changes unless regression verification finds a compatibility issue.

#### Scenario: Additive game release is deployed
- **WHEN** a release adds Just Like Rabbits without changing an existing game's contract
- **THEN** existing clients retain their documented protocol behavior after reconnecting to the new server version

# Spec Delta

## Purpose

Provides private authoritative online boxing sessions for two connected clients, including shared match outcomes and temporary recovery of a disconnected seat.

## ADDED Requirements

### Requirement: Ring Rivals players join isolated private two-seat rooms
The service SHALL create or admit clients to a `ring-rivals` room using unique four-character uppercase alphanumeric invite codes, enforce a capacity of two, and isolate its state and messages from every other game.

#### Scenario: Create and join a room
- **WHEN** one client creates a room and another joins its valid code
- **THEN** both clients receive the same room's game state and code

#### Scenario: Reject invalid or full room
- **WHEN** a client supplies an invalid, expired, or full room code
- **THEN** admission fails with an appropriate error and no other game room is affected

### Requirement: The server simulates boxing and match outcomes
The service SHALL validate bounded player-owned action inputs and authoritatively update both boxers, attack timing, guard/evasion, health, stamina, round clock, score, and match phase. It SHALL ignore client-supplied positions, damage, or outcomes.

#### Scenario: Resolve a valid attack
- **WHEN** a player submits a legal attack while the bout is active
- **THEN** the server resolves its timing and defense outcome and broadcasts authoritative state to both seats

#### Scenario: Complete or draw a round
- **WHEN** a boxer reaches zero health or the round clock expires
- **THEN** the server awards a knockout or health decision, draws an exact-health tie without changing score, and declares a match after the best-of-three condition is met

#### Scenario: Reject unauthorized state
- **WHEN** an input exceeds payload limits, rate limits, or the sender's allowed action set
- **THEN** the server ignores it and preserves authoritative game state

### Requirement: A dropped boxer can reclaim the same seat briefly
The room SHALL reserve a disconnected seat and suspend its round clock for up to 15 seconds for automatic recovery. A valid Colyseus reconnection SHALL restore the same identity during that interval. A player joining through the room code SHALL receive a fresh identity and reclaim the vacant seat for as long as the room remains active; this code-based recovery SHALL preserve the connected opponent and match state.

#### Scenario: Recover within the grace period
- **WHEN** the dropped client reconnects before its 15-second reservation expires
- **THEN** the same session, boxer, and current bout resume

#### Scenario: Room-code recovery after automatic recovery expires
- **WHEN** the client does not reconnect within 15 seconds but the opponent remains connected
- **THEN** the vacant seat remains available to a player joining with the room code, using a fresh identity

### Requirement: Existing shared-client consumers remain compatible
The client package SHALL retain its existing default fresh-identity reconnect behavior and enable same-identity recovery only for game protocols that explicitly support it.

#### Scenario: Existing game reconnects
- **WHEN** a client for another game reconnects after a drop
- **THEN** it retains its existing documented reconnect behavior

#### Scenario: Ring Rivals reconnects
- **WHEN** a Ring Rivals client reconnects during its grace interval
- **THEN** the SDK retries the reserved seat and exposes the same session ID to the game client

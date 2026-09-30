# Spec Delta

## Purpose
Provide verified gauntlet-network behavior for the cooperative Gauntlet-inspired 3D dungeon game.

## ADDED Requirements

### Requirement: Admission and identity
The service SHALL support 1-4 players with distinct stable seat colors, late snapshots, departure, fresh reconnect, full/retry and isolation from existing games.

#### Scenario: Admission and identity acceptance
- **WHEN** four players occupy the room and a fifth joins
- **THEN** the fifth receives full until a seat is freed; existing colors remain stable

### Requirement: Authority
The service SHALL validate bounded input and class messages and reject client positions, health and scores.

#### Scenario: Authority acceptance
- **WHEN** a player sends forged or stale input
- **THEN** shared outcomes remain server controlled and movement stops after 300ms

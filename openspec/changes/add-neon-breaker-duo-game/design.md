# Design

## Context

The service registers one Colyseus room class per game and routes browser clients through `/api/join/:game`. Existing rooms expose `input`, `snapshot`, and `gameState` while keeping the simulation independently testable.

## Goals / Non-Goals

**Goals:** Implement deterministic, bounded server-owned arcade simulation, 2-seat admission, late snapshots, and isolated client-compatible messages.

**Non-Goals:** Durable sessions, persistent accounts, private room codes, prediction of game outcomes on clients, changes to existing game protocols.

## Decisions

- Place pure simulation rules in a browser-safe JavaScript module so Node rule tests and the shipped shared client can use the same snapshots without duplicating rules; room networking remains TypeScript.
- Use a 320×576 logical board, a 30 Hz simulation, and 20 Hz snapshots; include numeric paddle/ball/brick identifiers and only JSON-safe arrays/objects in snapshots.
- Assign lane ownership by lowest free seat at join; clamp paddle centers to that lane, reject unknown message shapes and cap each client at 60 messages/second.
- Broadcast complete compact snapshots because the whole board is small and snapshots simplify late-join consistency.
- Keep the new key outside all existing game classes; admission still uses the shared serialized single-room reservation path.

## Risks / Trade-offs

- **Complete snapshots repeat static fields** → Keep the board compact and measure websocket payload size in integration tests.
- **Instance-local sessions can be interrupted** → Preserve the service's existing ephemeral-session documentation.

## Migration Plan

Register the room additively, verify server and client-package tests, then release using the existing versioned workflow. Roll back to the previous tag if live verification fails.

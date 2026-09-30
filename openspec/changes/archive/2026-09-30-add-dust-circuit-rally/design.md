# Design

## Context
Existing Colyseus rooms send generic gameState at 20Hz, accept bounded inputs and simulate independently. The browser client owns anonymous admission and fresh reconnect. Backend hosting can end sessions around five minutes.

## Goals / Non-Goals
Goals: reusable browser-safe racing simulation, stable protocol and fair checkpoint racing. Non-goals: persistent users, private lobbies, storage or hosting migration.

## Decisions
- Add JavaScript ESM track and simulation subpath exports to the existing client tarball, with TypeScript importing the same implementation. This avoids divergent offline and authoritative rules.
- Simulate at 30Hz, transmit at 20Hz, expire input at 300ms, sequence client actions and acknowledge the consumed sequence.
- Use a smooth closed centerline and explicit shortcut branch, width-based boundaries, five ordered directional gates, terrain zones, safe recovery, and deterministic waypoint AI.
- Use a 3-second countdown, 120-second cap, 15-second finish window, 8-second results, then a fresh waiting phase. Freeze four truck identities at countdown; waiting connections retain independent admission seats.
- Publish backward-compatible client version 0.6.0 after existing and new tests. Consumer pins the exact tarball and lockfile.

## Risks / Trade-offs
- In-memory instance loss resets races; show reconnect status and fresh waiting room.
- Collision approximation differs from rigid bodies; test stability, jump landing and recovery.
- Prediction does not replay other trucks' future inputs; reconcile acknowledged local controls while interpolating remote state.

## Migration Plan
Release scoped backend changes through existing Actions; live tests include racing. Preserve existing rollback-on-failure deployment and canonical public alias checks.

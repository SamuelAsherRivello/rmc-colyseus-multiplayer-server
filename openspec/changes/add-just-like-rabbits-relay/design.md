# Design

## Context

The server currently provides isolated process-local Colyseus rooms and a browser-safe `MultiplayerClient`. See `proposal.md` for motivation. The existing production deployment is a single-instance relay; a deployment or process replacement ends its in-memory rooms, which is an accepted documented limitation for this additive game release.

## Goals / Non-Goals

**Goals:**

- Give a room a deterministic participant host and recover authority without making rabbit AI server-authoritative.
- Keep the relay responsible for admission, identities, cursor/action validation, ordering, and the latest transferable snapshot.
- Provide a room contract that a static WebGPU consumer can pin to a released client package.

**Non-Goals:**

- Durable sessions, account identities, permanent storage, server simulation of rabbits, or changing current game contracts.

## Decisions

### Extract a game-neutral host lifecycle helper

Track each eligible participant's monotonic connection order and last liveness observation. The room elects the lowest connection order as host, saves only a bounded, validated transferable payload published by that host, and promotes the next eligible participant after departure or timeout.

Alternative: select the next current client at random. Rejected because it breaks the requested longest-connected rule and makes migration hard to test.

### Relay opaque but bounded habitat snapshots

The relay accepts only versioned bounded snapshot payloads from the elected host and distributes them with relay sequence and timestamps. It does not interpret rabbit rules, letting the browser host own the requested deterministic simulation.

Alternative: make the server run rabbit simulation. Rejected because it contradicts the participant-host architecture and expands generic backend cost.

### Isolate the game protocol

Register `just-like-rabbits` as its own room and join endpoint. Per-room validators enforce max payload sizes, coordinate limits, ownership, and message-rate budgets; shared-client additions remain additive.

Alternative: overload Garden Chat messages. Rejected because it risks existing consumers and cannot enforce habitat-specific authority.

## Risks / Trade-offs

- [Host terminates without a fresh snapshot] → promote with the last accepted bounded snapshot and expose a reconnecting state.
- [Guest snapshot jitter] → include source timestamps and monotonic sequences so the consumer can use its bounded interpolation buffer.
- [A deployment or process replacement ends in-memory rooms] → document that temporary interruption, preserve protocol compatibility, and require existing-game regression checks before release.

## Migration Plan

1. Land host lifecycle utilities and their unit tests without changing existing rooms.
2. Add and test the isolated habitat room and shared-client contract.
3. Package a compatible client version only after all local regression checks pass.
4. Release, deploy, and perform a public two-client verification through the existing single-instance path; roll back by redeploying the prior version if needed.

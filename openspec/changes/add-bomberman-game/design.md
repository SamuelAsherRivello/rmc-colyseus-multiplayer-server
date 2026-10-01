# Design
## Context
Shared Colyseus core 0.17.44 and SDK 0.17.43 support onDrop/onReconnect and allowReconnection. Existing coded gungeon admission can be generalized without modifying its behavior.
## Goals / Non-Goals
Goals: validated server authority, isolated codes, four reserved seats and backward compatibility. No accounts or durable storage; host resets cannot preserve in-memory matches.
## Decisions
Use fixed 60Hz deterministic pure rules and 20Hz snapshots. Inputs use bounded axes, boolean actions and increasing sequence IDs; expire after 300ms. Bomberman-only SDK reconnect preserves identity within a server-granted 15-second window; consent leave removes immediately. Shared package exports rules for consumer prediction. Existing-games protocols remain unchanged. Local integration tests cover the same shared client used by browsers.
## Risks / Trade-offs
Host resets interrupt sessions → report truthfully and investigate duration constraints in consumer acceptance. Concurrent backend changes → fetch/rebase, preserve registrations and rerun all regressions before ordinary push. Release/deploy live tests must include Bomberman.

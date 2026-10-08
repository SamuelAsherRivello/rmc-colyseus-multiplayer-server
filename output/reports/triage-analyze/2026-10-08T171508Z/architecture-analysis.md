# Architecture Analysis

[Overview](overview.md) · [Standardization analysis](standardization-analysis.md) · Architecture analysis · [Verification baseline](verification-baseline.md) · [Back](overview.md)

## Module map

| # | Boundary | Responsibility and evidence |
| --- | --- | --- |
| ARCH02 | [server.ts](../../../../server.ts) and [src/server.ts](../../../../multiplayer-server/src/server.ts) | Thin Vercel entry; Express/Colyseus composition, game registry, HTTP admission, process-local serialization, room-code indexes. |
| ARCH03 | [PrivateCodeRoom](../../../../multiplayer-server/src/private-code-room.ts) and game Room subclasses | Socket lifecycle, 15-second recovery, per-game messages and snapshot cadence. |
| ARCH04 | Simulation modules | Authoritative game rules; some shared with the browser package (for example Bomberman and Street Fighter). |
| ARCH05 | [client package](../../../../multiplayer-server/packages/client/package.json) | Browser admission, status/retry, game events, private-room links, and public exports. |
| ARCH06 | [tests](../../../../multiplayer-server/test/integration.mjs) and [OpenSpec](../../../../openspec/changes/standardize-private-room-flow/tasks.md) | Deterministic rules, local two-client integration, and explicit pending cross-instance acceptance gates. |

Game rooms are isolated by registered key. The server owns game state; clients submit bounded inputs or actions. Several simulations are directly testable without a live room, and the package preserves additive exports. [ParticipantHostRelay](../../../../multiplayer-server/src/participant-host-relay.ts) separates election from transport and accepts a clock value in key operations. These are useful test seams.

## Pressure points and candidates

| # | Candidate | Evidence, value, and risk | Non-goals and verification | Urgency / owner |
| --- | --- | --- | --- | --- |
| ARCH07 | Decide whether the required cross-instance room contract is feasible on the permitted Vercel services. | [src/server.ts](../../../../multiplayer-server/src/server.ts) holds a process-local admission queue and Street Fighter invite map; [PrivateCodeRoom](../../../../multiplayer-server/src/private-code-room.ts) holds recovery state in memory. [OpenSpec task 3.1](../../../../openspec/changes/standardize-private-room-flow/tasks.md) is open. A successful design would preserve room identity through function replacement; premature implementation risks inconsistent seats and lost games. | Do not change public room/client APIs or add an unapproved provider. Verify atomic create/join, ordered broadcasts, ownership transfer, reconnect, and measured free-tier usage on separate instances. | High; existing OpenSpec first, then $triage-rearchitect for a feasible selected design. |
| ARCH08 | Bound admission and recovery ownership after feasibility. | [src/server.ts](../../../../multiplayer-server/src/server.ts) combines three reserve paths, global matching serialization, invite token cleanup, rate limiting, HTTP responses, and room registration. [PrivateCodeRoom](../../../../multiplayer-server/src/private-code-room.ts) coordinates five maps/sets of pending and offline seats plus timers. Clear ownership could reduce cross-game regression risk. An indiscriminate extraction could break Colyseus lifecycle ordering. | No generic framework rewrite. Preserve code collision semantics and public error/status behavior; rerun private-room admission and each coded-game integration suite, including late join and expiry. | Medium, contingent on ARCH07; $triage-rearchitect. |
| ARCH09 | Clarify shared-client contract boundaries. | [client index.js](../../../../multiplayer-server/packages/client/index.js) handles drawing state, generic game snapshots, private codes, SDK recovery, and habitat actions in one class; server TypeScript checking excludes it. A bounded contract check would make additive changes safer, while a split could disrupt external imports. | Keep package name, tarball filename, root export, and two-argument constructor compatible. Package dry-run, consumer checks, and local/live protocol tests are needed. | Medium; $triage-rearchitect only if an actual ownership split is selected; otherwise $triage-standardize for checking/docs. |

The primary architecture issue is a deployment/runtime mismatch, not a proven local gameplay defect. [feasibility.md](../../../../multiplayer-server/documentation/feasibility.md) already records the unverified shared-state and quota gate. Current local tests cover error paths, seat transitions, unauthorized inputs, and several game rules, but no current successful test run or cross-instance result was available here. A passing typecheck would not establish behavioral or deployment continuity.

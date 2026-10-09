Refactor plan · Back

# Refactor Plan: Cross-instance room ownership

- **Run:** 2026-10-09T061758Z
- **Status:** STEP01 approved and completed on 2026-10-09; STEP02 stopped at the published free-quota gate; implementation and release gates remain open
- **Selected candidate:** ARCH07 in [architecture analysis](../../triage-analyze/2026-10-08T171508Z/architecture-analysis.md)
- **Scope:** Four coded games, HTTP admission, Colyseus room lifecycle, shared browser client, Vercel runtime and verification.
- **Focus and blind spots:** Cross-instance room authority only. `.aiignore` and `.triageignore` are absent; no triage exclusions. Provider account usage and two-instance deployment behavior are unmeasured.

## Problem and non-goals

The Vercel entrypoint exposes a process-local Colyseus server. [Admission](../../../../multiplayer-server/src/server.ts) serializes joins with one `joining` promise, searches local matchmaking rooms, and stores Street Fighter invites in a map. [PrivateCodeRoom](../../../../multiplayer-server/src/private-code-room.ts) stores recovery and replacement seats in maps and timers. A reconnect routed to another Function cannot reliably find that room, its seat, or its current game state. The existing [OpenSpec tasks](../../../../openspec/changes/standardize-private-room-flow/tasks.md) explicitly keep cross-instance correctness and the public release gate open.

The refactor must preserve the current four-character code, each game's existing seat capacity, state ownership, public HTTP errors, `MultiplayerClient(endpoint, game, options)`, package name, and tarball shape. It excludes unrelated game rules, the drawing lobby, cosmetic structure, a generic matchmaking framework, third-party services, paid plans, and a production rollout without proof. The host must remain GitHub plus Vercel Hobby as required by the [existing design](../../../../openspec/changes/standardize-private-room-flow/design.md).

## Current model

```text
browser client -> POST /api/join/:game -> src/server.ts
                                         | local joining promise
                                         | matchMaker.query/createRoom/joinById
                                         | Street Fighter invite Map
                       reservation ------> one Function's Colyseus Room
                                                | PrivateCodeRoom maps/timers
                                                | game simulation + snapshots
```

The root [server.ts](../../../../server.ts) is a thin Vercel adapter. The server process owns code uniqueness, reservation, seat recovery, simulation, and broadcast. A second Function has independent copies of all process-local state. The [client](../../../../multiplayer-server/packages/client/index.js) requests a new reservation by code, but current SDK reconnection only covers some games and cannot restore authority from an unrelated process. Current integration tests exercise one local process.

## Desired model and ownership

```text
browser clients -> unchanged join API -> admission adapter
                                            | shared atomic code/lease authority
                                            v
                              fenced logical room owner (epoch, TTL)
                                            | ordered commands + versioned snapshot
                     socket adapters <------> owner/relay boundary
                                            | game-specific simulation
```

One logical room has one fenced writer. A room code maps atomically to a room identity and current owner epoch. Every command has a room, epoch, client identity, and monotonic sequence or deduplication key. Snapshots carry a schema version and last applied sequence. Expired owners cannot publish accepted state. Seat leases and the existing 15-second replacement grace are shared and recoverable. A reconnect on another Function must receive the same logical room and an authoritative snapshot before resuming input. The browser never chooses authority.

This is a target model, not a claim that the permitted services can implement it. [Vercel WebSocket guidance](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections) says connections remain on one Function while later connections can land elsewhere; [Function duration limits](https://vercel.com/docs/functions/configuring-functions/duration) bound the Hobby connection lifetime. Blob has conditional writes but its [Hobby operation allowance](https://vercel.com/docs/vercel-blob/usage-and-pricing) cannot carry a 20 Hz snapshot stream: 72,000 writes per room-hour versus 2,000 included advanced operations per month, before joins or reads. Edge Config's rare-write model is likewise unsuitable. [Vercel Queues](https://vercel.com/docs/queues) is a newer first-party beta candidate for a command/notification relay, but at-least-once delivery and lack of strict FIFO require application ordering; its [metered operations](https://vercel.com/docs/queues/pricing) require a measured quota proof. Queues alone does not supply atomic code claims, owner fencing, or a synchronous low-latency broadcast.

## Contract and migration strategy

| # | Boundary | Contract and compatibility requirement | Migration method |
| --- | --- | --- | --- |
| CONT01 | HTTP admission | Keep `/api/join/:game`, reservation payload, four-character codes, status/error distinction: malformed 400, missing/expired 404, invalid Street Fighter token 403, code conflict/full 409, rate limit 429 with `Retry-After`, unavailable 503. | Characterize exact responses first; insert internal adapter only after shared authority passes the proof. |
| CONT02 | Client package | Keep package name, root export, constructor, current helpers and tarball naming. Existing consumers must continue to load. | Add internal renewal/resume behavior only after server support; package dry-run and consumer checks. |
| CONT03 | Room protocol | Preserve game-specific input and state event shapes; add internal epoch, command sequence, snapshot schema/version, and resume handshake. | Version new internal envelopes; allow previous clients during the release transition or reject with an explicit upgrade response. |
| CONT04 | Persistence | Code claim, owner lease, seat lease, and snapshot must have atomic or fenced ownership with finite TTL. | Prototype disposable room data; no existing persistent state migration is expected because current authority is in memory. |
| CONT05 | Dependency direction | HTTP and socket adapters depend on a narrow room authority port; authority implementation depends on approved first-party primitives; game simulations stay independent. | Add the port after proof, migrate one coded game in preview, then the remaining three. Do not extract a metadata-only port and call it cross-instance support. |

Room loss, exhausted quota, stale snapshots, owner conflict, and unavailable relay must fail closed with a recoverable error; no function may create a second active writer or silently start an empty room under an existing code. A bounded reconnect period may show a reconnecting state. The existing 15-second seat grace and empty-room expiry remain observable.

## Staged implementation and stop gates

| # | Stage | Smallest check | Completion gate |
| --- | --- | --- | --- |
| STEP01 | Capture exact current HTTP, seat, invite, and client contracts as characterization tests before moving code. | Run focused private-room and four coded-game tests. | All existing tests pass, with no changed public responses. |
| STEP02 | Build a disposable two-Function preview proof using only first-party Vercel services. Exercise simultaneous code claims, join from the other instance, ordered input/broadcast, duplicate/reordered delivery, owner death/fencing, snapshot handoff, and reconnect. Measure p95 latency and every storage/queue/function operation under representative traffic for all four games. | Forced cross-instance create/join and owner-failure probe, with logs showing distinct instance IDs. | Stop if atomicity, ordering, recovery, latency, or free Hobby quota cannot be demonstrated. Do not modify production room behavior to bypass this gate. |
| STEP03 | If STEP02 passes, add the narrow authority/transport ports and first-party adapter behind a preview-only switch; keep simulations and public API unchanged. | Contract tests against both in-memory and shared adapters; failover test with stale owner. | Repeated two-instance test shows one writer, no duplicate codes, bounded room unavailability. |
| STEP04 | Migrate one coded game, then Bomberman, Gungeon, Ring Rivals, and Street Fighter in preview; add versioned snapshots and 240-second planned renewal plus early-drop recovery to the shared client. | Game-specific two-client play, code rejoin, full room, token and 15-second grace tests after each game. | Every coded game holds the same logical room and state across multiple renewals in a session longer than ten minutes. |
| STEP05 | Update deployment/docs only after the adapter works; run all local gates, client pack, cross-host preview checks, measured quota check, and public alias acceptance. | Node 24 `npm ci`, `npm run typecheck`, `npm test`, `npm run check:docs`, `npm pack ./multiplayer-server/packages/client --dry-run`. | OpenSpec 3.1–4.2 acceptance evidence recorded; no paid tier, quota overrun, stale owner, or divergent state. |
| STEP06 | Review diff, commit/push all authorized local changes; release through checked-in `release.yml` only after remote main contains the verified commit. | Fetch origin/main and compare exact commit; confirm next version/tag unused. | Release and deploy workflows green; remote tag/release points to intended commit; public alias long-session and game probes pass. |

STEP02 is a feasibility experiment, not an authorization to ship the prototype. The [existing OpenSpec design](../../../../openspec/changes/standardize-private-room-flow/design.md) names Blob and Edge Config as its candidates. Considering Queues would change that durable design decision; update that OpenSpec change and review the measured proof before STEP03. If no candidate passes, record an evidence-backed stop and leave release tasks unchecked.

### Existing deployment discrepancy

On 2026-10-09, the stable `rmc-colyseus-multiplayer-server.vercel.app/api/health` alias returned HTTP 200 with version **0.9.7**. The unique URL created during the v0.9.8 release, `rmc-colyseus-multiplayer-server-1hdavfmho.vercel.app/api/health`, returned HTTP 200 with version **0.9.8** when checked later. [Release run 37415065998](https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/actions/runs/37415065998) published the v0.9.8 tag and client tarball, but its deploy job failed at the selected-release health step after 60 retries; later game and long-session checks were skipped. Diagnose alias assignment and timing separately before any new release. A GitHub release existing is not evidence that the stable public alias runs it.

## Deliberation record

### Orchestrator thoughts

I select a proof-first path because the actual defect is distributed authority, not an untidy module. A simple extraction of `joining` or invite maps would improve code shape while preserving the same failure. Blob or Edge Config as a 20 Hz data plane is contradicted by published quotas; a deterministic replay redesign would require validating all four games and still lacks a relay. Queues warrants a bounded experiment because it is first-party, but its delivery semantics and operation costs are not yet a viable design. The experiment must test a complete owner plus relay path, including admission and WebSocket attachment, not merely a working queue API. Material uncertainty remains about account availability, latency, quota usage, strict owner fencing, and whether the existing Vercel project permits a safe preview. If any is unsatisfied, no production migration or release is justified.

### Per-role summary

| # | Role | Central thoughts | Champion actions | Disposition and rationale |
| --- | --- | --- | --- | --- |
| ROLE01 | Contrarian | First-party quotas and weak ordering make an optimistic migration unsafe. | Two-instance proof, operation accounting, explicit stop and rollback triggers. | **Adopted:** These are release-critical evidence thresholds; no production change before proof. |
| ROLE02 | Dreamer | A fenced single-writer actor with sequence/idempotency and sparse checkpoints could provide a durable room identity; deterministic replay is costly and unproven. | Prototype epoch/sequence protocol; consider command log and Blob checkpoint. | **Adapted:** Test epoch/sequence in disposable proof. **Deferred:** Full event-sourced replay until a feasible relay and game-specific determinism are proven. |
| ROLE03 | Pragmatic | An internal authority port can migrate callers reversibly, but metadata extraction alone cannot connect remote sockets to the room. | Prove data plane first; then narrow adapter and one-game preview migration; preserve HTTP/client contracts. | **Adopted:** This is the smallest implementation path that could solve the selected defect. |

## Verification matrix

| # | Check or scenario | Proves | Baseline result | Stage or completion result | Limitation |
| --- | --- | --- | --- | --- | --- |
| VERI01 | Node 24 `npm ci`, `npm run typecheck`, `npm test`, `npm run check:docs` | Clean install, static checks, current local behavior and docs. | Passed: clean install, typecheck, 79/79 tests, docs check (12 supported games). | Repeat after STEP05. | One process cannot establish shared authority. |
| VERI02 | `private-room-admission-integration.mjs`, `private-room-codes.mjs`, `private-room-links.mjs`, and four coded-game integration files. | Status/error compatibility, code behavior, seat transitions, client helpers, game-specific protocol. | Passed as part of 79/79 suite. | Each migration stage. | Local tests cannot force real Vercel placement. |
| VERI03 | Client package dry-run and consumer import check. | Public package contents/export continuity. | Pack dry-run passed: `rmc-multiplayer-client-0.9.8.tgz` with 10 files; external consumer import not run. | After client change and release. | Packaging does not prove socket recovery. |
| VERI04 | Two independent Function instances, simultaneous claims and code rejoin. | Atomic uniqueness, same logical room, strict ownership. | Not implemented. | STEP02 and STEP03; must pass. | Must record instance IDs and deployed preview revision. |
| VERI05 | Duplicate/reordered commands, owner termination, snapshot restore, seat expiry, quota exhaustion. | Fencing, idempotency, fail-closed recovery and error behavior. | Not implemented. | STEP02–STEP04; must pass. | Fault injection must be repeatable and observable. |
| VERI06 | Two clients, all coded games, >10 minutes, multiple ~240-second renewals, fresh Function routing. | State and room continuity through forced replacement. | Not implemented. | STEP04 and production gate; must pass. | Live capacity and quota are time-bound measurements, not an SLA. |
| VERI07 | Metered operations, bandwidth, CPU/memory, queue latency and limits under representative sessions. | Hobby cost/throughput fit with headroom and no paid overage. | Published quota projection only. | STEP02 and STEP05; must pass. | Usage depends on traffic mix; document workload and safety margin. |
| VERI08 | Public alias health plus create/share/auto-join/refresh and long-session checks after release. | Deployed artifact and consumer flow. | Health only: stable alias 0.9.7; v0.9.8 unique deployment URL healthy when rechecked. No game or long-session check this run. | STEP06; must pass. | GitHub release and unique deployment health do not prove the stable alias. |

## Risk, rollout, and rollback

Blast radius includes HTTP admission, all four coded game rooms, client reconnect, and the production deployment. Keep the existing production revision live while testing an isolated preview. Gate shared authority behind a preview-only setting until every contract and cross-instance test passes. Log room ID, owner epoch, instance ID, last applied command, and snapshot version without player secrets. Roll back to the prior Vercel deployment on duplicate ownership, divergent snapshots, lost seats, excessive latency, failed renewal, or quota pressure. A rollback that cannot read a newer snapshot must return an explicit unavailable/expired result rather than invent state. Never automatically promote a failing preview.

## Open questions and approval

1. Is a Vercel Queues experiment within the existing GitHub/Vercel-only constraint, and will the account/project allow safe preview isolation and operation measurement? Its appearance after the Blob/Edge design is a material OpenSpec update before implementation.
2. What measured p95 input-to-remote-snapshot latency and concurrent room-hour budget are acceptable for the four games on Hobby? The proof should record actual values; no threshold is asserted without player-facing evidence and quota headroom.
3. Can Colyseus room reservation/socket attachment be adapted across instances without breaking the public reservation and game event contracts? This is the central feasibility question in STEP02.

**Approval recorded:** The user approved bounded STEP01–STEP02 work on 2026-10-09. STEP03–STEP06 remain conditional on a passing proof and the existing OpenSpec release gate. A passing local suite alone does not authorize a stable-server release.

## Approved work and feasibility outcome — 2026-10-09

The user approved the bounded STEP01–STEP02 work and requested a Git update and deployment. STEP01 produced [a separate-process characterization probe](../../../../multiplayer-server/test/feasibility/cross-instance-baseline.mjs); it is outside the normal `npm test` glob because it documents a known failing cross-instance contract. The probe passed its *negative-baseline* assertions: two separate Node 24 processes had distinct instance IDs; a code created on the first returned **404** when joined through the second; simultaneous creation of the same code on both returned **200/200** and distinct room IDs. This is a deterministic local demonstration of the architecture defect, not a cloud proof.

All four coded game rooms broadcast at 50 ms intervals: [Bomberman](../../../../multiplayer-server/src/bomberman-room.ts), [Gungeon](../../../../multiplayer-server/src/gungeon-room.ts), [Ring Rivals](../../../../multiplayer-server/src/ring-rivals-room.ts), and [Street Fighter](../../../../multiplayer-server/src/street-fighter-room.ts). If a remote instance must receive just one 20 Hz state stream through Queues, it needs **72,000 sends per active room-hour**. [Vercel Queues pricing](https://vercel.com/docs/queues/pricing) includes the first 1,000,000 API operations on Hobby and counts sends, receives, acknowledgments, and notifications; therefore 13.9 aggregate room-hours/month is an optimistic upper bound from sends alone. One room used for one hour each day would require 2.16 million sends/month before any receive, acknowledgment, input, lease, snapshot, or function use. Idempotency or larger-than-4-KiB messages raise the count. Batching may reduce receives, but cannot reduce one send per 20 Hz state message without changing the current cadence. This is a source-and-published-quota projection, not live metering; it assumes one state message per tick to a remote instance and a one-hour/day representative workload.

[Blob's Hobby allowance](https://vercel.com/docs/vercel-blob/usage-and-pricing) is 2,000 advanced operations/month; one write per tick would require 72,000/hour, so it cannot be the state stream. Edge Config has 100 writes/month under [Hobby limits](https://vercel.com/docs/plans/hobby). Queues provides at-least-once asynchronous delivery and no strict FIFO, so it also needs ordering, owner fencing, and a state store; it is not a complete Colyseus room authority by itself. A Cloud preview was **not deployed**: the cost floor for a minimal daily room already exceeds the allowed free quota, and no first-party architecture has been shown to preserve the public protocol with headroom. Provisioning a queue or Blob store would consume quota without resolving that contradiction.

| # | Gate | Result | Consequence |
| --- | --- | --- | --- |
| EXEC01 | Existing local server behavior | Node 24 clean install, typecheck, 79/79 tests, docs check, package dry-run passed; separate-process negative probe passed. | Local implementation is characterized; cross-instance requirement demonstrably fails. |
| EXEC02 | Free first-party authority proof | Blob/Edge Config write budgets fail 20 Hz; Queues sends alone exceed the one-hour/day illustrative workload. No cloud latency, operation, or owner-fencing proof. | Stop before shared adapter and production migration. OpenSpec tasks 3.1–4.2 remain unchecked. |
| EXEC03 | Existing deployment | Latest unique v0.9.8 deployment is `READY`, but the stable public alias still serves v0.9.7; [release run 37415065998](https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/actions/runs/37415065998) failed in deploy verification. | No claim that the stable alias serves the release or current source; do not dispatch another release. |

**Orchestrator conclusion:** The selected architecture defect is real, but no demonstrated first-party, free-quota path currently supports the stated room continuity at representative daily use. I adopt the Contrarian stop gate, the Dreamer's fenced-writer model as a future test target, and the Pragmatic negative characterization and reversible boundary only after a viable data plane is proven. The user could choose a lower documented usage target, relax the provider/plan constraint, or revisit this if Vercel offers a suitable first-party realtime authority. None is assumed here. A report/test-only Git update is safe; promoting a new backend release as “stable” is not.

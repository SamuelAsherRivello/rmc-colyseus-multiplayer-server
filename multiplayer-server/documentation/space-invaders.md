# Space Invaders participant-host relay

The browser host owns all world simulation. The server only authenticates private
seat recovery, orders input/membership messages, elects a host, and retains its
opaque checkpoint. This is isolated from the Rabbits relay and existing games.

POST `/api/join/space-invaders` with `{create:true}` or `{code:"ABCD"}`.
The response contains `reservation`, normalized `code`, and private `token`.
Store that token per room; never put it in an invite URL. Supply `reconnectToken`
when returning, including after intentional leave. Four occupied seats include eliminated spectators and 15-second drop reservations. Intentional leave releases occupancy while retaining private identity/life recovery.
Replacing a live connection with the same token disconnects the old socket.
The last connection leaving starts a 15-second empty-room disposal timer.

`snapshot` returns stable seat IDs, socket IDs, epoch, runId, readiness,
`transfer` and unacknowledged `journal`. `gameAction` carries server-stamped
sequence, sender seat, timestamp, type and payload. Inputs contain client
sequence and `{move:-1|0|1,fire:boolean}`; start is host-only. Membership records
neutralize disconnected inputs. Client sequences reject duplicates. No client
chooses its sender, relay sequence, host epoch or room run identity.

The oldest active participant is host, even if spectating. Heartbeats every
second expire after three seconds. Authority changes increment `epoch`, clear
readiness and emit `hostTransfer`. Restore checkpoint, replay journal, then send
`hostReady:{epoch}`. A stale host cannot publish. Accepted `hostSnapshot` has
`protocolVersion:1`, `epoch`, `runId`, `tick`, `lastAppliedRelaySeq`, `random` and
`state`. The host can never acknowledge future or previously discarded actions.
Acknowledgement drops that journal prefix. 256 pending actions pause recovery
explicitly; no silent world reset. Checkpoints have a 12,288-byte UTF-8 bound,
finite numbers, within the 16 KiB transport limit. Each socket is capped at 60
messages per second. Inputs are capped at 256 bytes.

Vercel uses process-local rooms and a 300-second function limit. Four-minute
sessions are deployment-tested. Process eviction, cross-instance routing, or
platform socket closure can expire a room; these are backend failures, distinct
from browser host migration. This release adds no external hosting provider.

The deployment gate runs every registered game's assertions against staging.
Transient public-network or cold-instance failures receive at most one rerun,
using Node 24's persisted failed-test state. Both attempt logs are retained as
workflow artifacts. Every assertion must pass before promotion; local checks
and the game-specific duration/migration probes retain their separate gates.


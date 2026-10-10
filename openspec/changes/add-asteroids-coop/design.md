## Context
Consumer contract: sibling `babylon-lite-asteroids-multiplayer-clone/openspec/changes/create-hosted-asteroids-coop/`. Host creator simulates all physics and outcomes; Colyseus validates/relays inputs and complete snapshots. Host elimination does not transfer authority. Actual host departure ends the room.

## Decisions
- Game key `asteroids-coop`, max four connected seats including spectators.
- Immutable `asteroids-v1` tuning and deterministic seeded browser-safe rules in the released client package. Exact wave one: three one-hit parents, two one-hit terminal children each.
- Public random participant ID and separate private bearer recovery token. Only the token authenticates a returning ledger; tokens never appear in snapshots or invite URLs. At most 128 retained identities.
- Host publication requires creator connection, monotonic run/tick and current membership serial. Wire budget 12 KiB beneath transport 16 KiB. Guest input is bounded and sequenced.
- Host retains disconnected personal lives/score ledger; connected participants determine defeat. Five seconds of results then collective wave-one restart with three lives.
- Existing Vercel credentials were verified using workflow run 38079249214, which returns sanitized metadata only. Fluid Compute enabled; no configured datastore or integrations. Existing process-local rooms remain insufficient for long sessions; hosting work is an explicit unreleased prerequisite.

## Risks
Free quotas, cross-instance admission, planned host renewal vs actual loss, background host throttling, anonymous storage clearing. Do not narrow acceptance to four minutes or declare successful health checks as gameplay proof.

## Verification
Run rules and real Colyseus integration tests locally, existing regressions and type/docs checks, then public ten-minute shared-state recovery and browser tests in the consuming game before release claims.
## Asteroids-only first-party continuity migration

The user requires Vercel Hobby and authorizes implementation and delivery without provider alternatives. The existing bounded hosting release is preserved for existing games. Asteroids adds its own cross-instance path rather than claiming the existing process-local Colyseus reservation is portable.

The shared server's WebSocket transport dispatches `/asteroids` to a JSON message extension; all other paths still use the unchanged Colyseus handshake. The browser-safe Asteroids connection API chooses the advertised transport. Production refuses a process-local fallback when shared storage is absent. Authentication occurs in the first socket message, never a token-bearing URL. Thus HTTP admission and the following WebSocket may reach different Functions.

Private Vercel Blob owns code uniqueness, hashed recovery identities, connected seats, creator identity, membership serial, and socket generation. Exclusive creation and ETag conditional writes serialize admission across instances. Consistent uncached reads supply the latest registry. Runtime Cache holds short-lived complete frames, guest input, and immutable registry revisions; it cannot create or elect a host. Host browser memory retains the full simulation, random state and recovery ledger. Cache loss fails closed rather than resetting a run.

Each socket generation has separate frame/input keys, preventing an old socket from overwriting a renewed socket's data. Planned renewal every 210 seconds uses the existing secret identity and current generation to acquire a new generation through CAS, then authenticates a replacement socket before closing the old one. The host browser keeps its world throughout. An old generation's close cannot remove the new generation. Actual host closure ends the room and invalidates invites; guests are never elected. Guest reattachment keeps its public player ID and therefore the host's lives/score ledger.

The preview Runtime Cache probe passed 20 fresh cross-function reads with distinct instance UUIDs. Credentialed setup confirmed Hobby and provisioned a private `iad1` Blob store connected to the existing project; no credentials were logged. Seven injected-store concurrency/lifecycle tests and one real two-socket-server integration test pass. Public multi-renewal evidence is pending; this design alone does not satisfy the sustained-session gate.

Blob writes occur on creation, admission, departure and renewal, never on simulation ticks. A two-player ten-minute session needs approximately eleven metadata writes including two renewals per participant and final closure, plus membership reads (one per connected socket per fifteen seconds). Frames and input use Runtime Cache at no more than twenty Hz per participant. This remains a quota-limited Hobby demo, not an unlimited service. Blob's published Hobby allowance is 2,000 advanced and 10,000 simple operations monthly; Runtime Cache, Function memory and transfer allowances also apply. No upgrade or paid overage is enabled. Service failures must surface honestly and fail closed.

References: https://vercel.com/docs/vercel-blob/using-blob-sdk; https://vercel.com/changelog/vercel-blob-now-supports-consistent-reads-on-private-storage; https://vercel.com/docs/vercel-blob/usage-and-pricing; https://vercel.com/docs/functions/websockets.


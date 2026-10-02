# Hosting feasibility — 2026-09-28

## Updated free Vercel feasibility — 2026-10-02

The current public Vercel endpoint `https://rmc-colyseus-multiplayer-server.vercel.app/api/health` returned HTTP 200 on 2026-10-02 and reports version `0.9.7`. Its release tag predates the local private-room-flow implementation: `v0.9.7:multiplayer-server/src/server.ts` accepts six-character codes for Gungeon, Bomberman, and Ring Rivals, and the tagged client does not export the four-character room-link helpers. A live Neon Breaker integration check also failed because the v0.9.7 snapshot omits `serverTime`, which the current source and client-side smoothing contract require. Do not publish consumers that use the new four-character flow or claim timestamp-based snapshot verification until a compatible backend release is deployed.

The updated Vercel plan is technically capable of WebSockets, but its limits and the candidate shared-store quota are a material fit risk:

- Vercel's [WebSocket documentation](https://vercel.com/docs/functions/websockets), last updated 2026-08-10, says WebSockets are beta on all plans, each socket is pinned to one Function instance, reconnects are not guaranteed to reach the same instance, and sockets close when the Function reaches its maximum duration. It also says active socket time uses the same Function usage limits and pricing model.
- Vercel's [Hobby included-usage table](https://vercel.com/docs/plans/hobby) lists 4 active CPU-hours, 360 GB-hours provisioned memory, 10 GB fast origin transfer, and 1,000,000 Function invocations per month.
- Upstash's [Redis pricing](https://upstash.com/pricing/redis), checked 2026-10-02, lists 500,000 commands, 10 GB bandwidth, and 256 MB data for Free.
- The existing coded real-time rooms broadcast authoritative game state every 50 ms (20 Hz). One shared-store publish per tick would consume 72,000 commands per active room-hour, leaving at most 6.94 aggregate room-hours per month at the published Free command ceiling. This is an optimistic lower bound: it excludes persistence writes, joins, inputs, leases, reconnect reads, and other games. Two commands per tick halves the ceiling to 3.47 aggregate room-hours. The room broadcast cadence is visible in `multiplayer-server/src/{bomberman,gungeon,neon-breaker,ring-rivals,street-fighter}-room.ts`.

This is a quota projection from the current source cadence, not a live Upstash usage measurement: no Upstash database or credentials were provisioned for this feasibility run. It is enough to reject any claim that the free-tier requirement is proven. The updated OpenSpec's cross-instance and no-paid-overage gate therefore remains open. The previous public Vercel endpoint is still serving the old single-instance process-local implementation; endpoint health does not establish cross-instance room continuity or free-tier capacity.

Deployment dpl_CQGsysdik4aLRxSh67ETibeSkw9L at https://rmc-colyseus-multiplayer-server.vercel.app.

- TypeScript check: pass.
- Two local clients: pass.
- Two clients against fresh live deployment: pass.
- Independent hosts: this Windows computer and GitHub Ubuntu runner in Azure eastus.
- Duration: 660 seconds each; three joins each (initial plus two timeout recoveries).
- Shared room sequence on both hosts: uHebGVriS, LPG3Vvb0-, bdjo2weQ1.
- Messages received: local 601; GitHub runner 597.
- CI evidence: https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/actions/runs/36427675103

This is bounded experimental evidence, not a guarantee of singleton routing or production reliability. Vercel ended sockets around five minutes. The SDK first attempted session restoration before the probe joined fresh rooms; the final shared client will explicitly disable automatic session restoration.

The later drawing and capacity results below supersede the initial probe. CLI deployment works; automated release access remains a separate gate.

## Drawing implementation verification

The final drawing protocol passed between independent local Windows and GitHub Ubuntu hosts in room A8WYHUWlL. Local: 145 observations in 90 seconds; runner: 148 observations in 75 seconds. Evidence: https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/actions/runs/36431402375.

Final deployment dpl_4aTorGu62edPVTcv5iTSJbFhH8GR passed the full integration suite with 12 clients, rejection of client 13, ownership, late-join, departure cleanup, seat reuse, matchmaking restriction, and fresh automatic reconnect. The test body completed in 27.5 seconds. Browser/UI verification is recorded in the frontend repository.

The replacement VERCEL_TOKEN passed direct project authorization, CLI account verification, production deployment and the two-client live probe in [run 36445269245](https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/actions/runs/36445269245). All required deployment credentials are configured. The Release workflow will publish the first client tarball and deploy its tagged source.

## Released deployment

Backend/client v0.1.0 was published and deployed by [Release run 36445588819](https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/actions/runs/36445588819). The tagged deployment is dpl_BjHj2FL88CD6aT5aji7VZkPvDn1u. Its automated live drawing suite passed, including 12 clients and rejection of a thirteenth. The public tarball was installed with a clean npm ci in the frontend.

Rollback was exercised: production moved back to dpl_6phkByJyyWPGcmFf8X6XxcEbzATW, then the released dpl_BjHj2FL88CD6aT5aji7VZkPvDn1u was promoted again. Both CLI operations completed successfully. The frontend's public gameplay verification runs against the restored release.

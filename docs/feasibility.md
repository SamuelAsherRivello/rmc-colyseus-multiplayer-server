# Hosting feasibility — 2026-09-28

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

# Gungeon verification — 2026-09-30

Backend/client release v0.7.0; workflow 36720694359 succeeded for release and deployment. Public health reports 0.7.0 with gungeon and all six earlier registered games. Client release asset rmc-multiplayer-client-0.7.0.tgz exists and is pinned by the frontend.

Merged local typecheck and all 27 tests passed, including the concurrent racing extension. The checked-in Node 24 deployment workflow repeated typecheck/tests locally and against the public endpoint successfully. Local shell uses Node 26; CI supplies the required Node 24 check.

Dungeon integration verifies private creation, code joining, two-client current state, readiness, weapon/movement synchronization, malformed input rejection, four-seat capacity, distinct coded worlds, hot departure, seat retry, fresh identity reconnect into the same code and direct matchmaking denial. Deterministic tests verify normalized/expired movement, cover, roll invulnerability/cooldown, pistol/scatter/burst patterns, friendly fire exclusion, prop damage, upgrade ownership, enemy patterns, count scaling, shared loot healing, revival, fifth-wave boss, defeat and leader replay.

Two independent real Edge/WebGPU frontend sessions connected to this deployed backend. An input-driven playthrough reached the fifth wave, selected upgrades, and defeated the boss in 107 seconds. An earlier run showed revival and team defeat. No health grants or privileged server test commands were used. Frontend release and public browser verification are tracked separately in its repository.

In-memory Vercel limits remain: fresh identities, expired last-departure rooms, approximately five-minute sessions and potential deployment interruptions.

Frontend v0.0.3 is now live at https://samuelasherrivello.github.io/babylon-lite-enter-the-gungeon-clone/. Release 36727262087 and Pages deployment 36727501148 succeeded. All three real public Edge/WebGPU browser tests passed: two-client combat/hot join/drop/reconnect, emulated concurrent touch controls and team defeat/leader replay. Frontend specs are synced and archived as 2026-09-30-add-gungeon-client.

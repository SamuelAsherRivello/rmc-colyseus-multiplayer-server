# Racing verification

2026-09-30: Node 24.19.0 regression suite passed all 23 tests. TypeScript typecheck and strict OpenSpec validation passed. Seven racing rule tests cover readiness/capacity, bounded and stale inputs, ordered directional lap gates, safe recovery, contested pickups, full AI race/replay and hard timeout. Racing integration covers independent clients, readiness authority, frozen grid, late arrivals, synchronized motion, forged input, fifth-player rejection, drawing isolation, AI departure substitution, explicit full-room retry and fresh reconnect.

Target release: backend and shared client 0.6.0. Public verification pending release workflow. Browser gameplay and Blender asset checks are tracked in the consumer project.

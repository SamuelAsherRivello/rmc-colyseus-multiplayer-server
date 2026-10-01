# Tasks

## 1. Room and Simulation

- [x] 1.1 Implement a pure, tested `NeonBreakerSimulation` for paddles, balls, brick types, score, lives, three waves, powerups, win/loss, launch and restart.
- [x] 1.2 Add a two-seat room with bounded/rate-limited owner inputs, current snapshots, 30 Hz simulation, 20 Hz updates, and departure neutralization; verify with two-client integration.
- [x] 1.3 Register `neon-breaker-duo`; extend health/admission tests to verify capacity and isolation from another game key.

## 2. Contract and Verification

- [x] 2.1 Document message/snapshot contract and add game registry entry, with the demo labeled in development.
- [x] 2.2 Run `npm run typecheck` and the complete `npm test` suite, including rule, late-join, input validation, capacity, departure, and isolation cases.
- [ ] 2.3 Extend deployment live checks to exercise a complete game-specific state exchange, then release and deploy under a new package version.


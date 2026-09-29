# Gauntlet 3D verification

Released backend/client v0.5.0. Canonical production health reports 0.5.0 and all five registered games.

- Full Node 24 regression suite: 15 passing tests, including room capacity, late join, identity, forged input, classes, victory/defeat and restart.
- Production deployment and live tests: https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/actions/runs/36611077569
- Browser client full-level keyboard playthrough completed, with duplicate-class clients and stable seat colors.
- A detached-tag deployment initially left the canonical alias on 0.4.0. The workflow now assigns the canonical alias explicitly and checks the health version before live tests.

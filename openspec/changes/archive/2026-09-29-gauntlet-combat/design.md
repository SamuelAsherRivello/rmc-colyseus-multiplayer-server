# Design

## Context
Use deterministic simulation separate from room. A 21x25 tiled dungeon with corridors, four monster generators, key, food and treasure. Destroy generators and carry shared key to exit. Four classes have distinct attacks/speed/armor. Switch preserves health fraction and cooldowns. Ghosts chase, grunts melee, demons fire, lobbers telegraph area attacks. Downed players await restart or team completion; restart only after terminal outcome by lowest seat; solo valid.

## Goals / Non-Goals
Goals: fulfill the supplied game brief and verify behavior. Non-goals: accounts, persistent saves, multiple levels.

## Decisions
Use deterministic simulation separate from room. A 21x25 tiled dungeon with corridors, four monster generators, key, food and treasure. Destroy generators and carry shared key to exit. Four classes have distinct attacks/speed/armor. Switch preserves health fraction and cooldowns. Ghosts chase, grunts melee, demons fire, lobbers telegraph area attacks. Downed players await restart or team completion; restart only after terminal outcome by lowest seat; solo valid.

## Risks / Trade-offs
Hosted sessions are temporary; disconnects create fresh identities. GPU support and physical touch require explicit verification.

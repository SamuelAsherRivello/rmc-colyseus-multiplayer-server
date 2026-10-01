# Supported games

| Game | Room key | Capacity | Client package | Frontend |
|---|---|---|---|---|
| Bomberman Clone | bomberman | 4 | 0.9.2+ | [Multiplayer preview](https://samuelasherrivello.github.io/babylon-lite-bomberman-clone/?mode=online) |
| Dust Circuit Rally | dust-circuit-rally | 4 | 0.6.0+ | [Live demo](https://samuelasherrivello.github.io/babylon-lite-super-offroad-clone/) |
| Garden Chat | garden-chat | 12 | 0.3.0+ | [Live demo](https://samuelasherrivello.github.io/babylon-lite-garden-chat/) |
| Gauntlet Clone 2D | gauntlet-2d | 4 | 0.4.0+ | [Live demo](https://samuelasherrivello.github.io/babylon-lite-gauntlet-clone-2d/) |
| Gauntlet Clone 3D | gauntlet-3d | 4 | 0.5.0+ | [Live demo](https://samuelasherrivello.github.io/babylon-lite-gauntlet-clone-3d/) |
| Neon Breaker Duo | neon-breaker-duo | 2 | 0.9.3+ | [In development](https://samuelasherrivello.github.io/babylon-lite-arkanoid-clone/) |
| Multiplayer Draw | multiplayer-draw | 12 | 0.1.0+ | [Live demo](https://samuelasherrivello.github.io/babylon-lite-multiplayer-draw/) |
| Ring Rivals | ring-rivals | 2 | 0.9.3+ | [In development](https://samuelasherrivello.github.io/babylon-lite-ring-rivals/) |
| Street Fighter II Clone | street-fighter-ii | 2 | 0.9.4+ | [In development](https://samuelasherrivello.github.io/babylon-lite-street-fighter-clone/) |
| Sumo Battle | sumo-battle | 12 | 0.2.0+ | [Live demo](https://samuelasherrivello.github.io/babylon-lite-sumo-battle/) |

All packages are @rmc/multiplayer-client. Before changing a shared protocol, review each game, update affected consumers and test public URLs. Short downtime and session loss are acceptable; leaving existing demos broken is not.

## Enter the Gungeon Clone

`gungeon` � 1�4 players per private room code � shared client 0.7.0+ � [Live demo](https://samuelasherrivello.github.io/babylon-lite-enter-the-gungeon-clone/) � [Source](https://github.com/SamuelAsherRivello/babylon-lite-enter-the-gungeon-clone). Server-authoritative wave arena, three weapons, upgrades, dodge, revive, coded rooms and hot join/drop. See the client contract for admission options.

## Bomberman Clone

bomberman — 2–4 players, private codes, authoritative bomb arena, 15-second identity recovery. The next release adds capped bomb/range/speed pickups, telegraphed sudden death, automatic rounds, first-to-three matches and ready-gated rematches. A monotonic elapsed-time accumulator keeps fixed 60Hz simulation ticks consistent despite timer jitter; snapshots remain 20Hz. The public preview currently pins 0.9.2; full-game client acceptance follows the new server release. [Multiplayer preview](https://samuelasherrivello.github.io/babylon-lite-bomberman-clone/?mode=online).

## Street Fighter II Clone

`street-fighter-ii` supports private two-player invite rooms, server-authoritative 60 Hz combat, and per-seat 15-second recovery tokens. The client synchronizes game snapshots at 20 Hz and uses the shared combat rules from the versioned client package. Rooms and invites are in-memory and can be interrupted by process loss or serverless routing. [Demo in development](https://samuelasherrivello.github.io/babylon-lite-street-fighter-clone/).


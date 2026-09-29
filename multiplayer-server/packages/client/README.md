# RMC Multiplayer Client

Install the exact GitHub Release tarball URL and commit the lockfile.

```js
import { MultiplayerClient } from "@rmc/multiplayer-client";
const session = new MultiplayerClient("https://rmc-colyseus-multiplayer-server.vercel.app", "multiplayer-draw");
const unsubscribe = session.subscribe((state, event) => render(state, event));
session.connect();
// On teardown: unsubscribe(); session.disconnect();
```

State exposes connection status, sessionId, roomId, players, capacity, error, and a Map of strokes.
Messages: cursor ([x,y] or null), stroke ({id, offset, points, complete}), erase (server stroke ID).
Coordinates are normalized in [0,1]. Stroke batches contain at most 64 points.
On disconnect the state clears and automatic retry creates a fresh identity. Full rooms require explicit connect() retry.
Do not put credentials in frontend configuration. Persistent-user-rejoins is deferred.

## Live Demos

This package is part of **RMC Colyseus Multiplayer Server**, which has no standalone demo. These consuming projects use the shared service:

- [Multiplayer Draw](https://samuelasherrivello.github.io/babylon-lite-multiplayer-draw/) — a shared drawing canvas with hot join and departure cleanup.

See the [server README](../../../README.md) for setup and the [game registry](../../documentation/games.md) for supported consumers.

## Sumo Battle (shared client 0.2.0)

Create `new MultiplayerClient(endpoint, "sumo-battle")`. Subscribe to `state.gameState` (also present in the initial snapshot) and `gameState` events. Send `input` with `{x, z, dash}` at 20Hz. Axes must be finite in [-1,1]; dash is boolean. The server normalizes movement, applies a 1.5s dash cooldown and expires input after 300ms. Send zero input on blur, local pause and pointer cancellation. Never send positions or scores.

`gameState` contains `match`, simulation `time`, `radius`, `winner` (session ID or null), `restartIn`, `event` ({serial,text}), and `wrestlers`. Wrestlers expose id/number/name/color, bot, x/z, vx/vz, angle, score, cooldown, out (respawn seconds), and shield (spawn grace seconds). The server awards one point to a recent collision opponent when a wrestler exits, and declares the first to three champion. After eight seconds it resets scores for the next match. There is no client reset command. A single human gets a labeled server AI opponent; it is removed when a second human joins. Late joiners receive current state and zero score. Refresh/reconnect loses identity and score. Local pause does not pause opponents. Hosting and deployment can reset matches.

Generic game state clears on connect, connection loss, and disconnect. Existing drawing messages and stroke state remain compatible.
## Garden Chat
Use game key `garden-chat`. Send `move` with `{x,z}` normalized axes (refresh within 300ms), or `chat` with a plain string up to 280 characters. State exposes `players` with x/z and `chats` with the latest 100 messages. Events: garden, chat, snapshot, presence, departed. Chat rate: one per 750ms. History is in-memory and resets when the room closes. Local pause must send zero movement.

<<<<<<< HEAD
## Gauntlet 3D (0.5.0)

Use game key `gauntlet-3d`. Send `input` at 20Hz with `{x,z,attack,magic}`: finite axes in [-1,1], boolean actions. Inputs expire after 300ms. `class` accepts `warrior`, `valkyrie`, `wizard`, `elf`; switching preserves health fraction, cooldowns, position and identity. Auto-aim selects the closest visible enemy or altar; without a target shots follow facing. `restart` is accepted only from the lowest active seat after victory/defeat. No client position, health or score authority. Rate limit 60 messages/second.

`state.gameState` contains level rows (# wall, . floor), players, enemies, generators, pickups, shots, blasts, exit, key, phase, time, match and event. x/z are tile coordinates; rows are z. Classes have distinct speed, health, damage and cooldown. Local pause sends zero input; the shared game continues. Full rooms need explicit retry. Reconnect creates a fresh identity. Key belongs to the team. Victory requires four destroyed altars and reaching the exit with the key; all fallen means defeat. Live tests require an otherwise empty Gauntlet room.

=======

## Gauntlet 2D

Use game key `gauntlet-2d` with the released shared client. Send `input` at 20 Hz: `{x,y,ax,ay,attack}`; four axes must be finite within [-1,1], attack boolean. Zero aim uses nearest visible target. Input expires after 300 ms; send zeros on blur/pause/cancel. Send `select` with `warrior`, `valkyrie`, `wizard` or `elf`. Switching never restores health or cooldown. No client positions, damage, keys or reset commands are accepted.

`gameState` includes round, time, map, players (id, number, name, color, hero, x, y, hp, cooldown, shield, revive, facing, kills), enemies, generators, shots, items, keys, treasure, status, restartIn, event and exit. The entire snapshot is current for late join. Capacity is four; a fifth receives full status. All dead means defeat; two keys and all four destroyed generators unlock the exit. Victory or defeat automatically replays after ten seconds. Local pause does not stop the shared world. Stand near a downed ally for 2.5 seconds to revive. Reconnect is a fresh player; no persistent progress. No existing drawing, sumo or garden protocol changes.
>>>>>>> origin/main

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


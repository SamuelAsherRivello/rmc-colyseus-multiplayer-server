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

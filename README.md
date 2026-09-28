# RMC Colyseus Multiplayer Server

A reusable Colyseus backend and shared browser client for small multiplayer demos. Hosted on Vercel Hobby; clients can be hosted on GitHub Pages.

**Status:** drawing backend deployed and integration-tested. First automated release is pending the GitHub Actions secret `VERCEL_TOKEN`. No shared-client release is published yet.

[Health endpoint](https://rmc-colyseus-multiplayer-server.vercel.app/api/health) · [Multiplayer Draw](https://github.com/SamuelAsherRivello/babylon-lite-multiplayer-draw) · [Hosting evidence](docs/feasibility.md)

## Custom Shared Features

| Feature | Available behavior |
|---|---|
| Hot join / hot drop | Automatic anonymous admission; remove departed presence and game-owned artwork after disconnect detection. |
| Player identity | Lowest free ordered seat; fresh session ID, server-generated deterministic name/color; existing seats remain unchanged. Active colors are distinct. |
| Shared client | `MultiplayerClient` exposes status, session ID, room ID, players, occupancy, retry, game messages, and subscription/teardown. |
| Admission and capacity | One room per game within the running instance; capacity 12 for drawing; full status with explicit retry and no normal overflow room. Direct drawing matchmaking is blocked. |
| Fresh reconnect | Exponential backoff, capped at 15 seconds; SDK identity restoration disabled. No persistent-user identity. |
| Drawing relay | Normalized strokes/cursors, active-stroke snapshots for late joiners, whole-stroke ownership enforcement, departure cleanup. |

**Future feature: `persistent-user-rejoins`.** Not implemented. Every reconnect and refresh creates a fresh user, and previous artwork is removed.

New games should review this catalog and [the game registry](docs/games.md). Add broadly useful lifecycle/UI support to the shared client, document it here, and pin its release in each consumer. Use a smaller capacity when gameplay requires it.

## Run and verify

Use Node 24 and npm:

```sh
npm ci
npm run typecheck
npm test
npm run dev
```

Server port defaults to 2567; override `PORT`. Tests start their own server on 2678.
Set `SERVER_URL` before `npm test` to run the same ownership, late-join, cleanup, fresh-reconnect, seat-reuse, 12/13-capacity checks against a live server. Live integration checks need an otherwise empty drawing session.

## Shared client API

See [package documentation](packages/client/README.md). Build locally with `npm pack ./packages/client --pack-destination artifacts` after creating the artifacts directory.

After release, install the exact asset URL:

```sh
npm install https://github.com/SamuelAsherRivello/rmc-colyseus-multiplayer-server/releases/download/v0.1.0/rmc-multiplayer-client-0.1.0.tgz
```

This URL is the intended first release asset, **not yet published**. Commit the consumer lockfile. The client needs only the public backend URL, never a Vercel token.

HTTP: `GET /api/health`; `POST /api/join/multiplayer-draw` returns a Colyseus seat reservation or 409 when full. Unknown games return 404; transient admission failures return 503. WebSocket messages are documented in the package. Drawing is limited to 100 strokes and 10,000 points per player, 2,048 points per stroke, and 64 points per batch. Erase strokes to reclaim space.

## Releases and rollback

The root `package.json` is the version source. Run the **Release** workflow with a new semantic version. It tests, sets root/client versions, publishes a tagged GitHub Release with the client tarball, and explicitly calls **Deploy backend release**. This avoids relying on a bot-created release to trigger another workflow. A human-published GitHub Release also triggers deployment.

Deployment tests the tag, records the previous production deployment, deploys to Vercel, and runs live drawing checks. A failed post-deploy check attempts rollback and keeps the workflow failed. To restore a known tag manually, dispatch **Deploy backend release** with that tag.

Required repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. The project identifiers are configured; the token is still pending. The local CLI OAuth login cannot create a CI token for this app, so create a token in Vercel's account settings and save it directly to GitHub Secrets. Never commit credentials.

## Hosting limits

This is an experimental portfolio service, not a production scaling guarantee. One Vercel deployment does not guarantee one running process; independent instances cannot share these in-memory rooms. Live tests passed with 12 connections, and two independent hosts passed an 11-minute relay test across two timeout/rejoin cycles. See recorded evidence.

Vercel's function duration ends sessions around five minutes. Rejoining creates fresh identities and deletes previous artwork. Deployments can drop sessions, and old connections may briefly remain on an older deployment. There is no durable storage, account system, lobby UI, or paid dependency.

The entry-point pattern follows [endel/colyseus-vercel](https://github.com/endel/colyseus-vercel). Runtime deployment needs explicit Express framework detection.


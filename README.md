# RMC Colyseus Multiplayer Server

Reusable multiplayer backend for Samuel Asher Rivello's portfolio demos.

**Status: feasibility testing; not a released multiplayer backend.**

The first gate is proving two independent clients can share a Colyseus room on Vercel Hobby. Runtime state is ephemeral and Vercel may route requests to different instances. Failure blocks implementation of Multiplayer Draw.

## Development

Node 24, npm. Run `npm ci`, `npm run typecheck`, then `npm run dev`.
In another terminal, run `npm run probe`. Set `SERVER_URL` to test a deployed endpoint.

## Custom Shared Features

None released yet. Planned: hot join/drop, fresh player identity, lowest free seat, capacity/occupancy, retry, and game message integration.

Future feature: **persistent-user-rejoins**. Version one deliberately creates a fresh identity on every connection.

## Reference

The serverless entry-point pattern follows [endel/colyseus-vercel](https://github.com/endel/colyseus-vercel). Hosting must be verified; this repository does not claim singleton process routing.


# AI Repository Guidance

## Working directories

- Project name: **RMC Colyseus Multiplayer Server**.
- Run npm, Git, test, and release commands from the repository root.
- Keep implementation in `multiplayer-server/`: server source in `src/`, tests
  in `test/`, shared browser client in `packages/client/`, and documentation
  in `documentation/`.
- Root `server.ts` is the Vercel entry point. Keep it as a thin adapter.
- Root package/configuration files, `scripts/`, and `.github/workflows/`
  manage development, verification, and releases.

## Documentation and consumers

- Use **Live Demos** in READMEs and link to the GitHub Pages sites of consuming
  repositories. This server has no standalone playable demo.
- Keep the demo lists and `multiplayer-server/documentation/games.md` aligned
  with supported consumers. Do not list unrelated games.
- Whenever a new game updates this server, add or update its root README
  Live Demos bullet and supported game registry entry. Use one bullet per game
  in the format `[**Game Name**](GitHub Pages URL) — short description.` and
  keep the lists in alphabetical order by game name. Label demos still in development.
  Only when an in-development game has no public GitHub Pages URL, use an
  unlinked `**Game Name** — short description. (In development.)` bullet in
  both READMEs. Replace it with the linked format when the public URL exists.
- Preserve release tarball names and public API compatibility when moving files.

## Verification

- Use Node 24 and npm. Run `npm ci`, `npm run typecheck`, and `npm test`.
- Test client packaging after changing its location or release scripts.
- Live integration checks require an otherwise empty drawing session.
- Do not deploy, publish a release, or create a pull request unless requested.

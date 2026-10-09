# Proposal

## Why

The repository's guidance has drifted from its checked-in release workflow: current-state README text still describes a Render migration, supported-game lists disagree, and verification runs only in manually dispatched release or deployment workflows. This change makes the documented project state and ordinary pre-release checks reliable without changing multiplayer behavior.

## What Changes

- Reconcile the root README's hosting and release narrative with the checked-in Vercel workflow. Distinguish what the workflow does from what has been verified on the public endpoint; state plainly that room state is still process-local and cross-instance continuity remains gated by the separate standardize-private-room-flow change. Keep historical Render evidence labeled as historical.
- Make the root README, shared-client README, and supported-game registry list the same supported consumers in alphabetical order, preserving room keys, URLs, client versions, descriptions, and development labels. Do not invent a demo URL or claim an unreleased game is publicly playable.
- Update AGENTS.md with the confirmed exception: an in-development game without a GitHub Pages URL keeps a clearly marked, unlinked entry until a public page exists. Once the URL exists, the linked bullet format applies.
- Add a focused documentation consistency check for consumer membership, ordering, and local links, and run it with Node 24 in a pull-request verification workflow alongside npm ci, typecheck, tests, and a client package dry run. The workflow must not publish, deploy, or use release credentials.
- Record the JavaScript checking gap as a bounded follow-up decision. Do not enable repository-wide checkJs or change the public client contract in this change.

## Capabilities

### New Capabilities

- None. This change updates repository documentation and verification tooling without changing product behavior; the change metadata skips product specs.

### Modified Capabilities

- None. Existing game, room, client, and hosting requirements remain owned by their current specs and changes.

## Impact

- Documentation and guidance: README.md, multiplayer-server/packages/client/README.md, multiplayer-server/documentation/games.md, and AGENTS.md.
- Verification tooling: a small script under scripts/, a root npm check command, and a new pull-request workflow under .github/workflows/.
- No changes to server or client runtime behavior, room keys, public package exports, tarball naming, dependencies, Vercel deployment, or the unfinished cross-instance hosting gate. Existing Render files stay in place pending the separate hosting change.

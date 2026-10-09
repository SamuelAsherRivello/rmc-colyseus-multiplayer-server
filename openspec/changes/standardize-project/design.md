# Design

## Context

See proposal.md for motivation. The supported-game registry currently has twelve entries, the root README has the same games in a different order, and the shared-client README names only two in Live Demos. Just Like Rabbits is registered as in development without a Pages URL. The Release workflow invokes the Vercel deploy workflow, while other README sections still describe Render as the current destination. Existing GitHub workflows run on manual dispatch or workflow call; no pull-request check exists.

Existing local and live-capable game tests exercise the server and client, though this proposal does not claim a current passing run. This change is limited to guidance and checks around them. The active standardize-private-room-flow change owns cross-instance hosting behavior and its release gate.

## Goals / Non-Goals

**Goals:**

- Make repository guidance describe the checked-in workflow and current process-local limitation accurately, without inferring public deployment state from configuration alone.
- Keep the three supported-consumer lists consistent as games are added, including a temporary unlinked development entry when no public page exists.
- Catch documentation drift and ordinary test failures before a release workflow is dispatched.

**Non-Goals:**

- Change any room, game simulation, browser client API, endpoint, tarball name, or deployment behavior.
- Prove cross-instance room continuity or complete the separate hosting change.
- Enable repository-wide JavaScript type checking. The current TypeScript configuration excludes JavaScript modules; a scoped diagnostic and any resulting typing work belong to a separate follow-up.
- Create or run a release, deployment, or pull request as part of this change.

## Decisions

### Use the registry as the consumer inventory

The registry owns game names, room keys, minimum client versions, and frontend status. Keep human-readable Live Demos bullets in both READMEs because AGENTS.md requires them, but compare their game membership and alphabetical order with the registry. Preserve existing URLs and descriptions unless direct evidence shows they are wrong. A development entry with no known Pages URL stays unlinked and explicitly labeled until the URL is available; update AGENTS.md to state that exception and the later conversion rule.

Alternative considered: remove the duplicate README lists and link only to the registry. That would reduce drift but violate the repository's explicit Live Demos convention. Fabricating a plausible URL is unacceptable.

### Separate checked-in release behavior from public service evidence

Revise current-state README text to say that the checked-in release workflow targets Vercel and that the checked-in room index and recovery state are process-local. Label Render files and past experiments as historical recovery material. A public endpoint/version claim requires a fresh health check or a dated, cited verification record. If the endpoint cannot be checked, describe the workflow and known limitations without asserting that the live deployment contains the working-tree source.

Alternative considered: describe the planned cross-instance Vercel architecture as current. That would contradict the unfinished feasibility and release tasks in standardize-private-room-flow.

### Keep the documentation check narrow and offline

Add one Node script under scripts/ and a root npm command that read the supported-game table and the Live Demos sections of both READMEs. It should report missing, extra, duplicate, or unsorted game names; validate the existing link form or approved unlinked development exception; and resolve local Markdown paths in the changed documents. Limit parsing to those known sections so unrelated README lists and historical notes do not affect the check. External Pages URLs are not probed on every pull request, because remote availability is outside this repository's control; validate them manually when a new consumer is added.

Alternative considered: a general Markdown linter or a generated README. Neither is needed for the observed drift, and generation could disturb existing prose and links.

### Add a read-only pull-request workflow

Create a workflow for pull requests to main with contents: read and Node 24. Run npm ci, the documentation check, npm run typecheck, npm test, and npm pack of the client with --dry-run. Keep the release and deployment workflows untouched. The new workflow has no release credentials, tagging, publishing, deployment, or write permissions. A real GitHub run can be observed when a pull request is later created by an authorized actor; local checks and workflow syntax review are the verification available during implementation without creating a PR.

Alternative considered: adding the checks only to Release. They already run there, but that detects regressions after a release has been requested.

## Risks / Trade-offs

- A section parser could reject harmless Markdown changes -> Scope it to explicit headings and produce file/entry diagnostics; verify it against the current twelve-game list and a deliberately mismatched fixture or temporary input.
- The public Vercel endpoint may be unavailable during documentation work -> Avoid making an unverified live-state claim; use the checked-in workflow as the source for release-process wording.
- An unreleased game may look playable in a Live Demos list -> Require the exact in-development label and no invented link; replace it when a real Pages URL is supplied.
- Pull-request checks increase CI work -> Use the repository's existing required commands and a lightweight offline documentation check; do not duplicate public integration or deployment jobs.
- A local dependency or network failure can prevent npm ci and downstream checks -> Record the environmental result; do not mark typecheck or tests as passed. The future pull-request run supplies independent execution evidence.

## Migration Plan

1. Record the current game inventory and release workflow behavior, and inspect public health only if a live-state sentence is needed.
2. Update AGENTS.md and the three documentation surfaces together, retaining all existing supported games and compatibility notes.
3. Add the documentation check and read-only pull-request workflow.
4. Verify list equality/order, local links, workflow syntax, Node 24 install/typecheck/tests, client package dry run, and the final diff. Do not deploy or publish.

Rollback is a normal revert of documentation and the new verification workflow/script; no runtime state or consumer migration is involved.

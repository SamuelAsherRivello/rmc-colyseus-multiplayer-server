# Tasks

## 1. Repository guidance and supported consumers

- [x] 1.1 Update AGENTS.md to allow a clearly labeled, unlinked Live Demos entry only for an in-development game without a public Pages URL, and require converting it to the standard linked bullet when a URL exists; verify the rule still requires one alphabetical entry per supported game and does not relax the no-PR/no-release instruction.
- [x] 1.2 Reconcile the root README, shared-client README, and supported-game registry so all twelve current games appear in alphabetical order with their existing room keys, URLs, minimum client versions, descriptions, and development labels; verify the three name sets and ordering agree, and Just Like Rabbits remains explicitly unlinked and in development.
- [x] 1.3 Correct the root README's current-state Render/Vercel statements using the checked-in release/deploy workflows and process-local server code; verify every present-tense hosting claim has a source, historical Render material remains labeled historical, and the separate cross-instance OpenSpec gate is not described as complete.

## 2. Offline documentation verification

- [x] 2.1 Add a focused Node script and root npm command that compare the registry with both Live Demos sections for missing, extra, duplicate, or unsorted game names and the approved link/development-label rule; verify it passes on the aligned documents and fails with a clear file/name diagnostic on a temporary mismatch.
- [x] 2.2 Extend that check to resolve local Markdown link targets in the changed documents without probing external URLs; verify a temporary broken relative link fails, existing links pass, and the documented npm command runs from the repository root under Node 24.

## 3. Pull-request verification and integration

- [x] 3.1 Add a pull-request workflow targeting main with contents: read, Node 24, npm ci, the documentation check, npm run typecheck, npm test, and a client npm pack dry run; verify the workflow syntax and that it contains no write permission, release secret, tag, publish, or deployment step.
- [x] 3.2 Run npm ci, npm run typecheck, npm test, the documentation check, and the client package dry run from the repository root with Node 24; verify existing-game regressions pass, the client tarball name and public file inventory remain compatible, and record any environmental blocker without claiming a pass.
- [x] 3.3 Inspect the final diff and run git diff --check; verify only approved guidance, documentation, and verification-tooling files changed, local links resolve, and no room/client runtime or separate hosting-change artifact was modified.

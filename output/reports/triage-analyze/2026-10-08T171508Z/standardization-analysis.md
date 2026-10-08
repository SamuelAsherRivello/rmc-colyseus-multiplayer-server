# Standardization Analysis

[Overview](overview.md) · Standardization analysis · [Architecture analysis](architecture-analysis.md) · [Verification baseline](verification-baseline.md) · [Back](overview.md)

[standards-document.md](C:/Users/srive/.agents/skills/triage-standardize/references/standards-document.md) has not been customized by user. Using defaults. The observed convention is the [AGENTS.md](../../../../AGENTS.md) layout: root tooling and a multiplayer-server product boundary with src, test, packages/client, and documentation. The default standard is a decision aid, not an instruction to rearrange that layout.

| # | Finding and evidence | Desired standard and delta | Severity | Owner |
| --- | --- | --- | --- | --- |
| STND02 | [README.md](../../../../README.md) says the active release path is Vercel, then uses current-state language for the Render container/Blueprint and a future migration back to Render. [release.yml](../../../../.github/workflows/release.yml) calls [deploy.yml](../../../../.github/workflows/deploy.yml), which deploys Vercel. | One accurate current hosting narrative; keep historical Render evidence explicitly historical. | Moderate | $triage-standardize |
| STND03 | Root Live Demos are not alphabetized (Gauntlet follows Just Like Rabbits); [games.md](../../../../multiplayer-server/documentation/games.md) has similar ordering and Just Like Rabbits has no Pages URL. The [client README](../../../../multiplayer-server/packages/client/README.md) Live Demos section lists only two consumers while the registry lists twelve. | Apply the repository's one-bullet-per-supported-game, alphabetical, linked-demo convention; retain development labels and resolve the missing URL before adding a link. | Moderate | $triage-standardize; user decision on absent URL |
| STND04 | [package.json](../../../../package.json) defines typecheck and test; all [workflows](../../../../.github/workflows/release.yml) are dispatch or workflow-call driven. No pull_request/push check or lint script was found. | A discoverable routine verification gate for ordinary changes, proportionate to the repository. Existing release checks are useful but late. | Moderate | $triage-standardize |
| STND05 | [tsconfig.json](../../../../tsconfig.json) includes TypeScript files only; several server simulations and the public client package are JavaScript. Rule and integration tests exist, but typecheck does not cover these JS contracts. | Keep public API and runtime boundaries verifiable; decide whether JS checking or an equivalent package contract check is warranted. | Low to moderate | $triage-standardize |
| STND06 | Root [server.ts](../../../../server.ts) is a thin Vercel adapter; source, tests, client, and docs follow AGENTS.md. Public exports and tarball files are explicit in [client package.json](../../../../multiplayer-server/packages/client/package.json). | Observed convention aligns with the active repository instructions. | Strength | Maintain |

The repository uses Colyseus Room subclasses for lifecycle and function/class simulations for game rules. Explicit interface types are sparse, but a new interface per Room would add ceremony without a demonstrated substitution need. The shared [PrivateCodeRoom](../../../../multiplayer-server/src/private-code-room.ts) expresses a real lifecycle contract; its complexity is an architecture concern.

## AI readiness

| # | Area | Status | Evidence | Practical improvement |
| --- | --- | --- | --- | --- |
| READY01 | Canonical agent instructions | nailed | [AGENTS.md](../../../../AGENTS.md) states layout, consumers, verification, and release limits. | Keep it current with hosting decisions. |
| READY02 | Command discovery | partial | [package.json](../../../../package.json), README, and workflows expose core checks; no routine PR gate or lint command. | State which checks run on ordinary changes. |
| READY03 | Project orientation | nailed | README structure, registry, client README, and thin root entry point. | Correct the current hosting narrative. |
| READY04 | Definition of done | partial | AGENTS.md specifies npm ci, typecheck, test, packaging conditions; live gate is in OpenSpec and workflows. | Link the active cross-instance release gate from the main verification section. |
| READY05 | Maintenance relationships | partial | AGENTS.md links demo/registry updates; game tests are colocated by name. Shared-client README demo list has drifted. | Make consumer documentation updates one review item. |
| READY06 | Safety boundaries | partial | [AGENTS.md](../../../../AGENTS.md) forbids unsolicited deploy/release/PR; [.gitignore](../../../../.gitignore) excludes .env files and generated artifacts. | No repository-specific .aiignore need was established; absence is not scored as a defect. |

## Repository integrity

| # | Candidate | Classification | Evidence and limits | Recommended owner |
| --- | --- | --- | --- | --- |
| INTG01 | Current-state Render hosting statements in root README | confirmed stale | Contradicted by active release/deploy workflows and same README's Vercel release section. Render files still exist, so historical discussion is legitimate. | $triage-standardize |
| INTG02 | Shared-client README Live Demos list | confirmed stale | Lists two demos versus twelve registered games and the root supported list; this is a coverage mismatch, not evidence that the games are unsupported. | $triage-standardize |
| INTG03 | Dockerfile, render.yaml, Render-only workflows and credential script | intentionally future-facing | Root README calls Render historical recovery; OpenSpec task 3.3 proposes removal only after a feasibility gate. Workflow_dispatch still permits manual use. Do not remove from static non-reference alone. | Existing OpenSpec decision |
| INTG04 | Just Like Rabbits consumer and pending release | intentionally future-facing | README and registry label it in development; OpenSpec-like release language is conditional. Missing Pages URL is an unresolved documentation input. | User decision |
| INTG05 | Game room classes and package exports | not assessed | Cross-checked registry, server game map, package exports/files, and several imports/tests. Dynamic Colyseus registration and external consumers prevent proving unused code from static references. | No cleanup recommendation |

No prior accessible triage packets were available for revalidation. There were no .triageignore blind spots. The [working tree](overview.md) contains active edits, so findings describe this snapshot only.

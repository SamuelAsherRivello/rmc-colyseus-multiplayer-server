# Standardization Plan

Standardization plan · Back

| # | Item | Evidence |
| --- | --- | --- |
| META01 | Scope | Whole repository comparison; proposed edits are limited to three documentation files. No .aiignore or .triageignore exists, so there are no triage exclusions. |
| META02 | Current state | HEAD 9be0bc2 on 2026-10-08; clean working tree before this plan. [Prior triage packet](../../triage-analyze/2026-10-08T171508Z/overview.md) was revalidated for the current commit. Its 0.9.7 packaging observation is historical; current package version is 0.9.8. |
| META03 | Active baseline | [Shipped standards document](C:/Users/srive/.agents/skills/triage-standardize/references/standards-document.md) remains uncustomized. [AGENTS.md](../../../../AGENTS.md) supplies the project-specific layout, demo, compatibility, and verification rules. |

The approved project layout already matches AGENTS.md: root tooling and entry point, with server source, tests, client package, and documentation under multiplayer-server. No relocation, class reordering, or new interface is justified by the observed code. The changes below preserve code and public behavior.

## Exact proposed edits

| # | Classification | Affected paths | Before → after intent and behavior preservation | Smallest regression check |
| --- | --- | --- | --- | --- |
| SAFE01 | safe standardization, awaiting approval | [README.md](../../../../README.md) | Replace present-tense Render container/Blueprint and "old/legacy Vercel" migration claims in Structure, Hosting Limits, and Additive release policy with the active Vercel release path shown by [release.yml](../../../../.github/workflows/release.yml) and [deploy.yml](../../../../.github/workflows/deploy.yml). State that room state remains process-local and the longer-lived cross-instance design is gated by the [existing OpenSpec tasks](../../../../openspec/changes/standardize-private-room-flow/tasks.md). Keep Render files and historical evidence clearly labeled as such. No endpoint, deployment, or protocol change. | Local Markdown link-target and section check; compare the resulting claims with the two active workflows. |
| SAFE02 | safe standardization, awaiting approval | [README.md](../../../../README.md), [games.md](../../../../multiplayer-server/documentation/games.md) | Alphabetize the existing twelve game entries by game name, preserving every room key, URL, version, description, and development label. Align demo bullet formatting with AGENTS.md where a verified URL already exists. Do not invent a Just Like Rabbits URL. No supported game is added or removed. | Compare game names and room keys before/after; validate local Markdown links and inspect list order. |
| SAFE03 | safe standardization, awaiting approval | [client README](../../../../multiplayer-server/packages/client/README.md) | Expand its Live Demos section from two bullets to the same supported consumer set as the root README and registry, using existing verified URLs and development labels. Keep Just Like Rabbits visibly in development without a fabricated public link until DEC01 is resolved. No package API or file placement changes; README content is included in the tarball. | Compare all twelve names across the three documents; validate Markdown links; run client package dry-run and confirm tarball name/files. |

These are documentation-only edits. Exact prose will be constrained to statements supported by current source, workflows, and the existing feasibility record; the private-room OpenSpec gates will remain open.

## Decisions and deferred work

| # | Classification | Evidence and decision needed | Intended owner |
| --- | --- | --- | --- |
| DEC01 | needs decision | [games.md](../../../../multiplayer-server/documentation/games.md) and root README register Just Like Rabbits as in development but give no GitHub Pages URL. Provide its intended Pages URL when available, or explicitly accept a temporary unlinked development entry. | User; then $triage-standardize |
| DEC02 | needs decision | Existing workflows are manual or reusable. A new .github/workflows/verify.yml could run Node 24, npm ci, typecheck, tests, and package dry-run on pull requests, but this adds recurring CI work and was not established as a repository policy. No workflow edit is proposed in the safe set. | User; then $triage-standardize |
| DEC03 | needs decision | [tsconfig.json](../../../../tsconfig.json) checks TypeScript source only, while several simulations and the public client are JavaScript. Enabling checkJs may surface broad diagnostics and require contract/typing changes, so no tsconfig or source edit is proposed. | User; bounded follow-up |
| ARCH01 | architecture change, out of this run | [src/server.ts](../../../../multiplayer-server/src/server.ts) and [PrivateCodeRoom](../../../../multiplayer-server/src/private-code-room.ts) own process-local admission and recovery. Cross-instance room state, dependency direction, and public contracts belong to the active [OpenSpec change](../../../../openspec/changes/standardize-private-room-flow/tasks.md), with $triage-rearchitect only after feasibility. | Existing OpenSpec change |
| DEFR01 | out of scope | Render assets, package exports, room classes, .aiignore, .triageignore, and shipped standards document are untouched. Render removal is conditional in OpenSpec task 3.3. No extra AI access boundary was justified. | Maintain |

## AI readiness after the proposed safe set

| # | Area | Current → expected | Canonical source and remaining limit |
| --- | --- | --- | --- |
| READY01 | Agent instructions | nailed → nailed | [AGENTS.md](../../../../AGENTS.md) remains the single repository guide. |
| READY02 | Command discovery | partial → partial | [package.json](../../../../package.json) and release workflows state commands; routine PR CI remains DEC02. |
| READY03 | Orientation | nailed → nailed | README structure and package/registry links remain; hosting narrative becomes accurate. |
| READY04 | Definition of done | partial → partial | AGENTS.md requires core checks; cross-instance release gate remains pending in OpenSpec. |
| READY05 | Maintenance relationships | partial → improved partial | The three supported-consumer lists become aligned except for the unresolved Pages URL. |
| READY06 | Safety boundaries | partial → partial | AGENTS.md and [.gitignore](../../../../.gitignore) cover release restraint and local secrets; no .aiignore change proposed. |

## Verification baseline and execution plan

| # | Check | Current evidence | After approved edits |
| --- | --- | --- | --- |
| VERI01 | Node 24, npm ci, typecheck, tests | Prior [verification baseline](../../triage-analyze/2026-10-08T171508Z/verification-baseline.md) records npm registry/cache and Windows node_modules failures; typecheck/tests could not load dependencies. These checks have not been rerun on HEAD 9be0bc2. | Retry npm ci with Node 24, then npm run typecheck and npm test from repository root. Report any environmental blocker without claiming behavioral success. |
| VERI02 | Client package dry-run | Ran on current HEAD with Node 24: passed; expected rmc-multiplayer-client-0.9.8.tgz, 10 files. | Repeat after SAFE03 because README is packaged; verify name and file inventory. |
| VERI03 | Local links, names, and whitespace | Existing referenced local targets are present; current lists are out of order. | Check all changed relative links and anchors, compare twelve game names/registry keys, run git diff --check, and inspect the final diff for unintended code/config changes. |
| VERI04 | Public integration | OpenSpec production/cross-instance gates are incomplete. Live checks require an otherwise empty drawing session. | Not needed for documentation-only edits; no deployment or release in this run. |

Approval requested for SAFE01–SAFE03 only. DEC01 can be supplied independently; DEC02–DEC03 remain deferred unless separately selected.

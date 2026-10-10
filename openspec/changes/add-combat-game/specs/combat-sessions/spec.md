# Spec Delta
## ADDED Requirements
### Requirement: Four private stable slots
The server SHALL admit at most four human sessions to an isolated coded Combat room and provide exactly four stable tank slots, filling unoccupied or disconnected slots with server CPU controllers. CPU difficulty SHALL change decisions only. Active-match arrivals SHALL wait until the next match.
#### Scenario: Population and waiting
- **WHEN** one human starts and another joins during play
- **THEN** four tanks remain and the new human observes until the next match
### Requirement: Bounded authoritative controls
The server SHALL accept sequenced drive/turn/fire only, expire controls after 300 ms, simulate at fixed 60 Hz and publish timestamped 20 Hz snapshots. Host-only settings SHALL lock at countdown. All connected humans SHALL ready for matches and rematches.
#### Scenario: Invalid authority
- **WHEN** a client submits position, score, stale sequence or invalid controls
- **THEN** the authoritative simulation does not accept those claims
### Requirement: Protected recovery and cleanup
A dropped tank SHALL receive CPU control immediately and permit same-SDK-session recovery for 15 seconds. Room-code newcomers SHALL not steal protected seats. Zero-human rooms SHALL suspend and expire. Hosting SHALL remain process-local best effort and the separate hosting migration SHALL remain unfinished.
#### Scenario: Drop and rejoin race
- **WHEN** a dropped player recovers while a stranger joins by room code
- **THEN** the recovering player retains their slot and state without a duplicate controller
### Requirement: Additive package and release
The client SHALL export browser-safe Combat rules without removing existing exports. Releases SHALL pass Node 24 regression and real public Combat admission/control probes before stable delivery. Existing games SHALL remain compatible.
#### Scenario: Health-only service
- **WHEN** HTTP health succeeds but Combat clients cannot share authoritative state
- **THEN** deployment verification fails

# Spec Delta

## Purpose

Define readable, authoritative tank combat in compact free-for-all arenas with one-hit destruction, respawns and timed scoring.

## ADDED Requirements

### Requirement: Tank-relative movement
The game SHALL provide forward/reverse driving, body rotation and forward firing for every tank. Humans and bots SHALL obey identical movement, collision and weapon limits.

#### Scenario: Driving and aiming
- **WHEN** a player turns while driving and fires
- **THEN** the tank rotates and moves relative to its facing, and its shot starts at the muzzle along that facing
- **AND** walls and other tanks remain solid

### Requirement: Selectable projectile rules
The lobby SHALL offer Classic and Ricochet rules. Classic shots SHALL disappear on solid arena impact. Ricochet shots SHALL reflect from solid surfaces and disappear after their configured bounce or lifetime limit.

#### Scenario: Classic wall impact
- **WHEN** a Classic projectile reaches a wall before a tank
- **THEN** the server removes it without passing through the wall

#### Scenario: Ricochet corner impact
- **WHEN** a Ricochet projectile contacts two surfaces at a corner
- **THEN** it resolves a bounded reflection without becoming stuck or generating unlimited impacts
- **AND** all clients observe the same resulting trajectory

### Requirement: Fixed arena combat
The game SHALL offer three original arenas with symmetrical spawn opportunities, static cover and solid boundaries. Every player SHALL see the entire arena during play, with no scrolling or aircraft wrapping.

#### Scenario: Arena selection
- **WHEN** the host chooses Open Yard, Crossroads or Switchback before ready-up completes
- **THEN** every client receives the same arena geometry and spawns
- **AND** no tank can leave the arena or pass through cover

### Requirement: Authoritative combat outcomes
Only the server SHALL validate hits and update shared combat outcomes. Clients SHALL submit controls, not authoritative positions, damage, scores or reset commands. A projectile impact SHALL be resolved at most once.

#### Scenario: Duplicate hit claims
- **WHEN** a client sends a claimed hit or a repeated action for an already resolved projectile
- **THEN** no additional hit, damage or score is awarded from that claim

### Requirement: Bounded shot population
Every tank SHALL have the same configured firing cooldown, active-projectile cap and projectile lifetime under both rules. Repeated or held fire SHALL obey those limits.

#### Scenario: Sustained firing
- **WHEN** all four tanks hold fire throughout a match
- **THEN** the server never exceeds the configured per-tank projectile cap
- **AND** all shots eventually expire or resolve a valid collision

### Requirement: One-hit destruction and protected respawn
A valid hit SHALL destroy an unprotected tank. It SHALL respawn after 0.6 seconds at a safe available spawn, retaining its slot and score. Respawn protection SHALL last one second or end immediately upon firing. Destroying a tank SHALL clear its active shots.

#### Scenario: Destruction and recovery
- **WHEN** an unprotected tank is hit by an opponent's shell
- **THEN** it is destroyed once, the opponent gains one point and the victim respawns after 0.6 seconds
- **AND** the victim's score is preserved and its slot is not removed

#### Scenario: Protection and early firing
- **WHEN** a protected tank fires before its one-second protection expires
- **THEN** the server removes protection immediately and subsequent hits can destroy it

### Requirement: Timed free-for-all result
Matches SHALL last 136 seconds of active simulation. An opponent destruction SHALL award one point exactly once. At expiry, a unique highest scorer SHALL win; tied highest scores SHALL draw. Result state SHALL freeze gameplay and scoring until a ready-gated rematch resets the match.

#### Scenario: Score and clock
- **WHEN** active simulation reaches 136 seconds
- **THEN** all clients receive the same frozen scores and winner or draw
- **AND** later inputs or projectiles cannot change that result

#### Scenario: Tied leaders
- **WHEN** two or more tanks share the highest score at expiry, including a zero-score tie
- **THEN** the match is a draw without arbitrary slot-based tie-breaking

### Requirement: Ricochet self-hit penalty
A shell SHALL be able to hit its owner only after a ricochet. A valid returning self-hit SHALL destroy its unprotected owner and deduct one point from that owner, with a minimum score of zero. No opponent SHALL receive credit for that self-hit.

#### Scenario: Returning shell hits its owner
- **WHEN** a tank with two points is struck by its own reflected shell
- **THEN** it is destroyed and its score becomes one without awarding another tank a point

#### Scenario: Self-hit at zero
- **WHEN** a tank with zero points is struck by its own reflected shell
- **THEN** it is destroyed and its score remains zero

### Requirement: Deterministic simultaneous hits
The server SHALL collect valid impacts for a simulation tick before applying destruction and shot cleanup. It SHALL permit mutual destruction in that tick and resolve multiple lethal impacts on one tank only once with deterministic attribution.

#### Scenario: Mutual destruction
- **WHEN** two opposing shells validly hit their targets in the same simulation tick
- **THEN** both tanks are destroyed and each earns one opponent-destruction point
- **AND** removing a destroyed tank's shots does not erase the already accepted mutual hit

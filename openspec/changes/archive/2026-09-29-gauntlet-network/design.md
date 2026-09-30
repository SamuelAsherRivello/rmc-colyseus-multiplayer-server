# Design

## Context
Existing shared client offers snapshot/presence/gameState and fresh reconnect. Add isolated gauntlet-3d room, four seats, bounded messages, 30Hz simulation and 20Hz broadcasts. Reuse lifecycle; do not fork client. Deploy release before client implementation.

## Goals / Non-Goals
Goals: fulfill the supplied game brief and verify behavior. Non-goals: accounts, persistent saves, multiple levels.

## Decisions
Existing shared client offers snapshot/presence/gameState and fresh reconnect. Add isolated gauntlet-3d room, four seats, bounded messages, 30Hz simulation and 20Hz broadcasts. Reuse lifecycle; do not fork client. Deploy release before client implementation.

## Risks / Trade-offs
Hosted sessions are temporary; disconnects create fresh identities. GPU support and physical touch require explicit verification.

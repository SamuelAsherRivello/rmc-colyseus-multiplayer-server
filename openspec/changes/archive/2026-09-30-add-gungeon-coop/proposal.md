# Proposal
## Why
Enter the Gungeon Clone needs an authoritative cooperative arena backend with private room codes and solo-to-four-player hot joining.
## What Changes
- Add isolated gungeon rooms, validated input, wave combat, upgrades, revival and replay.
- Extend shared client admission options without changing existing consumers.
- Verify room isolation, four-seat capacity and game rules locally and live before releasing the client.
## Capabilities
### New Capabilities
- `gungeon-coop`: Private cooperative bullet arena sessions.
### Modified Capabilities
None.
## Impact
Server registry/admission, new simulation/room/tests, shared client optional room options, documentation and deployment verification. Frontend follows server release in babylon-lite-enter-the-gungeon-clone.

# PLAN.md

Current task context for fizzy-cli. Read at session start, update as work progresses.

## Current State

**Migrated to official basecamp/fizzy-cli (Go).** This TS/Bun repo is deprecated (renamed to `fizzy-cli-legacy-2`).

Active work is on the fork: `~/g/fizzy-cli-fork` (`Concurrent-Systems/fizzy-cli`, fork of `basecamp/fizzy-cli`).

## Active

- [ ] basecamp/fizzy-cli#112 — @mention resolution PR, awaiting upstream review
- [ ] Clean up test card #539 on Dev board

## Next

- [ ] Monitor PR #112 for feedback, iterate if needed
- [ ] If merged: switch from fork binary to official releases
- [ ] If rejected: maintain fork with upstream sync

## Completed (2026-03-28)

- [x] Evaluated official CLI vs custom — official wins (152 vs 38 commands)
- [x] Installed official CLI v3.0.3, configured auth/account/board
- [x] Forked to Concurrent-Systems/fizzy-cli, added @mention resolution in Go
- [x] All tests passing (12 new mention tests + all existing)
- [x] Updated SKILL.md (env + repo + embedded) with generic mention docs
- [x] Submitted upstream PR basecamp/fizzy-cli#112
- [x] Renamed old TS repo to fizzy-cli-legacy-2

# PLAN.md

Current task context for fizzy-cli. Read at session start, update as work progresses.

## Current State

Open PRs awaiting merge:
- **#10** @mentions in comments/descriptions — PR #11 (verified working: Faraz confirmed notification)
- **#4** steps-check idempotency + verbose step IDs — PR #12
- **#9** column rename/delete commands — PR #13
- **#3 + #5** code block rendering + literal \n fix — PR #15

Closed:
- **#6** closed as duplicate of #4

## Recently Completed

- [x] Remove dead references to fizzy-cli-legacy repo (3d52c44)
- [x] Fix API reference path in CLAUDE.md (42fd416)
- [x] Add SKILL.md to repo, remove references to deprecated team claude config (f8c1fa0)
- [x] **#1** Nested list support in markdown conversion (339bac6)
- [x] **#2** Fix bullet list conversion — reorder pipeline, paragraph separation, blank line tolerance (beffa62)
- [x] Refine CLAUDE.md with architecture docs (1d68075)
- [x] Add PLAN.md (5410801)
- [x] Improve markdown conversion to match Fizzy HTML format (1a783b8)
- [x] Add download command for attachments (097df7d)
- [x] Fix .env lookup to check CLI directory (d31b552)
- [x] Initial commit: full TypeScript port from bash scripts (972565a)

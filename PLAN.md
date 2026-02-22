# PLAN.md

Current task context for fizzy-cli. Read at session start, update as work progresses.

## Current Priority

Fix markdown-to-HTML conversion bugs in comment/card creation.

### Open Bugs

- [ ] **#2** Comment markdown leaves extra bullet characters in rendered output (bug label)
  - Bullet lists via `comment` command render with stray bullet chars
  - Repro: post markdown bullets to a card, view in Fizzy web UI
- [ ] **#1** Markdown list and heading conversion broken in comments
  - Numbered lists, bullet lists, headings stripped or rendered as plain paragraphs
  - Nested lists not handled
  - Discovered posting deployment summary to fizzy#453

Both issues are in `src/utils/markdown.ts` — the `convertLists()` and heading conversion logic. Commit `1a783b8` attempted a fix but didn't fully resolve it.

## Recently Completed

- [x] Refine CLAUDE.md with architecture docs (1d68075)
- [x] Improve markdown conversion to match Fizzy HTML format (1a783b8)
- [x] Add download command for attachments (097df7d)
- [x] Fix .env lookup to check CLI directory (d31b552)
- [x] Initial commit: full TypeScript port from bash scripts (972565a)

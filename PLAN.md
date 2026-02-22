# PLAN.md

Current task context for fizzy-cli. Read at session start, update as work progresses.

## Current Priority

Fix markdown-to-HTML conversion bugs in comment/card creation.

### Open Bugs

- [x] **#2** Comment markdown leaves extra bullet characters in rendered output (bug label)
  - Fixed in beffa62: moved list conversion before inline formatting, added paragraph separation, tolerate blank lines within lists
- [x] **#1** Markdown list and heading conversion broken in comments
  - Fixed in 339bac6: rewrote convertLists with indentation tracking for nested sub-lists

Both issues are in `src/utils/markdown.ts` — the `convertLists()` and heading conversion logic. Commit `1a783b8` attempted a fix but didn't fully resolve it.

## Recently Completed

- [x] Refine CLAUDE.md with architecture docs (1d68075)
- [x] Improve markdown conversion to match Fizzy HTML format (1a783b8)
- [x] Add download command for attachments (097df7d)
- [x] Fix .env lookup to check CLI directory (d31b552)
- [x] Initial commit: full TypeScript port from bash scripts (972565a)

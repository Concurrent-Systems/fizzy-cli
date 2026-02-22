---
name: fizzy
description: Manage Fizzy kanban cards and boards - create cards, add checklist items (steps), search cards, add comments, view card details, list boards. Use when working with Fizzy, kanban boards, project tracking, or task management.
allowed-tools: Bash
---

# Fizzy CLI

Fizzy is 37signals' kanban board app. CLI source: `~/g/fizzy-cli`

## Commands

All commands: `~/.bun/bin/bun run ~/g/fizzy-cli/src/index.ts <command>`

| Task | Command |
|------|---------|
| **View** | |
| List boards | `boards` |
| View card | `card 374` |
| View card (with comment IDs) | `card -v 374` |
| Search cards | `search "keyword"` |
| List users | `users` |
| **Cards** | |
| List all | `cards` |
| Filter by board | `cards -b "Board"` |
| Filter by tag | `cards -t "tag"` |
| Filter by assignee | `cards -a "Wayne"` |
| Filter by status | `cards -s closed` |
| Sort | `cards --sorted latest` |
| My cards | `cards-mine` |
| Create | `cards-create "Title" -b "Board" -d "description"` |
| Create with tags | `cards-create "Title" -b "Board" -t bug urgent` |
| Update | `cards-update 374 --title "New" -d "new desc"` |
| Delete | `cards-delete 374` |
| Move to board | `cards-move 374 "Board"` |
| Move to column | `cards-triage 374 "Working On"` |
| Back to triage | `cards-triage 374` |
| Close | `done 374` |
| Reopen | `reopen 374` |
| **Steps (checklist)** | |
| Add | `steps-add 374 "Step text"` |
| Check | `steps-check 374 1` |
| Uncheck | `steps-check 374 1 --off` |
| Delete one | `steps-delete 374 1` |
| Delete completed | `steps-delete 374 --completed` |
| Delete all | `steps-delete 374 --all` |
| **Comments** | |
| Add | `comment 374 "Text with **markdown**"` |
| Edit | `comments-edit 374 COMMENT_ID "New"` |
| Delete | `comments-delete 374 COMMENT_ID` |
| **Tags** | |
| Add | `tag 374 bug` |
| Remove | `untag 374 bug` |
| **Assignment** | |
| Toggle | `assign 374 "Wayne"` |
| **Attachments** | |
| Attach file | `attach 374 file.txt "Optional comment"` |
| List attachments | `download 374 --list` |
| Download all | `download 374 -o ~/Downloads/` |
| Download one | `download 374 "filename" -o ~/Downloads/` |
| **Columns** | |
| List | `columns "Board"` |
| Add | `columns-add "Board" "Col" --color lime` |
| **Boards** | |
| Create | `boards-create "Name"` |
| Create private | `boards-create "Name" --private` |

## Execution

Single operations: run inline.
Multi-step workflows: use Task tool with `general-purpose` subagent.

## Standard Columns

Triage → REFINE → WAITING → READY → WORKING ON → REVIEW → (DONE)

## Reference

- Use card numbers (374), not internal IDs
- Board/user/tag names resolve case-insensitively; IDs also work
- Markdown auto-converts to HTML in comments and descriptions
- Step identifiers: 1-based index, step ID, or content substring
- Status filters: `all`, `closed`, `not_now`, `stalled`
- Sort orders: `latest`, `newest`, `oldest`
- Column colors: blue, gray, tan, yellow, lime, aqua, violet, purple, pink

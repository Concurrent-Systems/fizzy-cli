---
name: fizzy
description: Manage Fizzy kanban cards and boards - create cards, add checklist items (steps), search cards, add comments, view card details, list boards. Use when working with Fizzy, kanban boards, project tracking, or task management.
allowed-tools: Bash
---

# Fizzy CLI

Fizzy is 37signals' kanban board app. CLI source: `~/g/fizzy-cli`

## Commands

```bash
~/.bun/bin/bun run ~/g/fizzy-cli/src/index.ts <command>
```

| Task | Command |
|------|---------|
| **View** | |
| List boards | `boards` |
| Create board | `boards-create "Name" [--private]` |
| View card | `card 374` |
| View card (with comment/step IDs) | `card -v 374` |
| Search cards | `search "keyword"` |
| List users | `users` |
| **Cards** | |
| List cards | `cards` |
| List by board | `cards -b "Board"` |
| List by tag | `cards -t "tag"` |
| List by assignee | `cards -a "Wayne"` |
| List by status | `cards -s closed` |
| List sorted | `cards --sorted newest` |
| My cards | `cards-mine` |
| Create | `cards-create "Title" -b "Board" -d "Desc"` |
| Create with file | `cards-create "Title" -b "Board" -f desc.md` |
| Create with tags | `cards-create "Title" -b "Board" -t bug urgent` |
| Create as draft | `cards-create "Title" -b "Board" --draft` |
| Update | `cards-update 374 --title "New"` |
| Update desc from file | `cards-update 374 -f desc.md` |
| Delete | `cards-delete 374` |
| Move to board | `cards-move 374 "Other Board"` |
| Move to column | `cards-triage 374 "Working On"` |
| Back to triage | `cards-triage 374` |
| Close | `done 374` |
| Reopen | `reopen 374` |
| **Steps** | |
| Add | `steps-add 374 "Step text"` |
| Check | `steps-check 374 1 --on` |
| Uncheck | `steps-check 374 1 --off` |
| Toggle | `steps-check 374 1` |
| Delete | `steps-delete 374 1` |
| Delete all | `steps-delete 374 --all` |
| Delete completed | `steps-delete 374 --completed` |
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
| Attach | `attach 374 file.txt ["Comment"]` |
| List | `download 374 --list` |
| Download all | `download 374 -o ~/Downloads/` |
| Download one | `download 374 "filename.md" -o ~/Downloads/` |
| **Columns** | |
| List | `columns "Board"` |
| Add | `columns-add "Board" "Col" --color lime` |
| Rename | `columns-rename "Board" "Old" "New"` |
| Delete | `columns-delete "Board" "Col"` |

## Execution

Single operations: run inline.
Multi-step workflows: use Task tool with `general-purpose` subagent.
If unsure about a command's options, run `fizzy help <command>` for full usage details.

## Standard Columns

Triage → REFINE → WAITING → READY → WORKING ON → REVIEW → (DONE)

## @Mentions

Use `@Name` in comments and descriptions to create real Fizzy mentions (triggers notifications).

- `@FirstName` — matches by first name (case-insensitive). E.g., `@Khurram`
- `@"Full Name"` — quoted, for exact match. E.g., `@"Khurram Shahzad"`
- Ambiguous first names (multiple users share it) require `@"Full Name"`
- Emails (`user@example.com`) are not treated as mentions
- Unresolved `@Name` stays as plain text (warning printed)

## Notes

- Markdown auto-converts to HTML in comments
- `@Name` in comments/descriptions resolves to Fizzy mentions with notifications
- Prefer `--on`/`--off` over bare toggle for steps (idempotent, safe if step order shifts)
- Steps can be targeted by index, ID (from `card -v`), or content substring
- Use card numbers (374), not internal IDs
- Board/user names or IDs both work
- Colors: blue, gray (grey), tan, yellow, lime (green), aqua (cyan), violet, purple, pink
- Status filters: all, closed, not_now, stalled
- Sort orders: latest, newest, oldest

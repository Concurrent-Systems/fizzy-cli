# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Purpose

TypeScript CLI for Fizzy kanban board management. Ported from bash scripts in `~/github/fizzy-cli`.

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **CLI Framework:** Commander.js
- **Testing:** bun:test

## Structure

```
src/
├── index.ts              # Entry point, command registration
├── client.ts             # API client (fetch, auth, pagination)
├── config.ts             # Environment loading (.env)
├── commands/
│   ├── boards/           # boards, boards-create, columns
│   ├── cards/            # card, cards, create, update, delete, etc.
│   ├── comments/         # comment, edit, delete
│   ├── steps/            # add, check, delete
│   ├── tags/             # tag, untag
│   ├── users/            # users, assign
│   └── attachments/      # attach
├── utils/
│   ├── html.ts           # HTML-to-text conversion
│   ├── markdown.ts       # Markdown-to-HTML conversion
│   └── upload.ts         # Direct upload flow
└── types/
    └── api.ts            # Fizzy API response types

tests/                    # Unit tests (bun:test)
```

## Commands

```bash
bun run dev --help        # Run with help
bun test                  # Run tests
bun run typecheck         # Type check (tsc --noEmit)
bun run build             # Build binary
```

## API Reference

See `~/github/fizzy-cli/fizzy-api.md` for complete API documentation.

## Key Files

| File | Purpose |
|------|---------|
| `src/client.ts` | FizzyClient class with pagination handling |
| `src/utils/html.ts` | HTML→text for displaying comments |
| `src/utils/markdown.ts` | Markdown→HTML for creating content |
| `src/types/api.ts` | TypeScript interfaces for API responses |

## Conventions

- Commands use `kebab-case` with verb prefixes: `cards-create`, `steps-add`
- All API calls go through `FizzyClient`
- Markdown input is converted to HTML via `markdownToHtml()`
- HTML output is converted to text via `htmlToText()`

## Testing

Tests use `bun:test`. Run with:
```bash
bun test                  # All tests
bun test tests/html.test.ts  # Single file
```

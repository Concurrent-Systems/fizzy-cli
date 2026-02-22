# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

TypeScript CLI for [Fizzy](https://app.fizzy.do) kanban board management.

**Primary use:** Claude Code skill (`/fizzy`) for AI-assisted Fizzy management. Skill definition: `SKILL.md` in this repo.
**Secondary use:** Standalone CLI.

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **CLI Framework:** Commander.js
- **Testing:** bun:test

## Commands

```bash
bun run dev -- <command>   # Run a CLI command in dev mode
bun run dev -- --help      # Show all CLI commands
bun test                   # Run all tests
bun test tests/html.test.ts  # Run a single test file
bun run typecheck          # Type check (tsc --noEmit)
bun run build              # Build standalone binary
```

## Architecture

**Entry point** (`src/index.ts`): Registers all Commander.js commands. Creates `FizzyClient` lazily so `--help` works without credentials.

**Command pattern**: Each command is a standalone async function in `src/commands/<domain>/<action>.ts` that takes `FizzyClient` as its first argument and prints directly to stdout. Commands are pure functions — no shared state beyond the client.

**Data flow**: Fizzy's API stores content as HTML.
- **Input** (creating/editing): Markdown → `markdownToHtml()` → API. The converter produces Fizzy-specific HTML (e.g., `<b><strong>` nesting, `<figure>` table wrappers, `<p><br></p>` spacing).
- **Output** (displaying): API HTML → `htmlToText()` → terminal. Handles Fizzy-specific elements like `<action-text-attachment>` for @mentions and file attachments.
- **Attachments**: `extractAttachments()` in `html.ts` parses `<action-text-attachment>` elements from HTML. Upload uses a two-step direct upload flow (create blob → PUT to signed URL).

**API client** (`src/client.ts`): Wraps fetch with auth headers. Pagination follows `Link` header `rel="next"`. Use `getAll()` for auto-pagination, `getPaginated()` for manual control.

**Config** (`src/config.ts`): Loads `FIZZY_API_TOKEN` and `FIZZY_ACCOUNT_ID` from env vars or `.env` files. Lookup order: `$CWD/.env` → CLI directory `.env` → `~/.config/fizzy/.env` → `~/.fizzy/.env`. Env vars override file values.

## API Reference

See `~/github/fizzy-cli-legacy/fizzy-api.md` for complete Fizzy API documentation.

## Conventions

- CLI commands use `kebab-case` with verb prefixes: `cards-create`, `steps-add`, `boards-create`
- All API calls go through `FizzyClient` — never call `fetch` directly
- Board/tag/user filters resolve by ID or name (case-insensitive match)

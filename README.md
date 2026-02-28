# Fizzy CLI

TypeScript CLI for [Fizzy](https://app.fizzy.do) kanban board management.

## Purpose

**Primary use:** Claude Code skill for AI-assisted Fizzy management via `/fizzy` command.

**Secondary use:** Standalone CLI for manual operations.

The skill definition is [`SKILL.md`](SKILL.md) in this repo.

## Setup

### 1. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Clone and install

```bash
cd ~/g
git clone git@github.com:Concurrent-Systems/fizzy-cli.git
cd fizzy-cli
bun install
```

### 3. Configure credentials

```bash
cp .env.example .env
# Edit .env with your FIZZY_API_TOKEN and FIZZY_ACCOUNT_ID
```

Get your API token from [Fizzy Profile > API > Personal access tokens](https://app.fizzy.do).

## Claude Code Usage

Once set up, use the `/fizzy` skill in Claude Code:

```
/fizzy card 374
/fizzy search "security"
/fizzy comment 374 "Update from investigation"
```

Claude will execute commands and interpret results contextually.

## Standalone CLI Usage

```bash
# Via bun (development)
~/.bun/bin/bun run ~/g/fizzy-cli/src/index.ts <command>

# Examples
~/.bun/bin/bun run ~/g/fizzy-cli/src/index.ts boards
~/.bun/bin/bun run ~/g/fizzy-cli/src/index.ts card 374
~/.bun/bin/bun run ~/g/fizzy-cli/src/index.ts search "keyword"
```

## Commands

| Command | Description |
|---------|-------------|
| `boards` | List all boards |
| `card <num>` | View card with comments |
| `cards` | List cards (with `-b`, `-t` filters) |
| `search <term>` | Search cards |
| `cards-create <title> -b <board>` | Create card |
| `cards-triage <num> <column>` | Move to column |
| `done <num>` / `reopen <num>` | Close/reopen |
| `comment <num> <text>` | Add comment (markdown supported) |
| `steps-add <num> <text>` | Add checklist item |
| `steps-check <num> <idx>` | Toggle checklist item |
| `tag <num> <tag>` | Add tag |
| `assign <num> <user>` | Toggle assignment |
| `attach <num> <file>` | Attach file |

Run `--help` for full command list.

## Development

```bash
bun test              # Run tests
bun run typecheck     # Type check
bun run build         # Build standalone binary
```


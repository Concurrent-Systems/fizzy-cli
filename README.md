# Fizzy CLI

Command-line interface for [Fizzy](https://app.fizzy.do) kanban board management.

## Prerequisites

- [Bun](https://bun.sh) runtime

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

## Installation

```bash
cd ~/g/fizzy-cli-ts
bun install
```

## Configuration

Create a `.env` file with your Fizzy API credentials:

```bash
cp .env.example .env
# Edit .env with your token and account ID
```

Or set environment variables:
```bash
export FIZZY_API_TOKEN=your_token_here
export FIZZY_ACCOUNT_ID=6103476
```

## Usage

Run via Bun:
```bash
bun run src/index.ts --help
bun run src/index.ts boards
bun run src/index.ts card 374
```

Or build a standalone binary:
```bash
bun run build
./fizzy --help
```

## Commands

### Boards
```bash
fizzy boards              # List all boards
fizzy boards-create NAME  # Create a new board
fizzy columns BOARD       # List columns on a board
fizzy columns-add BOARD NAME --color lime
```

### Cards
```bash
fizzy card 374            # View card with comments
fizzy card -v 374         # Include comment IDs
fizzy cards               # List all cards
fizzy cards -b "Board"    # Filter by board
fizzy cards -t "bug"      # Filter by tag
fizzy cards-mine          # My assigned cards
fizzy search "keyword"    # Search cards

fizzy cards-create "Title" -b "Board" -d "Description"
fizzy cards-update 374 --title "New Title"
fizzy cards-delete 374
fizzy cards-triage 374 "In Progress"  # Move to column
fizzy cards-triage 374                 # Back to triage
fizzy done 374            # Close card
fizzy reopen 374          # Reopen card
```

### Comments
```bash
fizzy comment 374 "Comment text with **markdown**"
fizzy comments-edit 374 COMMENT_ID "Updated text"
fizzy comments-delete 374 COMMENT_ID
```

### Steps (Checklist)
```bash
fizzy steps-add 374 "New step"
fizzy steps-check 374 1           # Toggle step 1
fizzy steps-check 374 1 --on      # Mark complete
fizzy steps-check 374 1 --off     # Mark incomplete
fizzy steps-delete 374 1          # Delete step 1
fizzy steps-delete 374 --all      # Delete all steps
fizzy steps-delete 374 --completed # Delete completed
```

### Tags
```bash
fizzy tag 374 bug         # Add tag
fizzy untag 374 bug       # Remove tag
```

### Users & Assignment
```bash
fizzy users               # List users
fizzy assign 374 "Wayne"  # Toggle assignment
```

### Attachments
```bash
fizzy attach 374 config.txt "Here's the config"
```

## Building Binaries

Build for current platform:
```bash
bun run build
```

Build for all platforms:
```bash
bun run build:all
# Creates: fizzy-darwin-arm64, fizzy-darwin-x64, fizzy-linux-x64
```

## Development

```bash
bun run dev --help        # Run in dev mode
bun test                  # Run tests
bun run typecheck         # Type check
```

## License

MIT

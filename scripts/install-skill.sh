#!/usr/bin/env bash
#
# Install the Fizzy skill, then append the CS fork overlay.
#
# Why: we keep skills/fizzy/SKILL.md byte-identical to upstream so it never
# conflicts on merge. Our CS-specific guidance lives in skills/fizzy/OVERLAY.md
# and is appended onto the *installed* skill here, so agents get it in every
# project without diverging the upstream file.
#
# Run after building/installing the binary:
#   make build && cp bin/fizzy ~/.local/bin/fizzy && scripts/install-skill.sh
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OVERLAY="$HERE/skills/fizzy/OVERLAY.md"
MARKER="<!-- CS-FIZZY-OVERLAY -->"

[ -f "$OVERLAY" ] || { echo "overlay not found: $OVERLAY" >&2; exit 1; }

# Write the upstream skill (overwrites the installed copy with pristine content).
fizzy skill install >/dev/null

# Resolve the installed skill file (Claude loads it via a symlink).
SKILL_LINK="$HOME/.claude/skills/fizzy/SKILL.md"
SKILL_FILE="$(readlink -f "$SKILL_LINK" 2>/dev/null || echo "$SKILL_LINK")"
[ -f "$SKILL_FILE" ] || { echo "installed skill not found: $SKILL_FILE" >&2; exit 1; }

# fizzy skill install just overwrote it, so the marker is gone — append once.
if grep -qF "$MARKER" "$SKILL_FILE"; then
  echo "overlay already present in $SKILL_FILE"
else
  printf '\n' >> "$SKILL_FILE"
  cat "$OVERLAY" >> "$SKILL_FILE"
  echo "overlay appended to $SKILL_FILE"
fi

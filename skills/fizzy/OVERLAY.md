<!-- CS-FIZZY-OVERLAY -->

---

# Concurrent-Systems — Fizzy conventions (fork overlay)

> Appended to the upstream skill by `scripts/install-skill.sh`. Upstream
> `SKILL.md` stays byte-identical so it never conflicts on merge; iterate CS
> guidance here.

## Board structure — where work lives

- **Team boards = execution.** Work chunks live on the team board that has the
  capacity to finish them (Ops, Dev, Finance, LT). One owner per card. This is
  where WIP is real — don't spread executable work onto other boards or it gets
  lost.
- **`🎯 Projects` = initiatives.** One card per multi-week initiative (outcome +
  one accountable owner), columns `Maybe? → On Deck → Active → Done`. The
  initiative card is the **hub**; its chunks live on team boards and mention the
  project by name + link in their description. Keep the Active set small.
- **Pipeline boards only for standing flows** a dedicated crew owns end-to-end
  (Incidents, Leads). They *track* the flow and hand execution cards to team
  boards; they don't hold the work. Don't model low-volume things (a one-off
  incident) as pipelines — that's ceremony; just make the work chunks.

## Archiving done cards

- `fizzy card move <n> --to <board>` **preserves closed/Done state** (the GUI
  can't — it forces a reopen). So the CLI is the bulk-archive tool.
- CS keeps a `🗄️ Archive-<Board>` board per board. Sweep done cards with a loop:
  `for n in $(fizzy card list --board <SRC> --indexed-by closed --all --jq '.data[].number'); do fizzy card move "$n" --to <ARCHIVE>; done`
- **Restricted boards:** `fizzy board create` is ALWAYS all-access (the
  `--all_access false` flag is ignored) and the CLI has **no grant/revoke** for
  per-user access. So for a sensitive board (e.g. LT), a human must lock access
  in the **GUI** first; verify with `fizzy board accesses --board <id>` that the
  archive's access matches the source **before** moving cards in, or restricted
  cards leak.

## Tags

- Get a tag's **ID** (needed for `--tag`) from `fizzy tag list --all` — it
  paginates, so `--all` is required; each tag object also has a `url` that is the
  GUI cross-board rollup link.
- `fizzy card list --tag <ID>` is **cross-board by default** (no `board_ids`
  injection); pass `--board` only to scope to one board. (Upstream fix in
  basecamp/fizzy-cli#181; carried locally until merged.)
- Don't mint a tag per initiative unless you'll retire it — there's no
  `tag delete`; a tag disappears only when removed from every card.

## This fork

`~/g/fizzy-cli-fork` tracks `upstream/master` (basecamp/fizzy-cli) and builds the
latest v4 (not on Homebrew yet). Carries only: the #181 cross-board fix (pending
upstream) and this skill overlay. Update: `git pull && make build && cp bin/fizzy
~/.local/bin/fizzy && scripts/install-skill.sh`.

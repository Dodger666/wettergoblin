# Command Reference

All commands are chat messages beginning with `~`, sent in a guild channel whose
**category name** matches a configured timeline. The bot ignores messages from
bots and messages not starting with `~`.

Reply types: **text** (plain string), **embed** (Discord embed), **file**
(attachment).

| Command | Reply | Description |
| --- | --- | --- |
| `~date` | text | Status: in-world date, weather, cross-plane dates, moon phases, and today's notes |
| `~date <yyyymmdd>` | text | Set timeline to an absolute date, then show status |
| `~date [+-]n{d,m,y}` | text | Move timeline relative to current date, then show status |
| `~date weather` | text | Show the (separate) weather date, or status weather |
| `~date weather <yyyymmdd>` | text | Set weather date (⚠ defective, see tech spec §10.4) |
| `~date weather [+-]n{d,m,y}` | text | Move weather date (⚠ defective) |
| `~sync` | text | Set timeline to current real-world time via `echt (MEZ)` offset |
| `~note <text>` | text | Append a dated entry to the event log (text must start with a space) |
| `~note` | text | Show notes for the current day |
| `~allnotes` | file | `Ereignisse.txt` with all events across timelines |
| `~removenotes` | text | Delete all entries for the current day/timeline |
| `~timelines` | text | ASCII overview of all timelines and relative day offsets |
| `~drawHex <params>` | file | `map.svg` procedurally generated hex map |
| `~drawHexImage` | — | No-op (implementation commented out) |
| `~rollAttributes` | embed | Roll 4d6-drop-lowest ×6, cache per user |
| `~rollHero <params>` | file (+embed) | Generate a character sheet `char.txt` |
| `~help` | embed | List commands (German) |
| `~testCharCreation` | embed | Diagnostic: sample attribute/class/species rolls |

## Date parameters

### Absolute
`~date 05781410` → year 578, month 14, day 10. Separators `.`, `-`, `/`, or
space are allowed between the `yyyy mm dd` groups. Month/day `00` is rejected;
negative years are not supported in absolute mode.

### Relative
`~date +3d`, `~date -1y 2m`, `~date +2m -5d`. Components:
- `y` — years
- `m` — months
- `d` — days

Prefix `+` (future) or `-` (past). Components are optional and combinable.

## `~drawHex` parameters

Space-separated keywords (from `Battlemap.keywords`):

| Param | Meaning |
| --- | --- |
| `riverAB` | River from edge `A` to edge `B` (1–6) |
| `roadAB` | Road from edge `A` to edge `B` |
| `mountsNN` | Place `NN` mountain hexes |
| `hillsNN` | Place `NN` hill hexes |
| `bogsNN` | Place `NN` bog hexes |
| `woodsNN` | Place `NN` wood hexes |
| `seed` | Use a deterministic seed for reproducible maps |
| `nocoords` | Omit coordinate labels |
| `cubecoords` | Draw cube coordinates |

Example: `~drawHex river14 road25 mounts6 woods4 hills3`

## `~rollHero` parameters

Space-separated keywords:

| Param | Meaning |
| --- | --- |
| `<class>` | One of `fighter, thief, cleric, magicuser, assassin, druid, paladin, illusionist, ranger, monk`. Multiclass joined with `\|`, e.g. `fighter\|thief` |
| `<species>` | `human, halfling, dwarf, gnome, elf, half-orc, half-elf` |
| `xp<number>` | Experience points, e.g. `xp12000` |
| `seed` | Deterministic generation |
| `name` | Set character name |
| `-verbose` | Also return the embed sheet in-channel |

Example: `~rollHero fighter|thief xp12000 -verbose`

`~rollHero` consumes the attribute roll cached by the user's last
`~rollAttributes`; if none exists, it rolls fresh. The cache is cleared after use.

## Error replies

| Condition | Reply |
| --- | --- |
| No guild config file | `no configuration found for [guild]` (as thrown error text) |
| Channel category not a timeline | `no timeline found : [name]` |
| Timeline's plane missing | `no plane found : [planeId]` |
| `~sync` without `echt (MEZ)` offset | `keinen Bezug zum 'echten' Datum gefunden` |
| Absolute date month/day `00` | validation message about null month/day |
| Unrecognized date parameter | `unrecognized date parameter [...]` |
| Any handler exception | `that didn't work! [message]` |

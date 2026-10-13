# Wettergoblin — Documentation Index

`wettergoblin` is a Discord bot for tabletop RPG campaign management. It tracks
in-world dates across multiple "planes" and "timelines", generates deterministic
seasonal weather, renders moon phases, draws small hex maps as SVG, keeps a dated
event log (notes), and generates AD&D-1st-edition-style player characters.

- Package: `wettergoblin` v1.1.0
- Runtime: Node.js + [discord.js](https://discord.js.org) v14
- Entry point: [index.js](../index.js)
- Language of user-facing output: mostly German, some English

## Document set

| Document | Content |
| --- | --- |
| [architecture/architecture.md](architecture/architecture.md) | System, component, and runtime architecture with diagrams |
| [specs/functional-spec.md](specs/functional-spec.md) | Features, use cases, workflows, acceptance criteria |
| [specs/technical-spec.md](specs/technical-spec.md) | Modules, algorithms, dependencies, known issues |
| [specs/data-models.md](specs/data-models.md) | Persisted JSON schemas and in-memory state |
| [api/commands.md](api/commands.md) | Full chat-command reference |

## One-paragraph summary

On every Discord message starting with `~`, the bot dispatches to a command
handler. Campaign configuration (planes, calendars, moons, timelines) is loaded
per Discord guild from `<GuildName>.json`. The Discord channel's **category name**
identifies the active timeline; the timeline points at a plane, which defines the
calendar and weather seed. Handlers read/mutate this state, optionally persist it,
and reply with text, embeds, or file attachments (`.txt` event logs, `.svg` maps,
`.txt` character sheets).

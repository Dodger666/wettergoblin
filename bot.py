#!/usr/bin/env python3
"""Discord bot that exposes the rollhero character generator.

Commands
--------
  ~rollHero [params]        classic prefix command (matches the original bot)
  /rollhero params:<...>    modern slash command

Params are identical to rollhero.py, for example:
  ~rollHero fighter xp12000
  ~rollHero fighter|thief elf xp40000 name=Bob
  ~rollHero magicuser xp60000 seed7

Note: in Discord you do NOT need to quote multiclass values - just type the
pipe directly, e.g.  fighter|thief

Setup
-----
  1. pip install -r requirements.txt
  2. Set your bot token in the DISCORD_TOKEN environment variable:
         export DISCORD_TOKEN="your-bot-token"
  3. python bot.py

The token is never hard-coded; it is read from the DISCORD_TOKEN environment variable.
"""

import io
import os
import re
import sys

import discord
from discord import app_commands
from discord.ext import commands

from rollhero import Character, USAGE

PREFIX = "~"
COMMAND_NAME = "rollHero"
DISCORD_MSG_LIMIT = 2000
HELP_FLAGS = {"-h", "--help", "help"}


def wants_help(params: str) -> bool:
    """Return True if the params request the usage/help text."""
    tokens = (params or "").replace('"', "").split()
    return any(tok.lower() in HELP_FLAGS for tok in tokens)


def help_text() -> str:
    """Return the usage text wrapped in a Discord code block."""
    return "```\n" + USAGE + "\n```"


def load_token():
    """Return the Discord bot token from the DISCORD_TOKEN environment variable."""
    return os.environ.get("DISCORD_TOKEN")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix=PREFIX, intents=intents, help_command=None)


def _sanitize_filename(value: str) -> str:
    """Return a filesystem/Discord-safe slug for use in a filename."""
    value = (value or "").strip().lower()
    # Collapse any run of characters that aren't alphanumerics into a single underscore.
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_")


def build_filename(char) -> str:
    """Build the attachment filename for a generated character.

    Always uses the ``<class>_<race>_<level>`` pattern, prefixed with the
    character name when one was supplied.
    """
    parts = []

    supplied_name = (char.params.get("name") or "").strip()
    if supplied_name:
        parts.append(_sanitize_filename(supplied_name))

    parts.extend([
        _sanitize_filename(char.clazz or ""),
        _sanitize_filename(char.race or ""),
        _sanitize_filename(str(char.get_levels())),
    ])

    base = "_".join(p for p in parts if p)

    return (base or "char") + ".txt"


def build_sheet(params: str):
    """Generate a character sheet from the given params string.

    Returns a tuple (code_block, file):
      - code_block: the sheet wrapped in a markdown code block if it fits
        within Discord's message limit, otherwise None.
      - file: a discord.File always containing the full sheet. The file is
        named after the character, or ``<class>_<race>_<level>`` when no name
        was supplied.
    """
    # Discord users have no shell, so strip stray quotes for convenience.
    clean = (params or "").replace('"', "").strip()

    char = Character.generate(clean)
    sheet = char.to_text_sheet()

    filename = build_filename(char)
    file = discord.File(io.BytesIO(sheet.encode("utf-8")), filename=filename)

    wrapped = "```\n" + sheet + "\n```"
    block = wrapped if len(wrapped) <= DISCORD_MSG_LIMIT else None

    return block, file


@bot.event
async def on_ready():
    try:
        synced = await bot.tree.sync()
        print(f"synced {len(synced)} slash command(s)")
    except Exception as exc:  # noqa: BLE001
        print(f"slash command sync failed: {exc}")
    print(f"logged in as {bot.user} - subservient weathergobbo, at your command")


@bot.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return

    content = message.content.strip()
    trigger = (PREFIX + COMMAND_NAME).lower()

    if content.lower().startswith(trigger):
        params = content[len(PREFIX + COMMAND_NAME):].strip()
        if wants_help(params):
            await message.channel.send(help_text())
            return
        try:
            block, file = build_sheet(params)
            if block is not None:
                await message.channel.send(block, file=file)
            else:
                await message.channel.send(file=file)
        except Exception as err:  # noqa: BLE001
            await message.channel.send(f"that didn't work! [{err}]")
        return

    # Allow any other registered commands to run.
    await bot.process_commands(message)


@bot.tree.command(name="rollhero", description="Generate an AD&D-1e style character sheet")
@app_commands.describe(
    params='e.g. "fighter xp12000"  or  "fighter|thief elf xp40000 name=Bob"'
)
async def rollhero_slash(interaction: discord.Interaction, params: str = ""):
    if wants_help(params):
        await interaction.response.send_message(help_text(), ephemeral=True)
        return
    try:
        block, file = build_sheet(params)
        if block is not None:
            await interaction.response.send_message(block, file=file)
        else:
            await interaction.response.send_message(file=file)
    except Exception as err:  # noqa: BLE001
        await interaction.response.send_message(f"that didn't work! [{err}]", ephemeral=True)


def main():
    token = load_token()
    if not token:
        sys.stderr.write(
            "error: no bot token found.\n"
            "Set the DISCORD_TOKEN environment variable, e.g.:\n"
            '  export DISCORD_TOKEN="your-bot-token"\n'
        )
        return 1
    bot.run(token)
    return 0


def run_bot_process():
    """Entry point for running the bot inside a separate process.

    Used by the RollHero FastAPI app, which spawns the Discord bot in its own
    process so it runs independently of the web server. ``multiprocessing``
    (spawn start method on macOS) re-imports this module in the child and calls
    this top-level function.
    """
    sys.exit(main())


if __name__ == "__main__":
    sys.exit(main())

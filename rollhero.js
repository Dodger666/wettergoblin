// CLI entry point for character generation (the ~rollHero command).
//
// Usage:
//   node rollhero.js [params...]
//
// Params mirror the Discord "~rollHero" command, e.g.:
//   node rollhero.js fighter xp12000
//   node rollhero.js "fighter|thief" xp12000 name=Bob
//   node rollhero.js magicuser elf xp40000
//
// Notes:
//   - Quote multiclass values so the shell does not interpret the pipe, e.g. "fighter|thief".
//   - Without an xp<number> param the character is level 1 and receives (almost) no magic items.
//   - Prints the text character sheet to stdout.

// Silence the module-load and debug console.log noise emitted by character.js and
// its dependencies so the CLI prints only the character sheet. Restored before output.
const realConsoleLog = console.log;
console.log = function () {};

const { Character } = require('./character');

function main(argv)
{
    const args = argv.slice(2);

    if (args.includes('-h') || args.includes('--help'))
    {
        console.log = realConsoleLog;
        printUsage();
        return 0;
    }

    // Mirror the Discord handler: roll a set of attributes, then build the character.
    const attrs = Character.rollSRAttributes();

    // parseParams splits on whitespace, so a single joined string is equivalent to the message content.
    const commandLine = args.join(' ');

    let char;
    try
    {
        char = new Character(attrs, commandLine);
    }
    catch (err)
    {
        console.log = realConsoleLog;
        console.error('character generation failed: ' + err.message);
        console.error(err.stack);
        return 1;
    }

    console.log = realConsoleLog;

    process.stdout.write(char.toTextSheet());
    process.stdout.write('\n');

    return 0;
}

function printUsage()
{
    console.log(`rollhero - generate an AD&D-1e style character sheet

Usage:
  node rollhero.js [params...]

Params (all optional, space separated):
  <class>        fighter, thief, cleric, magicuser, assassin, druid,
                 paladin, illusionist, ranger, monk
                 multiclass joined with '|', e.g. "fighter|thief"
  <species>      human, halfling, dwarf, gnome, elf, half-orc, half-elf
  xp<number>     experience points, e.g. xp12000
  seed<number>   deterministic class/race/alignment selection
  name=<text>    set the character name

Examples:
  node rollhero.js fighter xp12000
  node rollhero.js "fighter|thief" elf xp40000 name=Bob
  node rollhero.js magicuser xp60000`);
}

process.exit(main(process.argv));

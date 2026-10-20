// One-off generator for the pregen roster (docs/pregen.md).
// For each entry: 11000 XP, fixed class/race, re-rolled until the character
// owns at least one magical object. Output is written one character per page
// (form-feed separated) to docs/pregen_characters.txt.

const fs = require('fs');
const path = require('path');

// Silence the module-load / debug console.log noise from character.js & deps.
const realLog = console.log;
console.log = function () {};

const { Character } = require('./character');

console.log = realLog;

const roster = [
    { name: 'Vali, Son of Fain',       clazz: 'fighter',            race: 'dwarf'    },
    { name: 'Einar Eriksson',          clazz: 'fighter',            race: 'human'    },
    { name: 'Bredan mac Brus',         clazz: 'fighter',            race: 'human'    },
    { name: 'Camden of the Green',     clazz: 'ranger',             race: 'human'    },
    { name: 'Lurgha the Destroyer',    clazz: 'fighter|cleric',     race: 'half-orc' },
    { name: 'Raedwulf of Berghoff',    clazz: 'fighter|thief',      race: 'half-elf' },
    { name: 'Râna of the Gilfaeli',    clazz: 'fighter|magicuser',  race: 'elf'      },
    { name: 'Timothe the Enchanter',   clazz: 'magicuser',          race: 'human'    },
    { name: 'The Sorceress Lorella',   clazz: 'magicuser',          race: 'human'    },
    { name: 'Giselle of Löxwych',      clazz: 'illusionist',        race: 'human'    },
    { name: 'Danthâlion the Seeker',   clazz: 'magicuser|thief',    race: 'elf'      },
    { name: 'Oswald "Ozzy" Sly-Foot',  clazz: 'thief',              race: 'halfling' },
    { name: 'Dag Olafsson',            clazz: 'thief',              race: 'human'    },
    { name: 'Burke of Beligshire',     clazz: 'cleric',             race: 'human'    },
    { name: 'Ligeia of Peleos',        clazz: 'cleric',             race: 'human'    },
    { name: 'Kerraigh mac Kullen',     clazz: 'druid',              race: 'human'    },
];

const XP = 11000;

// Exact set of "miscellaneous" wondrous items (character.js setMisc table).
const MISC_MAGIC = new Set([
    'ring o.feath.fall', 'ring o.warmth', 'ring o.waterwalk', 'wand o.negation',
    'wand o.wonder', 'bag o.holding', 'folding boat', 'brooch o.shielding',
    'cloak o.elvenkind', 'boots o.elvenkind', '2 javelin o.lightning',
    '2 javelin o.piercing', 'necklace o.adaptation', 'robe o.useful items',
    'rope o.climbing', 'trident o.warning', 'wings o.flying', 'boots o.levitation',
]);

function isMagicItem(s) {
    return /^potion:/.test(s)       // potions
        || /^scroll:/.test(s)       // scrolls
        || /\+[12]\b/.test(s)       // enchanted shield / ring of protection
        || /AC[46]/.test(s)         // magic bracers
        || MISC_MAGIC.has(s);       // wondrous items
}

function hasMagic(char) {
    if ((char.items || []).some(isMagicItem)) return true;
    if ((char.weapons || []).some(w => /\+[12]/.test(w[0]))) return true;
    if (char.armor && (/\+[12]/.test(char.armor) || /AC[46]/.test(char.armor))) return true;
    return false;
}

function rollUntilMagic(entry) {
    const commandLine = `${entry.clazz} ${entry.race} xp${XP}`;
    const MAX_TRIES = 50000;

    let char;
    let tries = 0;

    console.log = function () {}; // silence per-generation "dadaa" noise
    try {
        do {
            const attrs = Character.rollSRAttributes();
            char = new Character(attrs, commandLine);
            tries++;
        } while (!hasMagic(char) && tries < MAX_TRIES);
    } finally {
        console.log = realLog;
    }

    char.name = entry.name;
    return { char, tries };
}

const sheets = [];

roster.forEach(entry => {
    const { char, tries } = rollUntilMagic(entry);
    realLog(`generated ${entry.name.padEnd(26)} [${entry.clazz} / ${entry.race}] after ${tries} roll(s)`);
    sheets.push(char.toTextSheet());
});

// One character per page: separate sheets with a form-feed (ASCII 12).
const content = sheets.join('\n\f');

const outPath = path.join(__dirname, 'docs', 'pregen_characters.txt');
fs.writeFileSync(outPath, content + '\n');

realLog(`\nwrote ${sheets.length} character sheets to ${outPath}`);

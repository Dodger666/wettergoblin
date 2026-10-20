console.log("... spells.js");

const { Def } = require('./defines.js');

exports.Spells = class Spells
{
    static SPELLS_MU = new Map([[1, [["affect normal fire",1],  ["alarm",1],            ["armor",2],
                                     ["burning hands",1],       ["charm person",3],     ["comprehend language",1],
                                     ["dancing light",1],       ["detect magic",2],     ["enlarge",1],
                                     ["enrage",1],              ["feather fall",1],     ["find familiar",1],
                                     ["firewater",1],           ["friends",1],          ["grease",2],
                                     ["hold portal",1],         ["identify",1],         ["jump",1],
                                     ["light",1],               ["magic missile",3],    ["melt",1],
                                     ["mending",1],             ["message",1],          ["mount",1],
                                     ["magic aura",1],          ["precipitation",1],    ["protection from evil",2],
                                     ["push",1],                ["write",1],            ["run",1],
                                     ["shield",2],              ["shocking grasp",1],   ["sleep",3],
                                     ["spider climb",2],        ["taunt",1],            ["floating disc",1],
                                     ["unseen servant",1],      ["ventriloquism",1],    ["wizard mark",1]]],

                                [2, [["audible glamer",1],      ["blind",1],            ["continual light",2],
                                     ["darkness 15'radius",2],  ["deeppockets",1],      ["detect evil",1],
                                     ["detect invisible",1],    ["ESP",2],              ["flaming sphere",2],
                                     ["fools gold",1],          ["forget",1],           ["invisibility",3],
                                     ["irritation",1],          ["knock",2],            ["know alignment",1],
                                     ["levitate",3],            ["locate object",1],    ["magic mouth",1],
                                     ["acid arrow",2],          ["mirror image",3],     ["preserve",1],
                                     ["pyrotechnics",2],        ["ray of enfeeblement",1],["rope trick",1],
                                     ["scare",1],               ["shatter",1],          ["stinking cloud",3],
                                     ["strength",1],            ["uncontrollable laughter",2], ["vocalize",1],
                                     ["web",3],                 ["whip",1],             ["wizard lock",1],
                                     ["zephyr",1]]],
                                [3, [["blink",1],               ["clairaudience",1],    ["clairvoyance",1],
                                     ["cloudburst",1],          ["detect illusion",1],  ["dispel magic",3],
                                     ["explosive runes",2],     ["feign death",1],      ["fireball",3],
                                     ["flame arrow",2],         ["fly",3],              ["gust of wind",1],
                                     ["haste",2],               ["hold person",3],      ["infravision",1],
                                     ["invisibility 15' radius",2],["tiny hut",1],      ["lightning bolt",3],
                                     ["material",1],            ["minute meteor",2],    ["monster summon 1",2],
                                     ["phantasmal force",2],    ["protection from evil 10'",2],  ["protection from missiles",2],
                                     ["secret page",1],         ["snake sigil",1],      ["slow",3], 
                                     ["suggestion",2],          ["tongues",2],          ["water breathing",1],
                                     ["wind wall",1]]],
                                [4, [["charm monster",3],       ["confusion",3],        ["dig",1],
                                     ["dimension door",2],      ["dispel illusion",1],  ["enchanted weapon",1],
                                     ["black tentacles",2],     ["extension 1",1],      ["fear",3],
                                     ["fire charm",1],          ["fire shield",2],      ["fire trap",1],
                                     ["fumble",2],              ["hallucinatory terrain",1], ["ice storm",3],
                                     ["secure shelter",2],      ["magic mirror",2],     ["massmorph",1],
                                     ["minor globe of invuln.",2],  ["massmorph",1], ["resilient sphere",2],
                                     ["plant growth",1],        ["polymorph other",3],  ["polymorph self",3],
                                     ["mnemonic enhancer",1],   ["remove curse",2],     ["shout",1],
                                     ["stoneskin",3],           ["ultravision",1],      ["wall of fire",3],
                                     ["wall of ice",2],         ["wizard eye",2]]],
                                [5, [["airy water",2],          ["animal growth",2],    ["animate dead",2],
                                     ["avoidance",2],           ["interposing hand",3], ["cloudkill",3],
                                     ["conjure elemental",3],   ["cone of cold",3],     ["contact other plane",1],
                                     ["dismissal",1],           ["distance distortion",1], ["dolor",1],
                                     ["extension II",1],        ["fabricate",1],        ["feeblemind",1],
                                     ["hold monster",3],        ["secret chest",1],     ["magic jar",2],
                                     ["monster summoning 3",3], ["faithful hound",1],   ["passwall",2],
                                     ["sending",1],             ["stone shape",2],      ["telekinesis",1],
                                     ["teleport",1],            ["rock to mud",2],      ["wall of force",2],
                                     ["wall of iron",2],        ["wall of stone",2]]],
                                [6, [["anti magic shell",2],    ["forceful hand",3],    ["death spell",3],
                                     ["enchant item",3],        ["geas",2],             ["disintegrate",2],
                                     ["control weather",1],     ["invisible stalker",2],["legend lore",2],
                                     ["glassee",1],             ["guards & wards",1],     ["lower water",1],
                                     ["move earth",1],          ["freezing sphere",2],    ["project image",2],
                                     ["reincarnation",1],       ["repulsion",1],        ["spiritwrack",1],
                                     ["stone to flesh",3],       ["globe of invulnerability",3], ["monster summoning 4",3]]]
                              ]);

    static SPELLS_CL = new Map([[1, [["bless",1],               ["combine",1],          ["command",3],
                                     ["create water",1],        ["ceremony",1],         ["cure light wounds",3],
                                     ["detect evil",1],         ["detect magic",2],     ["endure cold/heat",1],
                                     ["invisibility to undead",1],      ["light",2],            ["magic stone",1],
                                     ["penetrate disguise",1],     ["portent",1],          ["precipitation",1],
                                     ["protection from evil",2],         ["purify food&drink",1],["remove fear",1],
                                     ["resist cold",2],         ["sanctuary",2]]],

                                [2, [["aid",1],                 ["augury",2],           ["chant",1],
                                     ["detect charm",1],        ["detect life",1],      ["dust devil",1],
                                     ["enthrall",1],            ["find traps",3],       ["hold person",3],
                                     ["holy symbol",1],         ["know alignment",2],   ["messenger",1],
                                     ["resist fire",2],         ["silence 15' radius",3],      ["slow poison",2],
                                     ["snake charm",1],         ["speak with animals",2],  ["spiritual hammer",2],
                                     ["withdraw",1],            ["wyvern watch",2]]],

                                [3, [["animate dead",2],        ["cloudburst",2],       ["continual light",2],
                                     ["create food&water",1],   ["cure blindness",2],   ["cure disease",2],
                                     ["death's door",1],        ["dispel magic",3],     ["feign death",1],
                                     ["flame walk",1],          ["glyph of warding",1], ["locate object",2],
                                     ["magical vestment",1],    ["meld into stone",1],  ["negative plane protection",2],
                                     ["prayer",2],              ["remove curse",3],     ["remove paralysis",1],
                                     ["speak with dead",2],       ["water walk",1]]],

                                [4, [["abjure",1],              ["cloak of fear",1],    ["cure serious wounds",3],
                                     ["detect lie",2],          ["divination",2],       ["exorcise",2],
                                     ["giant insect",1],        ["imbue with spell ability",1],["lower water",1],
                                     ["neutralize poison",3],       ["protection from evil 15'",3],  ["speak with plants",1],
                                     ["spell immunity",1],      ["spike stones",1],     ["sticks to snakes",1],
                                     ["tongues",2]]],

                                [5, [["air walk",2],            ["animate dead monster",3],["atonement",1],
                                     ["commune",1],             ["cure critical wounds",3],["dispel evil",3],
                                     ["flame strike",3],        ["golem",1],            ["insect plague",2],
                                     ["magic font",1],          ["plane shift",3],      ["quest",2],
                                     ["rainbow",1],             ["raise dead",3],       ["spike growth",1],
                                     ["true seeing",3]]]
                                ]);

    static SPELLS_DR = new Map([[1, [["animal friend.",3],  ["ceremony",1],      ["detect balance",1],
                                     ["detect magic",2],    ["detect poison",1], ["detect snares&pits",2],
                                     ["entangle",3],        ["faery fire",1],    ["invisibility to animals",1],
                                     ["locate animals",1],  ["pass without trace",1],["precipitation",2],
                                     ["predict weather",1], ["purify water",1],  ["shillelagh",1],
                                     ["speak with animals",2]]],

                                [2, [["barkskin",1],        ["charm person/mammal",3], ["create water",1],
                                     ["cure light wounds",2], ["feign death",1],     ["fire trap",1],
                                     ["flame blade",1],     ["goodberry",3],       ["heat metal",3],
                                     ["locate plants",1],   ["obscurement",1],     ["produce flame",1],
                                     ["reflecting pool",3], ["slow poison",3],     ["trip",1],
                                     ["warp wood",2]]],

                                [3, [["call lightning",3],  ["cloudburst",1],      ["cure disease",2],
                                    ["hold animal",2],      ["know alignment",1],  ["neutral. poison",3],
                                    ["plant growth",1],     ["protection from fire",2],     ["pyrotechnics",2],
                                    ["snare",1],            ["spike growth",1],    ["starshine",2],
                                    ["stone shape",2],      ["summon insect",1],   ["tree",2],
                                    ["water breathing",2]]],

                                [4, [["animal summoning 1",2], ["call woodland beings",3], ["control temp.",1],
                                     ["cure serious wounds",3], ["dispel magic",3],    ["hallucinatory forest",1],
                                     ["hold plant",2],      ["plant door",2],      ["produce fire",2],
                                     ["protection from lightning",2], ["repel insects",1],   ["speak with plants",2]]],

                                [5, [["animal growth",2],   ["animal summoning 2",3],  ["anti-plant shell",2],
                                     ["commune with nature",1], ["control winds",1],   ["insect plague",2],
                                     ["moonbeam",2],        ["passplant",1],       ["spike stones",2],
                                     ["sticks to snakes",1],["rock to mud",2],     ["wall of fire",3]]]
                                ]);

    static SPELLS_IL = new Map([[1, [["audible glamor",1],  ["change self",2],     ["chromatic orb",2],
                                     ["color spray",3],     ["dancing lights",1],  ["darkness",2],
                                     ["detect illusion",1], ["detect invisib.",1], ["gaze reflection",2],
                                     ["hypnotism",2],       ["light",1],           ["phantasmal force",3],
                                     ["phantom armor",1],   ["wall of fog",1],     ["spook",2]]],

                                [2, [["alter self",2],      ["blindness",1],       ["blur",2],
                                     ["deafness",1],        ["detect magic",2],    ["fascinate",1],
                                     ["fog cloud",1],       ["hypnotic pattern",2],  ["improved phantasmal force",3],
                                     ["invisibility",3],    ["magic mouth",1],     ["mirror image",3],
                                     ["misdirection",1],    ["ultravision",1],     ["ventriloquism",1],
                                     ["whispering wind",1]]],

                                [3, [["continual darkness",2], ["continual light",2],      ["delude",2],
                                     ["dispel illusion",1],["fear",2],             ["hallucinatory terrain",1],
                                     ["illusionary script",1],  ["invisibility 10' radius",3], ["non-detection",2],
                                     ["paralyzation",2],   ["phantom steed",2],    ["phantom wind",1],
                                     ["rope trick",2],     ["spectral force",3],   ["suggestion",2],
                                     ["wraithform",3]]],

                                [4, [["confusion",3],      ["dispel exhaustion",1],["dispel magic",3],
                                     ["emotion",1],        ["improved invisibility",3],["massmorph",1],
                                     ["minor creation",1], ["phantasmal killer",3],["rainbow pattern",2],
                                     ["shadow monster",2], ["solid fog",1],        ["vacancy",1]]],

                                [5, [["advanced illusion",3],   ["chaos",3],            ["demi-shadow monster",2],
                                     ["dream",1],          ["magic mirror",3],     ["major creation",2],
                                     ["maze",2],           ["projected image",2],  ["shadow door",2],
                                     ["shadow magic",2],   ["summon shadow",2],    ["tempus fugit",2]]]
                                ]);

    static spellTables(char)
    {
        let res = [];

        if (char.clazz.includes(Def.MAGICUSER)) res.push(Spells.SPELLS_MU);
        if (char.clazz.includes(Def.CLERIC)) res.push(Spells.SPELLS_CL);
        if (char.clazz.includes(Def.DRUID)) res.push(Spells.SPELLS_DR);
        if (char.clazz.includes(Def.ILLUSIONIST)) res.push(Spells.SPELLS_IL);

        return res;
    }

    static spellsPerPaladinLevel = function(lvl)
    {
        if (lvl < 9) return undefined;
        if (lvl < 10) return [1];
        if (lvl < 11) return [2];
        
        return [2,1];
    }

    static spellsPerRangerDruidLevel = function(lvl)
    {   
        if (lvl < 8) return undefined;
        if (lvl < 10) return [1];
        if (lvl < 12) return [2];
        
        return [2,1];
    }

    static spellsPerRangerMageLevel = function(lvl)
    {        
        if (lvl < 9) return undefined;
        if (lvl < 11) return [1];
        if (lvl < 13) return [2];
        
        return [2,1];
    }

    static addBonusSpells = function(perLvl, wis)
    {
          if (wis > 12 && perLvl.length > 0) perLvl[0]+=1;
          if (wis > 13 && perLvl.length > 0) perLvl[0]+=1;
          if (wis > 14 && perLvl.length > 1) perLvl[1]+=1;
          if (wis > 15 && perLvl.length > 1) perLvl[1]+=1;
          if (wis > 16 && perLvl.length > 2) perLvl[2]+=1;
          if (wis > 17 && perLvl.length > 2) perLvl[2]+=1;
    }

    static spellsPerClericLevel = function(lvl)
    {
        if (lvl < 2)  return [1];
        if (lvl < 3)  return [2];
        if (lvl < 4)  return [2,1];
        if (lvl < 5)  return [3,2];
        if (lvl < 6)  return [3,3,1];
        if (lvl < 7)  return [3,3,2];
        if (lvl < 8)  return [3,3,2,1];
        if (lvl < 9)  return [3,3,3,2];
        if (lvl < 10) return [4,4,3,2,1];
        if (lvl < 11) return [4,4,3,3,2];
        
        return [5,4,4,3,2,1];
    }

    static spellsPerDruidLevel = function(lvl)
    {
        if (lvl < 2)  return [2];
        if (lvl < 3)  return [2,1];
        if (lvl < 4)  return [3,2,1];
        if (lvl < 5)  return [4,2,2];
        if (lvl < 6)  return [4,3,2];
        if (lvl < 7)  return [4,3,2,1];
        if (lvl < 8)  return [4,4,3,1];
        if (lvl < 9)  return [4,4,3,2];
        if (lvl < 10) return [5,4,3,2,1];
        if (lvl < 11) return [5,4,3,3,2];
        
        return [5,5,3,3,2,1];
    }

    static spellsPerMageLevel = function(lvl)
    {
        if (lvl < 2)  return [1];
        if (lvl < 3)  return [2];
        if (lvl < 4)  return [2,1];
        if (lvl < 5)  return [3,2];
        if (lvl < 6)  return [4,2,1];
        if (lvl < 7)  return [4,2,2];
        if (lvl < 8)  return [4,3,2,1];
        if (lvl < 9)  return [4,3,3,2];
        if (lvl < 10) return [4,3,3,2,1];
        if (lvl < 11) return [4,4,3,2,2];
        
        return [4,4,4,3,3];
    }

    static spellsPerIlluLevel = function(lvl)
    {
        if (lvl < 2)  return [1];
        if (lvl < 3)  return [2];
        if (lvl < 4)  return [2,1];
        if (lvl < 5)  return [3,2];
        if (lvl < 6)  return [4,2,1];
        if (lvl < 7)  return [4,3,1];
        if (lvl < 8)  return [4,3,2];
        if (lvl < 9)  return [4,3,2,1];
        if (lvl < 10) return [5,3,3,2];
        if (lvl < 11) return [5,4,3,2,1];
        
        return [5,4,3,3,2];
    }
}

console.log("... defines.js");

const { Table } = require('./table.js');

exports.Def = class Def
{
    static STR = "STR";
    static DEX = "DEX";
    static CON = "CON";
    static INT = "INT";
    static WIS = "WIS";
    static CHA = "CHA";
    static ATTRIBUTES = [Def.STR, Def.DEX, Def.CON, Def.INT, Def.WIS, Def.CHA];

    static FIGHTER      = "fighter";
    static THIEF        = "thief";
    static CLERIC       = "cleric";
    static MAGICUSER    = "magicuser";
    static ASSASSIN     = "assassin";
    static DRUID        = "druid";
    static PALADIN      = "paladin";
    static ILLUSIONIST  = "illusionist";
    static RANGER       = "ranger";
    static MONK         = "monk";
    static CLASSES = [Def.FIGHTER, Def.THIEF, Def.CLERIC, Def.MAGICUSER, Def.ASSASSIN, Def.DRUID, Def.PALADIN, Def.ILLUSIONIST, Def.RANGER, Def.MONK];        

    static FIGHTER_THIEF            = Def.FIGHTER+"|"+Def.THIEF;    
    static FIGHTER_CLERIC           = Def.FIGHTER+"|"+Def.CLERIC;
    static FIGHTER_MAGICUSER        = Def.FIGHTER+"|"+Def.MAGICUSER;
    static FIGHTER_ASSASSIN         = Def.FIGHTER+"|"+Def.ASSASSIN;
    static FIGHTER_ILLUSIONIST      = Def.FIGHTER+"|"+Def.ILLUSIONIST;    
    static FIGHTER_THIEF_MAGICUSER  = Def.FIGHTER+"|"+Def.THIEF+"|"+Def.MAGICUSER;
    static FIGHTER_MAGICUSER_CLERIC = Def.FIGHTER+"|"+Def.MAGICUSER+"|"+Def.CLERIC;    
    static THIEF_MAGICUSER          = Def.THIEF+"|"+Def.MAGICUSER;
    static THIEF_ILLUSIONIST        = Def.THIEF+"|"+Def.ILLUSIONIST;
    static THIEF_CLERIC             = Def.THIEF+"|"+Def.CLERIC;    
    static CLERIC_ASSASSIN          = Def.CLERIC+"|"+Def.ASSASSIN;
    static CLERIC_RANGER            = Def.CLERIC+"|"+Def.RANGER;
    static CLERIC_MAGICUSER         = Def.CLERIC+"|"+Def.MAGICUSER;
    static MULTICLASSES =  [Def.FIGHTER_THIEF, Def.FIGHTER_CLERIC, Def.FIGHTER_MAGICUSER, Def.FIGHTER_ASSASSIN, Def.FIGHTER_ILLUSIONIST, 
                            Def.FIGHTER_THIEF_MAGICUSER, Def.FIGHTER_MAGICUSER_CLERIC, 
                            Def.THIEF_MAGICUSER, Def.THIEF_ILLUSIONIST, Def.THIEF_CLERIC,
                            Def.CLERIC_ASSASSIN , Def.CLERIC_MAGICUSER, Def.CLERIC_RANGER];
    
    static HUMAN      = "human";
    static HALFLING   = "halfling";
    static DWARF      = "dwarf";
    static GNOME      = "gnome";
    static ELF        = "elf";
    static HALFORC    = "half-orc";
    static HALFELF    = "half-elf";
    static RACES = [Def.HUMAN, Def.HALFLING, Def.DWARF, Def.GNOME, Def.ELF, Def.HALFORC, Def.HALFELF];    

    static LG         = "lawful good";
    static LN         = "lawful neutral";    
    static LE         = "lawful evil";
    static CG         = "chaotic good";
    static CN         = "chaotic neutral";
    static CE         = "chaotic evil";
    static NN         = "true neutral";
    static NG         = "neutral good";
    static NE         = "neutral evil";
    static ALIGNMENT  = [Def.LG, Def.LN, Def.LE, Def.CG, Def.CN, Def.CE, Def.NN, Def.NG, Def.NE];

    static PICKPOCKETS  = "pickpockets";
    static OPENLOCKS    = "open locks";
    static FINDTRAPS    = "find&remove traps";
    static MOVESILENT   = "move silently";
    static HIDEINSHADOW = "hide in shadows";
    static HEARNOISE    = "hear noise";
    static CLIMBWALLS   = "climb walls";
    static READLANGUAGE = "read languages";
    static THIEFTALENTS = [Def.PICKPOCKETS, Def.OPENLOCKS, Def.FINDTRAPS, Def.MOVESILENT, Def.HIDEINSHADOW, Def.HEARNOISE, Def.CLIMBWALLS, Def.READLANGUAGE];

    static ALLCLASSES = Def.CLASSES.concat(Def.MULTICLASSES);    

    static raceMods = function(race) 
    {
        switch (race)
        {
            case Def.HALFLING: 
                return new Map([[Def.DEX, 1], [Def.STR, -1]]);
            case Def.HALFORC:
                return new Map([[Def.STR, 1],[Def.CON, 1], [Def.CHA, -2]]);
            case Def.ELF:
                return new Map([[Def.DEX, 1], [Def.CON, -1]]);
            case Def.DWARF:
                return new Map([[Def.CON, 1], [Def.CHA, -1]]);
        }
        return new Map();
    }

    static HITDICE = new Map([[Def.FIGHTER    ,10],
                              [Def.THIEF      , 6],
                              [Def.CLERIC     , 8],
                              [Def.MAGICUSER  , 4],
                              [Def.ASSASSIN   , 6],
                              [Def.DRUID      , 8],
                              [Def.PALADIN    ,10],
                              [Def.ILLUSIONIST, 4],
                              [Def.RANGER     , 8],
                              [Def.MONK       , 4]]);

    static racesForClass = function(klass) {
        
        if (klass.includes('|')) return new Map(Def.racesForMulticlass(klass));

        return new Map(Def.racesForSingleClass(klass));
    }

    static racesForMulticlass = function(klass) {
        switch (klass)
        {
            case Def.FIGHTER_THIEF     :
                return new Map([[Def.ELF, 1], [Def.GNOME, 1], [Def.HALFELF, 1], [Def.HALFLING, 1], [Def.HALFORC, 1], [Def.DWARF, 1]]);
            case Def.FIGHTER_CLERIC    :
                return new Map([[Def.HALFELF, 1], [Def.HALFORC, 1]]);
            case Def.FIGHTER_MAGICUSER :
                return new Map([[Def.ELF, 1], [Def.HALFELF, 1]]);    
            case Def.FIGHTER_ASSASSIN  :
                return new Map([[Def.HALFORC, 1]]);
            case Def.FIGHTER_ILLUSIONIST :
                return new Map([[Def.GNOME, 1]]);        

            case Def.FIGHTER_THIEF_MAGICUSER :
                return new Map([[Def.ELF, 1], [Def.HALFELF, 1]]);        
            case Def.FIGHTER_MAGICUSER_CLERIC:
                return new Map([[Def.HALFELF, 1]]);        

            case Def.THIEF_MAGICUSER :
                return new Map([[Def.ELF, 1], [Def.HALFELF, 1]]);        
            case Def.THIEF_ILLUSIONIST    :
                return new Map([[Def.GNOME, 1]]);                
            case Def.THIEF_CLERIC:
                return new Map([[Def.ELF, 1], [Def.HALFELF, 1]]);        
            case Def.CLERIC_ASSASSIN    :
                return new Map([[Def.HALFORC, 1]]);     
            case Def.CLERIC_MAGICUSER   :
                return new Map([[Def.HALFELF, 1]]);     
            case Def.CLERIC_RANGER:
                return new Map([[Def.HALFELF, 1]]);
            default :
                return new Map();
        }
    }

    static racesForSingleClass = function(klass) {
        
        // usually humans are predominant and get a 75% base chance
        switch (klass)
        {
            case Def.MONK       : 
                return new Map([[Def.HUMAN, 1]]);

            case Def.PALADIN    : 
                return new Map([[Def.HUMAN, 1]]);

            case Def.RANGER     :
                return new Map([[Def.HUMAN, 2], [Def.HALFELF, 1]]);

            case Def.DRUID      :
                return new Map([[Def.HUMAN, 4], [Def.HALFELF, 1]]);

            case Def.ILLUSIONIST:
                return new Map([[Def.HUMAN, 2], [Def.GNOME, 1]]);

            case Def.CLERIC     :
                return new Map([[Def.HUMAN, 10], [Def.HALFORC, 1], [Def.HALFELF, 1]]);

            case Def.MAGICUSER  :                     
                return new Map([[Def.HUMAN, 4], [Def.ELF, 1], [Def.HALFELF, 1]]);

            case Def.ASSASSIN   :                              
                return new Map([[Def.HUMAN, 10], [Def.DWARF, 1], [Def.GNOME, 1], [Def.ELF, 1], [Def.HALFORC, 1], [Def.HALFELF, 1]]);

            case Def.THIEF   :                              
            case Def.FIGHTER :                              
                return new Map([[Def.HUMAN, 12], [Def.HALFLING, 1], [Def.DWARF, 1], [Def.GNOME, 1], [Def.ELF, 1], [Def.HALFORC, 1], [Def.HALFELF, 1]]);

            default:
                return new Map();
        }
    }

    static bonusXPRequirements = new Map([  [Def.FIGHTER    , [[Def.STR, 16]]],
                                            [Def.THIEF      , [[Def.DEX, 16]]],
                                            [Def.CLERIC     , [[Def.WIS, 16]]],
                                            [Def.MAGICUSER  , [[Def.INT, 16]]],
                                            [Def.DRUID      , [[Def.CHA, 16],[Def.WIS, 16]]],
                                            [Def.PALADIN    , [[Def.CHA, 17],[Def.WIS, 15],[Def.STR, 15]]]]);

    static clazzRequirements = new Map([[Def.FIGHTER    , new Map([[Def.STR, 9],[Def.CON, 7]])],
                                        [Def.THIEF      , new Map([[Def.DEX, 9]])],
                                        [Def.CLERIC     , new Map([[Def.WIS, 9]])],
                                        [Def.MAGICUSER  , new Map([[Def.INT, 9],[Def.DEX, 6]])],
                                        [Def.ASSASSIN   , new Map([[Def.STR, 12],[Def.DEX, 12], [Def.INT, 11]])],
                                        [Def.DRUID      , new Map([[Def.CHA, 15],[Def.WIS, 12]])],
                                        [Def.PALADIN    , new Map([[Def.CHA, 17],[Def.WIS, 13],[Def.STR, 12],[Def.INT, 9],[Def.CON, 9]])],
                                        [Def.ILLUSIONIST, new Map([[Def.DEX, 16],[Def.INT, 15]])],
                                        [Def.RANGER     , new Map([[Def.WIS, 14],[Def.CON, 14],[Def.INT, 13],[Def.STR, 13]])],
                                        [Def.MONK       , new Map([[Def.STR, 15],[Def.WIS, 15],[Def.DEX, 15],[Def.CON, 11]])]]);

    // returns sorted list of requirements for all classes or multiclasses combined
    static multiclassRequirements(clazz)
    {
        let res = new Map(); //k=attr v=score
        let attrs = Def.ATTRIBUTES;

        clazz.split("|").forEach(c => {
            Def.clazzRequirements.get(c).forEach((v,k) => {
                res.set(k, Math.max(v,res.get(k)|0));
            })});

        return Array.from(res).sort((a,b) => b[1]-a[1]);
    }

    static mods(attr, value, percs, mage, verbose)
    {
        let short = !verbose;

        switch (attr)
        {
            case Def.STR : 
                if (value < 4  ) return short ? "Ht-3 Da-1 op.1 bb0%" : "to hit adj. -3   dmg adj. -1   open door 1   bend bars 0%";
                if (value < 6  ) return short ? "Ht-2 Da-1 op.1 bb0%" : "to hit adj. -2   dmg adj. -1   open door 1   bend bars 0%";
                if (value < 8  ) return short ? "Ht-1 Da 0 op.1 bb0%" : "to hit adj. -1   dmg adj. +0   open door 1   bend bars 0%";
                if (value < 10 ) return short ? "Ht0 Da0 op<2 bb1%"   : "to hit adj. +0   dmg adj. +0   open door 1-2   bend bars 1%";
                if (value < 12 ) return short ? "Ht0 Da0 op<2 bb2%"   : "to hit adj. +0   dmg adj. +0   open door 1-2   bend bars 2%";
                if (value < 14 ) return short ? "Ht0 Da0 op<2 bb4%"   : "to hit adj. +0   dmg adj. +0   open door 1-2   bend bars 4%";
                if (value < 16 ) return short ? "Ht0 Da0 op<2 bb7%"   : "to hit adj. +0   dmg adj. +0   open door 1-2   bend bars 7%";
                if (value < 17 ) return short ? "Ht0 Da1 op<3 bb10%"  : "to hit adj. +0   dmg adj. +1   open door 1-3   bend bars 10%";
                if (value < 18 ) return short ? "Ht1 Da1 op<3 bb13%"  : "to hit adj. +1   dmg adj. +1   open door 1-3   bend bars 13%";
                if (!percs &&value < 19)  
                                 return short ? "Ht1 Da2 op<3 bb16%"  : "to hit adj. +1   dmg adj. +2   open door 1-3   bend bars 16%";
                if (percs < 51 ) return short ? "Ht1 Da3 op<3 bb20%"  : "to hit adj. +1   dmg adj. +3   open door 1-3   bend bars 20%";
                if (percs < 76 ) return short ? "Ht2 Da3 op<4 bb25%"  : "to hit adj. +2   dmg adj. +3   open door 1-4   bend bars 25%";
                if (percs < 91 ) return short ? "Ht2 Da4 op<4 bb30%"  : "to hit adj. +2   dmg adj. +4   open door 1-4   bend bars 30%";
                if (percs < 100) return short ? "Ht2 Da5 op<4 bb35%"  : "to hit adj. +2   dmg adj. +5   open door 1-4   bend bars 35%";
                                 return short ? "Ht3 Da6 op<5 bb40%"  : "to hit adj. +3   dmg adj. +6   open door 1-5   bend bars 40%";

            case Def.DEX :
                if (value < 4) return  short ? "rct-3 def +4" : "reaction/missile adj. -3   defence adj. +4";
                if (value < 5) return  short ? "rct-2 def +3" : "reaction/missile adj. -2   defence adj. +3";
                if (value < 6) return  short ? "rct-1 def +2" : "reaction/missile adj. -1   defence adj. +2";
                if (value < 7) return  short ? "rct 0 def +1" : "reaction/missile adj. +0   defence adj. +1";                
                if (value < 15) return short ? "rct 0 def 0"  : "reaction/missile adj. +0   defence adj. +0";
                if (value < 16) return short ? "rct 0 def -1" : "reaction/missile adj. +0   defence adj. -1";
                if (value < 17) return short ? "rct 1 def -2" : "reaction/missile adj. +1   defence adj. -2";
                if (value < 18) return short ? "rct 2 def -3" : "reaction/missile adj. +2   defence adj. -3";
                                return short ? "rct 3 def -4" : "reaction/missile adj. +3   defence adj. -4";
            case Def.CON :
                if (value < 4) return  short ? "hp-2 sh35% res40%" : "hp adj. -2   system shock 35%   res.survival 40%";
                if (value < 5) return  short ? "hp-1 sh40% res45%" : "hp adj. -1   system shock 40%   res.survival 45%";;
                if (value < 6) return  short ? "hp-1 sh45% res50%" : "hp adj. -1   system shock 45%   res.survival 50%";;
                if (value < 7) return  short ? "hp-1 sh50% res55%" : "hp adj. -1   system shock 50%   res.survival 55%";;
                if (value < 8) return  short ? "hp 0 sh55% res60%" : "hp adj. +0   system shock 55%   res.survival 60%";;
                if (value < 9) return  short ? "hp 0 sh60% res65%" : "hp adj. +0   system shock 60%   res.survival 65%";;
                if (value < 10) return short ? "hp 0 sh65% res70%" : "hp adj. +0   system shock 65%   res.survival 70%";;
                if (value < 11) return short ? "hp 0 sh70% res75%" : "hp adj. +0   system shock 70%   res.survival 75%";;
                if (value < 12) return short ? "hp 0 sh75% res80%" : "hp adj. +0   system shock 75%   res.survival 80%";;
                if (value < 13) return short ? "hp 0 sh80% res85%" : "hp adj. +0   system shock 80%   res.survival 85%";;
                if (value < 14) return short ? "hp 0 sh85% res90%" : "hp adj. +0   system shock 85%   res.survival 90%";;
                if (value < 15) return short ? "hp 0 sh88% res92%" : "hp adj. +0   system shock 88%   res.survival 92%";;
                if (value < 16) return short ? "hp 1 sh91% res94%" : "hp adj. +1   system shock 91%   res.survival 94%";;
                if (value < 17) return short ? "hp 2 sh95% res96%" : "hp adj. +2   system shock 95%   res.survival 96%";;
                if (value < 18) return short ? `hp ${percs == undefined ? '2' : '3'} sh97% res98%`  : `hp adj. +${percs == undefined ? '2' : '3'}   system shock 97%   res.survival 98%`;
                                return short ? `hp ${percs == undefined ? '2' : '4'} sh99% res100%` : `hp adj. +${percs == undefined ? '2' : '3'}   system shock 99%   res.survival 100%`;
            case Def.INT : 
                if (value < 8)  return short ? "lng 0" : "add. languages 0";
                if (value < 9)  return short ? "lng 1" : "add. languages 1";
                if (value < 10) return short ? `lng 1 ${mage ? 'knw.35% #sp.6' : ''}` : `add. languages 1 ${mage ? 'know spell 35%   max# spells 6': ''}`;
                if (value < 11) return short ? `lng 2 ${mage ? 'knw.45% #sp.7' : ''}` : `add. languages 2 ${mage ? 'know spell 45%   max# spells 7': ''}`;
                if (value < 12) return short ? `lng 2 ${mage ? 'knw.45% #sp.7' : ''}` : `add. languages 2 ${mage ? 'know spell 45%   max# spells 7': ''}`;
                if (value < 13) return short ? `lng 3 ${mage ? 'knw.45% #sp.7' : ''}` : `add. languages 3 ${mage ? 'know spell 45%   max# spells 7': ''}`;
                if (value < 14) return short ? `lng 3 ${mage ? 'knw.55% #sp.9' : ''}` : `add. languages 3 ${mage ? 'know spell 55%   max# spells 9': ''}`;
                if (value < 15) return short ? `lng 4 ${mage ? 'knw.55% #sp.9' : ''}` : `add. languages 4 ${mage ? 'know spell 55%   max# spells 9': ''}`;
                if (value < 16) return short ? `lng 4 ${mage ? 'knw.65% #sp.11' : ''}`: `add. languages 4 ${mage ? 'know spell 65%   max# spells 11': ''}`;
                if (value < 17) return short ? `lng 5 ${mage ? 'knw.65% #sp.11' : ''}`: `add. languages 5 ${mage ? 'know spell 65%   max# spells 11': ''}`;
                if (value < 18) return short ? `lng 6 ${mage ? 'knw.75% #sp.14' : ''}`: `add. languages 6 ${mage ? 'know spell 75%   max# spells 14': ''}`;
                                return short ? `lng 7 ${mage ? 'knw.85% #sp.18' : ''}`: `add. languages 7 ${mage ? 'know spell 85%   max# spells 18': ''}`;

            case Def.WIS :
                if (value < 4) return  short ? "wil adj -3" : "mental save adj. -3";
                if (value < 5) return  short ? "wil adj -2" : "mental save adj. -2";
                if (value < 8) return  short ? "wil adj -1" : "mental save adj. -1";
                if (value < 15) return short ? "wil adj +0" : "mental save adj. +0";
                if (value < 16) return short ? "wil adj +1" : "mental save adj. +1";
                if (value < 17) return short ? "wil adj +2" : "mental save adj. +2";
                if (value < 18) return short ? "wil adj +3" : "mental save adj. +3";
                                return short ? "wil adj +4" : "mental save adj. +4";

            case Def.CHA :
                if (value < 4)  return  short ? "hn#1 loy-30% rct-25%" : "max# henchmen 1   loyalty -30%   reaction adj. -25%";
                if (value < 5)  return  short ? "hn#1 loy-25% rct-20%" : "max# henchmen 1   loyalty -25%   reaction adj. -20%";
                if (value < 6)  return  short ? "hn#2 loy-20% rct-15%" : "max# henchmen 2   loyalty -20%   reaction adj. -15%";
                if (value < 7)  return  short ? "hn#2 loy-15% rct-10%" : "max# henchmen 2   loyalty -15%   reaction adj. -10%";
                if (value < 8)  return  short ? "hn#3 loy-10% rct-5%"  : "max# henchmen 3   loyalty -10%   reaction adj. -5%";
                if (value < 9)  return  short ? "hn#3 loy-5% rct0%"    : "max# henchmen 3   loyalty -5%   reaction adj. +0%";
                if (value < 10) return  short ? "hn#4 loy0% rct0%"     : "max# henchmen 4   loyalty +0%   reaction adj. +0%";
                if (value < 11) return  short ? "hn#4 loy0% rct0%"     : "max# henchmen 4   loyalty +0%   reaction adj. +0%";
                if (value < 12) return  short ? "hn#4 loy0% rct0%"     : "max# henchmen 4   loyalty +0%   reaction adj. +0%";
                if (value < 13) return  short ? "hn#5 loy0% rct0%"     : "max# henchmen 5   loyalty +0%   reaction adj. +0%";
                if (value < 14) return  short ? "hn#5 loy0% rct5%"     : "max# henchmen 5   loyalty +0%   reaction adj. +5%";
                if (value < 15) return  short ? "hn#6 loy5% rct10%"    : "max# henchmen 6   loyalty +5%   reaction adj. +10%";
                if (value < 16) return  short ? "hn#7 loy15% rct15%"   : "max# henchmen 7   loyalty +15%   reaction adj. +15%";
                if (value < 17) return  short ? "hn#8 loy20% rct20%"   : "max# henchmen 8   loyalty +20%   reaction adj. +20%";
                if (value < 18) return  short ? "hn#10 loy30% rct25%"  : "max# henchmen 10  loyalty +30%   reaction adj. +25%";
                                return  short ? "hn#15 lo.40% rct30%"  : "max# henchmen 15   loyalty +40%   reaction adj. +30%";
            break;                
        }
    }

    static CLASSWEAPONS_MAIN = new Map([[Def.FIGHTER,   [["longsword",10,"d8/d12"],  ["battleaxe",3, "d8/d8"],    ["halberd",2, "d10/2d6"], ["morningstar",3, "2d4/d6+1"], ["spear",2, "d6/d8"], ["broadsword",4, "2d4/d6+1"], ["bastardsword",4, "2d4/2d8"], ["2h-sword",4, "d10/3d6"]]],
                                        [Def.THIEF,     [["shortsword",10, "d6/d8" ],["broadsword",3, "2d4/d6+1"],["longsword",2,"d8/d12"]]],
                                        [Def.CLERIC,    [["mace",10, "d6+1/d6"],     ["flail",3, "d6+1/2d4"],     ["staff",2, "d6/d6"]]],
                                        [Def.MAGICUSER, [["dagger",10, "d4/d3"],     ["staff",3, "d6/d6"]]],
                                        [Def.DRUID,     [["scimitar",10, "d8/d8"],   ["spear",3, "d6/d8"],        ["staff",2, "d6/d6"]]],
                                        [Def.ASSASSIN,  [["longsword",10,"d8/d12"],  ["shortsword",3, "d6/d8"],   ["broadsword",2, "2d4/d6+1"]]],
                                        [Def.MONK,      [["handaxe",1, "d6/d4"],     ["spear",1, "d6/d8"],        ["staff",1, "d6/d6"],	["falchion", 1, "d8/d8"]]]]);

    static CLASSWEAPONS_SCND = new Map([[Def.FIGHTER,  [["handaxe",1, "d6/d4"],     ["bardiche",1, "2d4/3d4"], ["dagger",1, "d4/d3"], ["flail",1, "d6+1/2d4"], ["lance", 1, "2d4+1/3d6"], ["pick", 1, "d6+1/2d4"], ["scimitar", 1, "d8/d8"], ["trident", 1, "d6+1/3d4"]]],
                                       [Def.THIEF,     [["dagger",5, "d4/d3"],      ["club",1, "d6/d3"]      ]],
                                       [Def.CLERIC,    [["club",1, "d6/d3"],        ["hammer",3, "d4+1/d4"]  ]],
                                       [Def.MAGICUSER, [["dagger",10, "d4/d3"],     ["staff",3, "d6/d6"]     ]],
                                       [Def.DRUID,     [["club",1, "d6/d3"],        ["dagger",1, "d4/d3"]    ]],
                                       [Def.ASSASSIN,  [["garrot",1, "d4/d6"],      ["dagger",1, "d4/d3"],     ["club",2, "d6/d3"]]],
                                       [Def.MONK,      [["handaxe",1, "d6/d4"],     ["spear",1, "d6/d8"],      ["staff",1, "d6/d6"],   ["falchion", 1, "d8/d8"]]]]);

    static CLASSWEAPONS_DIST = new Map([[Def.FIGHTER,  [["longbow",2, "d6/d6",2], ["bow",1, "d6/d6",2],            ["javelin",1, "d6/d6",1],["crossbow",1, "d4+1/d4+2",0.5], ["comp.bow",2, "d6/d6",2]]],
                                        [Def.THIEF,    [["dagger(thr)",2, "d4/d3",2],  ["club(thr)",1, "d6/d3",1],           ["dart",1, "d3/d2",3],   ["sling",2, "d4+1/d6+1",1],      ["hand crossbow", 1, "d3/d2",1],   ["bow", 3, "d6/d6",2]  ]],
                                        [Def.CLERIC,   [["club(thr)",1, "d6/d3",1],    ["hammer(thr)",2, "d4+1/d4",1],       ["staff sling",1, "d4+1/d6+1",1]]],
                                        [Def.MAGICUSER,[["dart",1, "d3/d2",3],    ["sling",2, "d4+1/d6+1",1], ["dagger(thr)",1, "d4/d3",2]]],
                                        [Def.DRUID,    [["club(thr)",1, "d6/d3",1],    ["dagger(thr)",1, "d4/d3",2]]],
                                        [Def.ASSASSIN, [["dagger(thr)",2, "d4/d3",2],  ["blowgun",1, "1/1",2],          ["lasso",1,"-/-",1],     ["bolas",1, "-/-",1], ["crossbow",2, "d4+1/d4+2"]]],
                                        [Def.MONK,     [["handaxe(thr)",1, "d6/d4",1], ["crossbow",1, "d4+1/d4+2",0.5], ["dagger(thr)",1, "d4/d3",2], ["javelin", 1, "d6/d6",1], ["lasso",1,"-/-",1] ]]]);

    static TWO_HANDS = ["halberd", "2h-sword", "staff", "bardiche", "garrot", "longbow", "bow", "crossbow", "comp.bow", "staff sling", "blowgun", "lasso"];

    static CLASSARMOR        = new Map([[Def.FIGHTER,  [["plate mail",14,7], ["splint mail",2,6], ["banded mail",4,6],  ["scale mail",1,4]]],
                                        [Def.THIEF,    [["studded leather",2,3], ["leather",1,2], ["padded",1,2]]]]);

    static ARMOR_MOD = new Map([["plate mail",7],["splint mail",6],["banded mail",6],["scale mail",4],["studded leather",3],["leather",2],["padded",2]]);


    static ITEMS_WPNS = new Map([[Def.CLERIC,     [["mace",12]]],
                                [Def.DRUID,      [["dagger",10], ["scimitar",7], ["spear",10]]],
                                [Def.FIGHTER,    [["longsword", 10], ["broadsword",10], ["shortsword",10], ["battleaxe",7], ["spear",8], ["bow",1]]],
                                [Def.PALADIN,    [["longsword", 10], ["broadsword",10], ["shortsword",10], ["battleaxe",10], ["spear",8]]],
                                [Def.RANGER,     [["longsword", 10], ["broadsword",9], ["shortsword",9], ["battleaxe",7], ["spear",10], ["bow",10], ["longbow",10]]],
                                [Def.MAGICUSER,  [["dagger", 15], ["staff", 10]]],
                                [Def.ILLUSIONIST,[["dagger", 15]]],                                
                                [Def.THIEF,      [["dagger", 12], ["longsword", 11], ["shortsword", 10]]],
                                [Def.ASSASSIN,   [["dagger", 10], ["longsword", 5], ["shortsword",5], ["battleaxe",5], ["spear",5]]],
                                [Def.MONK,       [["dagger", 5], ["spear", 2]]]]);

    static ITEMS_ARMR = new Map([[Def.CLERIC,     [["shield",10],["plate",5],["banded mail",6],["chain mail",8],["ring o.protection.",2]]],
                                [Def.DRUID,      [["leather",8],["ring o.prot.",5]]],
                                [Def.FIGHTER,    [["shield",10],["plate",6],["banded mail",8],["chain mail",10],["ring o.protection.",2]]],
                                [Def.PALADIN,    [["shield",10],["plate",6],["banded mail",8],["chain mail",10],["ring o.protection.",2]]],
                                [Def.RANGER,     [["shield",8], ["plate",5],["banded mail",7],["chain mail",15],["ring o.protection.",2]]],
                                [Def.MAGICUSER,  [["ring o.protection.", 15], ["bracers ", 5]]],
                                [Def.ILLUSIONIST,[["ring o.protection.", 15], ["bracers ", 5]]],
                                [Def.THIEF,      [["leather", 10], ["ring o.protection.", 4]]],
                                [Def.ASSASSIN,   [["shield",8],["leather", 10], ["ring o.protection.", 4]]]]);

    static ITEMS_MAGIC = new Array(["ring:featherfall"],["ring:warmth"],["ring:waterwalk"],["wand:negation"],["wand:wonder"],
                                 ["bag o.holding"],["folding boat"],["brooch:shielding"],["cloak:elvenk."],["boots:elvenk."],
                                 ["2xjavelin:lightn."],["2xjavelin:pirce"],["necklace:adapt."],["robe:useful items"],["rope:climbing"]
                                 ["trident o.warning"],["wings o.flying"],["boots o.levitat."]);

    static ITEMS_POTIONS = new Array(["potion:climbing"],["potion:diminution"],["potion:extra healing"],["potion:fire resistance"],["potion:flying"],
                                   ["potion:gaseous form"],["potion:growth"],["potion:healing"],["potion:invisibility"],["potion:polymorph self"]);

    static ITEMS_PROTSC = new Array(["protection-demons"],["protection-devil"],["protection-element."],["protection-magic"],["protection-petrify"],
                                   ["protection-possess."],["protection-undead"]);

    static OPEN_HAND_DMG = new Array(["d3", undefined], ["d4",undefined], ["d6",undefined],
                                     ["d6",   "5/4"], ["d6+1", "5/4"], ["2d4","3/2"],
                                     ["2d4+1","3/2"], ["2d6",  "3/2"], ["3d4","2"  ],
                                     ["2d6+1","2"  ], ["3d4+1","5/2"], ["4d4","5/2"]);
    
    static MONK_AC = [0,1,2,3,3,4,5,6,7,7,8,9,10];

    static THACO_BASE = new Map([[Def.FIGHTER,  [20,19,18,17,16,15,14,13,12,11,10, 9]],
                                 [Def.CLERIC,   [20,20,20,18,18,18,16,16,16,14,14,14]],
                                 [Def.THIEF,    [20,20,20,20,19,19,19,19,16,16,16,16]],
                                 [Def.MAGICUSER,[20,20,20,20,20,19,19,19,19,19,16,16]]]);

    static baseThaco(char)
    {
        let res = 20;

        if (char.clazz.includes(Def.FIGHTER))            
            res = Math.min(res, Def.THACO_BASE.get(Def.FIGHTER)[char.classLevel(Def.FIGHTER)-1]);
        if (char.clazz.includes(Def.PALADIN))
            res = Math.min(res, Def.THACO_BASE.get(Def.FIGHTER)[char.classLevel(Def.PALADIN)-1]);
        if (char.clazz.includes(Def.RANGER))
            res = Math.min(res, Def.THACO_BASE.get(Def.FIGHTER)[char.classLevel(Def.RANGER)-1]);

        if (char.clazz.includes(Def.CLERIC))
            res = Math.min(res, Def.THACO_BASE.get(Def.CLERIC)[char.classLevel(Def.CLERIC)-1]);
        if (char.clazz.includes(Def.DRUID))
            res = Math.min(res, Def.THACO_BASE.get(Def.CLERIC)[char.classLevel(Def.DRUID)-1]);
        if (char.clazz.includes(Def.MONK))
            res = Math.min(res, Def.THACO_BASE.get(Def.CLERIC)[char.classLevel(Def.MONK)-1]);

        if (char.clazz.includes(Def.THIEF))
            res = Math.min(res, Def.THACO_BASE.get(Def.THIEF)[char.classLevel(Def.THIEF)-1]);
        if (char.clazz.includes(Def.ASSASSIN))
            res = Math.min(res, Def.THACO_BASE.get(Def.THIEF)[char.classLevel(Def.ASSASSIN)-1]);

        if (char.clazz.includes(Def.MAGICUSER))
            res = Math.min(res, Def.THACO_BASE.get(Def.MAGICUSER)[char.classLevel(Def.MAGICUSER)-1]);
        if (char.clazz.includes(Def.ILLUSIONIST))
            res = Math.min(res, Def.THACO_BASE.get(Def.MAGICUSER)[char.classLevel(Def.ILLUSIONIST)-1]);

        return res;
    }

    static armorTables(char)
    {
        if (char.clazz.includes(Def.FIGHTER))       return Def.ITEMS_ARMR.get(Def.Fighter);
        if (char.clazz.includes(Def.CLERIC))        return Def.ITEMS_ARMR.get(Def.CLERIC);
        if (char.clazz.includes(Def.PALADIN))       return Def.ITEMS_ARMR.get(Def.PALADIN);
        if (char.clazz.includes(Def.RANGER))        return Def.ITEMS_ARMR.get(Def.RANGER);
        if (char.clazz.includes(Def.DRUID))         return Def.ITEMS_ARMR.get(Def.DRUID);
        if (char.clazz.includes(Def.ASSASSIN))      return Def.ITEMS_ARMR.get(Def.ASSASSIN);
        if (char.clazz.includes(Def.THIEF))         return Def.ITEMS_ARMR.get(Def.THIEF); 
        if (char.clazz.includes(Def.ILLUSIONIST))   return Def.ITEMS_ARMR.get(Def.ILLUSIONIST);
        if (char.clazz.includes(Def.MAGICUSER))     return Def.ITEMS_ARMR.get(Def.MAGICUSER);

        //if (char.clazz.includes(Def.MONK)) 
        return undefined;        
    }

    static addEquipment(char)
    {
        let res = [];
        let clazz = char.clazz;
        
        if (clazz.includes(Def.FIGHTER))
            res.push((new Table(new Map([["",1], ["crowbar",1],["shovel",1],["flagon of rum",1],["signal horn",1],["horse",1],["tooth gap",1],["ugly scar",1],["tattoo",1],["medal",1],["manacles",1]]))).roll());    
        if (clazz.includes(Def.RANGER))
            res.push((new Table(new Map([["",1],["pocket warmer",1],["hunting horn",2],["oilskin",2],["lice",1],["bear trap",1],["spyglass",1],["hunting dog",1],["horse",1], ["fishing pole",1]]))).roll());
        if (clazz.includes(Def.PALADIN)) {
            res.push("holy symbol");
            if (char.classLevel(Def.PALADIN) > 3) res.push("heavy warhorse");
            res.push((new Table(new Map([["",1],["shaving brush&blade",1],["whetstone",1],["romantic novel",1],["medaillon with portrait",1],["holy water",1],["picture of saint",1],["medal",1]]))).roll());
        }
        if (clazz.includes(Def.CLERIC)) {
            res.push("holy symbol");
            res.push((new Table(new Map([["",2],["tonsure",1],["icon of saint",1],["letter of indulgence",1],["holy water",2],["holy scriptures",1],["ritual robes",1]]))).roll());
        }
        if (clazz.includes(Def.DRUID)) {
            res.push("mistletoe");            
            res.push((new Table(new Map([["",1],["catnip",1], ["dog treats",1],["bag of nuts",1],["waterflask",2],["owl companion",1],
                                         ["bottle of wine",1],["trained rat",1],["bottle of cider",1],["pet boar",1],["wolf companion",1]]))).roll());
        }
        if (clazz.includes(Def.THIEF)) {
            res.push("thieves tools");            
            res.push((new Table(new Map([["",1], ["loaded dice",1], ["stink bomb",1], ["bag of marbles",1], ["gambling dice",1],["pole (10 foot)",2],["deck of cards",1],["iron mirror", 1], ["burning oil",2], ["tripwire",1],["caltrops",1],["ear trumpet",1],["felt slippers",1],["counterfeit coins",1],["lice",1],["counterfeit pedigree",1]]))).roll());
        }
        if (clazz.includes(Def.ASSASSIN)) {
            res.push("thieves tools");
            let lvl = char.classLevel(Def.ASSASSIN);
            if (lvl > 6) 
                res.push(Table.rollDie(2) > 1 ? "ingestive poison B" : "blade poison B");
            if (lvl > 4)
                res.push(Table.rollDie(2) > 1 ? "ingestive poison C" : "blade poison C");
            if (lvl > 2)
                res.push(Table.rollDie(2) > 1 ? "ingestive poison D" : "blade poison D");
            res.push((new Table(new Map([["burning oil",1], ["tripwire (roll)",1],["ear trumpet",1],["caltrops",1], ["fake signet ring",1],["felt slippers",1],["poisoned dog treats",1],["wig&false beard",1], ["hair tinting lotion",1]]))).roll());
        }
        if (clazz.includes(Def.MAGICUSER)) {
            res.push("component pouch");            
            res.push((new Table(new Map([["",1],["notebook",1],["vial of acid",1], ["chalk",1],["writing utensils",1],["crystal ball (mundane)",1], ["caltrops", 1], ["Garweez' Bestiarium",1], ["treatise on necromancy",1]]))).roll());
        }
        if (clazz.includes(Def.ILLUSIONIST)) {
            res.push("component pouch");            
            res.push((new Table(new Map([["",1],["meerschaum pipe&weed", 1],["pocket bottle",1],["writing utensils",1],["lodestone",1],["glass prism",1],["fireworks",1]]))).roll());
        }
        if (clazz.includes(Def.MONK)) {
            res.push((new Table(new Map([["",1],["hand fan",1], ["gong",1],["sound bowl",1],["flute",1],["yoga mat",1],["sitting pillow",1]]))).roll());
        }

        res.push((new Table(new Map([["lantern",3], ["torches",2], ["bullseye lantern",1], ["oil lamp",1], ["candles",1]]))).roll());
        res.push((new Table(new Map([["rope",3], ["rope&grappling hook",2], ["hammer&pitons",2], ["rope ladder",1]]))).roll());
        res.push((new Table(new Map([["waterskin",4],["waterflask",3],["bottle of wine",2],["bottle of schnapps",1]]))).roll());        

        return res;
    }

    static echantmentBonus = function(wpn)
    {
        let res = /\+(\d)$/.exec(wpn);

        return res ? res[1]||0 : 0;
    }

    static missileBonus = function(dex)
    {
        if (dex > 15) return dex - 15;
        if (dex < 6) return 6 - dex;
        return 0;
    }

    static strengthBonus = function(str, percs)
    {
        if (str < 8) return Math.ceil((str - 8)/2);
        if (str > 16)
        {
            if (!percs || percs < 50) return 1;
            if (percs < 100) return 2;
            return 3;
        }
        return 0;
    }

    static strengthDamageBonus = function(str, percs)
    {
        if (str < 6) return -1;
        if (str > 15)
        {
            if (str < 18) return 1;
            if (!percs || percs < 1) return 2;
            if (percs < 76) return 3;
            if (percs < 91) return 4;
            if (percs < 100) return 5;
            return 6;
        }
        return 0;
    }

    static rofOf = function(num)
    {
        if (num == 0.5) return "1/2";
        if (num == 1)   return "1";
        if (num == 1.5) return "3/2";
        if (num == 2)   return "2";
        if (num == 2.5) return "5/2";
        return "";
    }

    static findWeapon = function(clazz, name)
    {
        let res = undefined;        

        res = Array.from(Def.CLASSWEAPONS_MAIN.get(clazz).values()).find((wpn,idx) => {return wpn[0] == name;}) ||
                Array.from(Def.CLASSWEAPONS_SCND.get(clazz).values()).find((wpn,idx) => {return wpn[0] == name;}) ||
                    Array.from(Def.CLASSWEAPONS_DIST.get(clazz).values()).find((wpn,idx) => {return wpn[0] == name;});

        return res;
    }

    static SAVES = new Map([[Def.FIGHTER,  [[14,15,16,17,17],[13,14,15,16,16],[11,12,13,13,14],[10,11,12,12,13],[8,9,10,9,11],[7,8,9,8,10]]],
                            [Def.CLERIC,   [[10,13,14,16,15],[ 9,12,13,15,14],[ 7,10,11,13,12],[ 6, 9,10,12,11]]],
                            [Def.MAGICUSER,[[14,13,11,15,12],[13,11, 9,13,10],[11, 9, 7,11, 8]]],
                            [Def.THIEF,    [[13,12,14,16,15],[12,11,12,15,13],[11,10,10,14,11]]]]);
}   
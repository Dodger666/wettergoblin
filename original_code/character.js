console.log("... charakter.js");

const { EmbedBuilder } = require('discord.js');
const { Table } = require('./table.js');
const { Def } = require('./defines.js');
const { Spells } = require('./spells.js');

const seedrandom = require('seedrandom');


exports.Character = class Char
{                                       
    static keywords = ["seed", "xp", "lvl", "name"];    

    // 4d6 drop lowest
    static rollAttribute = function() {
        let res = 0; let low = 7;
        for (var x=0; x<4; x++) {
            let rolled = Math.floor(6 * this.random())+1;
            low = Math.min(low, rolled);
            res += rolled;
        }
        return res - low;
    }

    static rollName = function() {
        return "";
    }

    // returns 0= no bonus xp, 3=xp bonus when demihuman, 4=xp bonus as human
    static bonusXpAptitude = function(clazz, race, sAttrs) {

        let bon = Def.bonusXPRequirements.get(clazz);

        if (!bon) return 0;

        let mods = Def.raceMods(race);

        let match = true;

        for (let r = 0; r < bon.length; r++)
        {
            //only works if xp bonus attributes are also the highest requirements 
            match &= (bon[r][1] <= (sAttrs[r] + (mods.get(bon[r][0]) | 0)));
        }       
        
        if (!match) return 0;

        return (race == Def.HUMAN) ? 14 : 3; 
    }

    
    // returns 0=unreachable, 1=demihuman only, 4=human, 5=xp bonus when demihuman, 6=xp bonus as human
    static classRaceAptitude = function(clazz, race, sAttrs, char) {
        
        let mods = Def.raceMods(race);
        
        let cmb = Def.multiclassRequirements(clazz);
        
        let of = 0;

        for (let r = 0; r < cmb.length; r++)
        {
            let ex = char ? char[cmb[r][0]] : undefined; // attribute already set via params?

            if (ex)
            {
                if (ex < cmb[r][1]) return 0;

                of++; // params attribute is sufficient
            }                
            else if (cmb[r][1] > (sAttrs[r - of] + (mods.get(cmb[r][0]) | 0))) 
                return 0;
        }

        return (race == Def.HUMAN) ? 10 : 1;
    }

    // returns aptitude for each race
    // returns object with {score : int, races : [allowed_races]}
    static classAptitude = function(clazz, sAttrs, char) {
        
        let res = new Map();

        Def.racesForClass(clazz).forEach((v,r) => {
        
            if (!char.race || char.race == r)
            {
                let apt = Char.classRaceAptitude(clazz, r, sAttrs, char);
            
                apt = Math.max(apt, Char.bonusXpAptitude(clazz, r, sAttrs));
            
                res.set(r, apt);
            }
        });

        return res;
    }

    static random = seedrandom();

    constructor(attrs, cl)
    {
        this.params = Char.parseParams(cl);

        let sd = this.params.get("seed");
        
        this.random = sd ? seedrandom("seed" + sd.toString()) : seedrandom();

        this.name = this.params.get("name") || Char.rollName();
        
        if (attrs) attrs.sort((a,b) => a-b);

        this.items = [];
        
        this.error = this.make(this.params, attrs);        
    }
    
    // returns the attribute value to set, only removes the 
    // value from array if taken from there, adds the cur
    static switchOrTake = function(cur, min, rmod, avail)
    {
        if (cur && cur >= min) return cur; // no change
        if (cur && cur < min) avail.unshift(cur); //cur is not suitable

        let idx = avail.findIndex(x => x+rmod >= min);

        return avail.splice(idx, 1)[0];
    }

    // param is array[6] of sorted (desc) attributes (int), second param is clazz
    // result is array of remaining attributes, also the required
    // attributes for the first class should be set
    distributeRequired = function(srt, clazz) 
    {
        // sort ascending!
        srt.sort((a,b) => a-b);

        let req = Def.multiclassRequirements(clazz);
        let rmods = Def.raceMods(this.race);

        req.forEach((pair) => {
            this[pair[0]] = Char.switchOrTake(this[pair[0]], pair[1], rmods.get(pair[0]), srt);
        });

        return srt;
    }

    static tweakRace(params)
    {       
        let clazz = params.get("class");

        if (clazz)
        {
            let rc = params.get("race");
            
            if (Def.racesForClass(clazz).has(rc)) return rc;
        }        
        return undefined;
    }

    static tweakAttributes(srt, char)
    {
        let req = Def.multiclassRequirements(char.clazz);

        let mods = Def.raceMods(char.race || "");

        //remove all params if too small
        req.forEach((pair) => {

            // if char.ATTR < reqirement
            if (char[pair[0]] && char[pair[0]] < pair[1])
            {
                // if char.ATTR < reqirement
                srt.push(char[pair[0]] - (mods.get(pair[0]) || 0));
                char[pair[0]] = undefined;
            }
        });

        //tweak srt pool
        srt.sort((a,b) => b-a);

        let idx = 0;

        req.forEach((pair) => {
            // if attr. is not set and the roll smaller req
            if (!char[pair[0]] && srt[idx] < pair[1])            
                srt.splice(idx++,1,pair[1]);            
            else 
                idx++;
        });

        return srt;
    }

    // returns map <class, chance>
    static clazTable = function(apts)
    {
        let res = new Map();

        apts.forEach((v,k) => {
            
            let val = Math.max(...v.values());

            if (val > 0) res.set(k, val);
        });

        return res;
    }

    prepProto = function(params, proto)
    {
        if (!params) return proto;

        Def.ATTRIBUTES.forEach(k => {
            
            let val = params.get(k);

            if (val && proto && proto.length > 0)
                proto.splice(Table.rollDie(proto.length),1);

            if (val < 3) params.set(k, 3);
            if (val > 18) params.set(k, 18);
        });
        
        this.setParamAttributes(params)

        return proto;
    }

    make = function(params, proto) 
    {   
        proto = this.prepProto(params, proto);

        if (proto) proto.sort((a,b) => b-a);

        let srt = proto || this.getOrCreateSortedAttributes(params, proto);        

        // if params want forbidden combo (gnome paladin) ... the race param is ignored, class wins
        this.race = Char.tweakRace(params);        
        //this.race = params.get("race");
        //srt = [15,14,10, 9, 9, 6];

        let apts = new Map(); // key=class, val=aptitudes

        Def.ALLCLASSES.forEach(c => {
            apts.set(c, Char.classAptitude(c, srt, this));
        });

        // make class table
        let claz = Char.clazTable(apts);        

        // select class
        this.clazz = params.get("class") || (new Table(claz)).roll();

        // cheating with attributes, when params contradict class
        srt = Char.tweakAttributes(srt, this);

        // make alignment table
        let asrc = Char.alignmentOfClass(this.clazz);

        // select alignment
        this.alignment = (new Table(asrc)).roll();

        // select race
        this.race = this.race || (new Table(apts.get(this.clazz))).roll();

        // select required attributes
        srt = this.distributeRequired(srt, this.clazz);
        
        //remaining attributes
        srt = this.distributeDesired(srt, params);        

        this.distributeRemaining(srt);

        this.applyRacialMods(params);

        this.setStats(params.get("xp")||0);
        // this.equip();

        proto = undefined;
        
        return this;
    }

    setSkills = function()
	{
       let table  = [[30,25,20,15,10,10,85, 0],
                     [35,29,25,21,15,10,86, 0],
                     [40,33,30,27,20,15,87, 0],
                     [45,37,35,33,25,15,88,20],
                     [50,42,40,40,31,20,90,25],
                     [55,47,45,47,37,20,92,30],
                     [60,52,50,55,43,25,94,35],
                     [65,57,55,62,49,25,96,40],
                     [70,62,60,70,56,30,98,45],
                     [80,67,65,78,63,30,99,50]];

		if (this.clazz.includes(Def.THIEF))
				this.skills = table[Char.clazzLevel(Def.THIEF, this)-1];
		else if (this.clazz.includes(Def.ASSASSIN))
				this.skills = table[Math.max(0, Char.clazzLevel(Def.ASSASSIN, this) -3)];
		else if (this.clazz.includes(Def.MONK))
				this.skills = table[Char.clazzLevel(Def.MONK, this) -1];

        if (!this.skills) return;

        if (this.race == Def.DWARF) { 			this.skills[1] += 10;
                                            	this.skills[2] += 15;
                                            	this.skills[6] -= 10;
                                            	this.skills[7] -= 5;}
        else if (this.race == Def.ELF) {   	this.skills[0] += 5;
                                           	 	this.skills[1] -= 5;
                                            	this.skills[3] += 5;
                                            	this.skills[4] += 10;
                                            	this.skills[5] += 5;}
        else if (this.race == Def.GNOME) { 	this.skills[1] += 5;
                                            	this.skills[2] += 10;
                                            	this.skills[3] += 5;
                                            	this.skills[4] += 5;
                                            	this.skills[5] += 10;
                                            	this.skills[6] -= 15;}        
        else if (this.race == Def.HALFELF) {	this.skills[0] += 10;
                                            	this.skills[4] += 5;}
        else if (this.race == Def.HALFLING) {	this.skills[0] += 5;
												this.skills[1] += 5;
												this.skills[2] += 5;
												this.skills[3] += 10;
												this.skills[4] += 15;
												this.skills[5] += 5;
												this.skills[6] -= 15;
												this.skills[7] -= 5;}
        else if (this.race == Def.HALFORC) {	this.skills[0] -= 5;
												this.skills[1] += 5;
												this.skills[2] += 5;
												this.skills[5] += 5;
												this.skills[6] += 5;
												this.skills[7] -= 10;}

		if (this.DEX == 9)	{	this.skills[0]-=15; this.skills[1]-=10; this.skills[2]-=10; this.skills[3]-=20; this.skills[4]-=10; }
		if (this.DEX ==10)	{	this.skills[0]-=10; this.skills[1]-= 5; this.skills[2]-=10; this.skills[3]-=15; this.skills[4]-= 5; }
		if (this.DEX ==11)	{	this.skills[0]-= 5; 					this.skills[2]-= 5; this.skills[3]-=10; 					}
		if (this.DEX ==12)	{																this.skills[3]-= 5;						}

		if (this.DEX ==16)	{						this.skills[1]+= 5;																}		
		if (this.DEX ==17)	{	this.skills[0]+= 5; this.skills[1]+=10;						this.skills[3]+= 5; this.skills[4]+= 5; }
		if (this.DEX ==18)	{	this.skills[0]+=10; this.skills[1]+=15;	this.skills[2]+= 5;	this.skills[3]+=10; this.skills[4]+=10; }
    }

    static levelLimit = function(clazz, char)
    {
        switch (char.race)
        {
            case Def.ELF      : 
                if (clazz == Def.FIGHTER) 
                    return 7 - Math.min(3, 18 - char.STR);
                else if (clazz == Def.MAGICUSER)
                    return 11 - Math.min(2, 18 - char.INT);
                else if (clazz == Def.CLERIC) 
                    return 7;
                else if (clazz == Def.ASSASSIN) 
                    return 10;
                break;

            case Def.HALFELF  : 
                if (clazz == Def.FIGHTER || clazz == Def.RANGER) 
                    return 8 - Math.min(2, 18 - char.STR);                    
                else if (clazz == Def.MAGICUSER)
                    return 8 - Math.min(2, 18 - char.INT);
                else if (clazz == Def.CLERIC)
                    return 5;
                else if (clazz == Def.ASSASSIN) 
                    return 11;
                break;
                
            case Def.DWARF    :
                if (clazz == Def.ASSASSIN) 
                    return 9;
                else if (clazz == Def.FIGHTER)
                    return 9 - Math.min(2, 18 - char.STR);
                else if (clazz == Def.CLERIC)
                    return 8;
                break;

            case Def.GNOME    : 
                if (clazz == Def.ASSASSIN) 
                    return 8;
                else if (clazz == Def.FIGHTER)
                    return 6 - (char.STR > 17 ? 0 : 1);
                else if (clazz == Def.ILLUSIONIST)
                {
                    if (char.INT + char.DEX == 36) 
                        return 7;
                    if (char.INT == 17 && char.DEX == 17) 
                        return 6;
                    return 5;
                }
                else if (clazz == Def.CLERIC)
                    return 7;
                break;
            
            case Def.HALFORC  : 
                if (clazz == Def.THIEF) 
                    return 8 - Math.min(2, 18 - char.DEX);
                else if (clazz == Def.CLERIC)
                    return 4;
                else if (clazz == Def.FIGHTER)
                    return 10;
                break;

            case Def.HALFLING : 
                if (clazz == Def.FIGHTER)
                    return 6 - Math.min(2, 18 - char.STR);
                if (clazz == Def.DRUID)
                    return 6;
                break;
        }
        return 10;
    }

    static clazzLevel = function(clazz, char)
    {
        let lvl = Char.classLevel(clazz, char.xps.get(clazz));

        let singleclass = char.clazz.includes('|') ? 0 : 2;

        return Math.min(lvl, Char.levelLimit(clazz, char) + singleclass);
    }

	static classLevel = function(clazz, xp)
	{
		if (!xp) return 1;

		let dat = [];

        switch (clazz)
        {
			case Def.CLERIC    	: dat = [1500, 3000, 6000,  13000, 27500, 55000, 110000, 225000, 450000, 675000]; break;
            case Def.DRUID     	: dat = [2000, 4000, 7500,  12500, 20000, 35000,  60000,  90000, 125000, 200000]; break;
			case Def.FIGHTER    : dat = [2000, 4000, 8000,  18000, 35000, 70000, 125000, 250000, 500000, 750000]; break;
			case Def.PALADIN   	: dat = [2750, 5500, 12000, 24000, 45000, 95000, 175000, 350000, 700000,1050000]; break;
			case Def.RANGER    	: dat = [2250, 4500, 10000, 20000, 40000, 90000, 150000, 225000, 325000, 650000]; break;
			case Def.MAGICUSER 	: dat = [2500, 5000, 10000, 22500, 40000, 60000,  90000, 135000, 250000, 375000]; break;
			case Def.ILLUSIONIST: dat = [2250, 4500, 9000,  18000, 35000, 60000,  95000, 145000, 220000, 440000]; break;
			case Def.THIEF     	: dat = [1250, 2500, 5000,  10000, 20000, 42500,  70000, 110000, 160000, 220000]; break;
            case Def.ASSASSIN  	: dat = [1500, 3000, 6000,  12000, 25000, 50000, 100000, 200000, 300000, 425000]; break;
            case Def.MONK      	: dat = [2250, 4750, 10000, 22500, 47500, 98000, 200000, 350000, 500000, 700000]; break;
            case Def.PALADIN   	: dat = [2750, 5500, 12000, 24000, 45000, 95000, 175000, 350000, 700000,1050000]; break;
        }

		let idx = dat.findIndex(v => xp < v);

		return 1 + (idx < 0 ? 9 : idx);
	}

	bonusForClass = function(clazz)
	{
		let res = true;

		let bon = Def.bonusXPRequirements.get(clazz);
		
		if (!bon) return false;

		bon.forEach(rq => res &= this[rq[0]] >= rq[1]);

		return res;
	}

    static initialWeapons = function(clazz) {    
        if (clazz.includes(Def.FIGHTER))
            return 4;
        if (clazz.includes(Def.ASSASSIN) || clazz.includes(Def.PALADIN) || clazz.includes(Def.RANGER))
            return 3;
        if (clazz.includes(Def.CLERIC) || clazz.includes(Def.DRUID) || clazz.includes(Def.THIEF))
            return 2;
        return 1;
    }

    static levelsPerWeapon = function(clazz) {    
        if (clazz.includes(Def.MONK))
            return 2;
        if (clazz.includes(Def.FIGHTER) || clazz.includes(Def.PALADIN) || clazz.includes(Def.RANGER))
            return 3;
        if (clazz.includes(Def.THIEF) || clazz.includes(Def.ASSASSIN) || clazz.includes(Def.CLERIC))
            return 4;
        if (clazz.includes(Def.DRUID))
            return 5;
        return 6;
    }

	weaponCount = function() {

        let res = 0; 
        
        this.xps.forEach((xp,clz) => {            
            res += Char.initialWeapons(clz) + Math.floor(Char.clazzLevel(clz, this) / Char.levelsPerWeapon(clz));
        });

        return res;
    }
	
    weaponTableClass = function(it)
    {
        let used = this.clazz;

        let multi = (it > 3) && (this.xps.size > 1);        
        let roll = multi ? Math.floor(this.xps.size * this.random()) : 0; // 0-1 or 0-2
        
        // if multiclass and iteration >3 and die roll (50% or 66%) use other class weapon table
        if (multi && roll > 0) used = this.clazz.split("|").splice(0,roll).join("|");
        
        if (it == 1 && (used.includes(Def.THIEF) || used.includes(Def.ASSASSIN))) return Def.THIEF;
        if (used.includes(Def.FIGHTER) || used.includes(Def.PALADIN) || used.includes(Def.RANGER))  return Def.FIGHTER;
        if (used.includes(Def.ASSASSIN))   return Def.ASSASSIN;     
        if (used.includes(Def.THIEF))      return Def.THIEF;
        if (used.includes(Def.CLERIC))     return Def.CLERIC;     
		if (used.includes(Def.MAGICUSER) || used.includes(Def.ILLUSIONIST))   return Def.MAGICUSER;
        if (used.includes(Def.MONK))       return Def.MONK;
        if (used.includes(Def.DRUID))      return Def.DRUID;

        return "err";
    }

    weaponTable = function(it)
    {
        let d = (it % 3) + 1;
        let c = this.xps.size;

        if (d <= 1) return Def.CLASSWEAPONS_MAIN;
        if (d == 2) return Def.CLASSWEAPONS_DIST;
        if (d == 3) return Def.CLASSWEAPONS_SCND;
        //if (d == 4) return Def.CLASSWEAPONS_MAIN;
			
		let arr = [Def.CLASSWEAPONS_SCND, Def.CLASSWEAPONS_DIST, Def.CLASSWEAPONS_MAIN];

		return new Map(arr[new Table(new Map([[0,1],[1,1],[2,1+c]])).roll()]);
    }

    setSpellbook = function()
    {
        this.setMageSpells();
        this.setIlluSpells();        
        this.setDruidSpells();
        this.setClericSpells();
    }
    
    classLevel(clz)
    {        
        let x = this.xps.get(clz);

        if (x == undefined) return 0;
        
        return Char.clazzLevel(clz, this);
    }

    makeSpellTable = function(spelltable, lvl, spells)
    {
        let res = new Map(); // name, chance
        
        let map_lvl = new Map(spelltable.get(lvl));

        spells.forEach((name) =>{
            let chance = map_lvl.get(name);
            res.set(name, chance*chance); // chances 1-4-9
        });

        return new Table(new Map(res));
    }

    memorizeSpells = function(spelltable, spellsperlevel, book)
    {
        let res = new Map(); // returns new book with memorized marks appended (magic missile ØØO)

        book.forEach((spls,lvl) => {            
        
            let table = this.makeSpellTable(spelltable, lvl, spls);            
            let mems = new Map() // name, memcount

            let x = spellsperlevel[lvl-1];

            while (x-- > 0)
            {
                let name = "";
                do 
                    name = table.roll();                                                     
                while ((mems.get(name)||0) > 2);

                mems.set(name, (mems.get(name)||"")+"Ø");
            }            

            res.set(lvl,spls.map(name => {return (name + " " + (mems.get(name)||"").padEnd(3, "O"));}));
        });
        return res;
    }

    getBookSpells = function(spelltable, spellsperlevel)
    {
        let res = new Map(); // k=level, v=array of spells             

        spellsperlevel.forEach((mem,lvl)=>{
                            
            let count  = (lvl == 0 ? 3 : 0);        // start w. 3 lvl1 spells
                count += (mem > 1 ? 2 : 1);         // add one free spell per level advance (so it's 4 on lvl1)
            if (lvl>0 || mem>1)                     // if not first level
                count += Table.rollDie(mem+1)-1;    //  - gain through adventuring

            let tbl = new Table(new Map(spelltable.get(lvl+1)));

            let names = [];

            while (count-- > 0)
            {
                let name = tbl.roll();
                if (names.includes(name))
                    this.items.push("scroll:" + name);
                else
                    names.push(name);
            }
            res.set(lvl+1, names);
        });

        return res;
    }

    getPreparedSpells = function(spelltable, spellsperlevel)
    {
        let res = new Map(); // k=level, v=array of spells             

        spellsperlevel.forEach((mem,lvl)=>{
                            
            let count = mem;

            let tbl = new Table(new Map(spelltable.get(lvl+1)));

            let names = new Map();
            let sub = [];

            while (count-- > 0)
            {
                let name = tbl.roll();                

                names.set(name, 1 + (names.get(name) || 0));
            }

            names.forEach( (v,k) => {
                sub.push((k+" ").padEnd(k.length + v + 1,"O"));
            });

            res.set(lvl+1, sub);
        });

        return res;
    }

    setMageSpells = function()
    {
        this.arcaneSpellsPerLevel = undefined;

        if (this.clazz.includes(Def.MAGICUSER)) 
            this.arcaneSpellsPerLevel = Spells.spellsPerMageLevel(this.classLevel(Def.MAGICUSER));
        else if (this.clazz.includes(Def.RANGER)) 
            this.arcaneSpellsPerLevel = Spells.spellsPerRangerMageLevel(this.classLevel(Def.RANGER));

        if (this.arcaneSpellsPerLevel)
        {
            let book = this.getBookSpells(Spells.SPELLS_MU, this.arcaneSpellsPerLevel);

            this.arcaneBook = this.memorizeSpells(Spells.SPELLS_MU, this.arcaneSpellsPerLevel, book);
        }        
    }

    setIlluSpells = function()
    {
        this.illusionsPerLevel = undefined;

        if (this.clazz.includes(Def.ILLUSIONIST)) 
            this.illusionsPerLevel = Spells.spellsPerIlluLevel(this.classLevel(Def.ILLUSIONIST));

        if (this.illusionsPerLevel)
        {
            let book = this.getBookSpells(Spells.SPELLS_IL, this.illusionsPerLevel);

            this.illusionsBook = this.memorizeSpells(Spells.SPELLS_IL, this.illusionsPerLevel, book);
        }
    }
    
    setDruidSpells = function() //ØØO
    {
        this.druidSpellsPerLevel = undefined;

        if (this.clazz.includes(Def.DRUID)) 
            this.druidSpellsPerLevel = Spells.spellsPerDruidLevel(this.classLevel(Def.DRUID));
        else if (this.clazz.includes(Def.RANGER)) 
            this.druidSpellsPerLevel = Spells.spellsPerRangerDruidLevel(this.classLevel(Def.DRUID));        

        if (this.druidSpellsPerLevel)
        {
            Spells.addBonusSpells(this.druidSpellsPerLevel, this.WIS);

            this.preparedDruidSpells = this.getPreparedSpells(Spells.SPELLS_DR, this.druidSpellsPerLevel);
        }
    }

    setClericSpells = function()
    {
        this.clericSpellsPerLevel = undefined;

        if (this.clazz.includes(Def.CLERIC)) 
            this.clericSpellsPerLevel = Spells.spellsPerClericLevel(this.classLevel(Def.CLERIC));
        else if (this.clazz.includes(Def.PALADIN)) 
            this.clericSpellsPerLevel = Spells.spellsPerPaladinLevel(this.classLevel(Def.PALADIN));        

        if (this.clericSpellsPerLevel)
        {
            Spells.addBonusSpells(this.clericSpellsPerLevel, this.WIS);

            this.preparedClericSpells = this.getPreparedSpells(Spells.SPELLS_CL, this.clericSpellsPerLevel);
        }
    }

    dexMod = function(dex)
    {
        if (dex < 7) return dex-7;
        if (dex > 14) return dex - 14;
        return 0;
    }

    setArmor = function()
    {
        let ac = undefined;

        if (this.clazz.includes(Def.FIGHTER) || this.clazz.includes(Def.PALADIN) || this.clazz.includes(Def.RANGER) || this.clazz.includes(Def.CLERIC))
            ac = Def.FIGHTER;
        if (this.clazz.includes(Def.DRUID) || this.clazz.includes(Def.THIEF) || this.clazz.includes(Def.ASSASSIN))
            ac = Def.THIEF;

        if (ac)
        {            
            let amap = new Map(Def.CLASSARMOR.get(ac));

            let hasShield = !this.clazz.includes(Def.THIEF);

            let wpn_shld = this.weapons.find(w => {return !Def.TWO_HANDS.includes(w[0]) && w.length < 4});

            hasShield &= wpn_shld != undefined;

            if (ac == Def.FIGHTER)
                if (this.xps)
                    if ([...this.xps.values()] && ([...this.xps.values()].at(0) < 1))
                        amap.set("plate mail", 1);

            this.armor = new Table(amap).roll();

            this.ac = 10 - Def.ARMOR_MOD.get(this.armor) - this.dexMod(this[Def.DEX]);

            this.ac_shield = hasShield ? this.ac - 1 : undefined;
        }
        else
        {
            let isMonk = this.clazz.includes(Def.MONK);
            let monkmod = isMonk ? Def.MONK_AC.at(Char.clazzLevel(Def.MONK, this)-1) : 0;
            this.armor = "none";
            this.ac = 10 - (isMonk ? monkmod : this.dexMod(this[Def.DEX]));
            this.ac_shield = undefined;
        }
    }

	setWeapons = function() 
	{
        let wpns = [];

        let c = Math.min(5, this.weaponCount());
        
        let tables = [];
        
        for (let x=1; x<=c; x++) tables.push(this.weaponTable(x));

        if (tables)
            tables.forEach((t,i) => {
                
                let cl = t.get(this.weaponTableClass(i));

                let idx = new Table(new Map(cl)).rollIdx();

                let bl = wpns.find(i => {return (i[0] == cl[idx][0])});

                if (!bl)
                {
                    wpns.push(structuredClone(cl[idx]));
                    if (cl[idx][0].includes("lance"))
                        this.items.push("light warhorse");
                }
            });

        this.weapons = [...new Set(wpns)];
    }

    potionChance()
    {
        if (this.clazz.includes(Def.DRUID))       return [11 * this.classLevel(Def.DRUID),2];      
        if (this.clazz.includes(Def.MAGICUSER))   return [10 * this.classLevel(Def.MAGICUSER),3];
        if (this.clazz.includes(Def.ILLUSIONIST)) return [10 * this.classLevel(Def.ILLUSIONIST),2];
        if (this.clazz.includes(Def.THIEF))       return [ 9 * this.classLevel(Def.THIEF),2];
        if (this.clazz.includes(Def.FIGHTER))     return [ 8 * this.classLevel(Def.FIGHTER),1];                
        if (this.clazz.includes(Def.RANGER))      return [ 7 * this.classLevel(Def.RANGER),1];        
        if (this.clazz.includes(Def.CLERIC))      return [ 6 * this.classLevel(Def.CLERIC),1];
        if (this.clazz.includes(Def.PALADIN))     return [ 6 * this.classLevel(Def.PALADIN),1];
        if (this.clazz.includes(Def.ASSASSIN))    return [ 5 * this.classLevel(Def.ASSASSIN),1];
        if (this.clazz.includes(Def.MONK))        return [ 0, 0];
    }

    scrollChance()
    {
        if (this.clazz.includes(Def.MAGICUSER))   return 15 * this.classLevel(Def.MAGICUSER);
        if (this.clazz.includes(Def.ILLUSIONIST)) return 12 * this.classLevel(Def.ILLUSIONIST);
        if (this.clazz.includes(Def.CLERIC))      return  8 * this.classLevel(Def.CLERIC);
        if (this.clazz.includes(Def.DRUID))       return  7 * this.classLevel(Def.DRUID);
        if (this.clazz.includes(Def.FIGHTER))     return  6 * this.classLevel(Def.FIGHTER);                
        if (this.clazz.includes(Def.THIEF))       return  6 * this.classLevel(Def.THIEF);
        if (this.clazz.includes(Def.RANGER))      return  5 * this.classLevel(Def.RANGER);
        if (this.clazz.includes(Def.PALADIN))     return  4 * this.classLevel(Def.PALADIN);
        if (this.clazz.includes(Def.ASSASSIN))    return  3 * this.classLevel(Def.ASSASSIN);
    }    

    setPotions = function()
    {
        if (this.xp < 1) return;

        let pc = this.potionChance() || 0;

        if (Table.rollDie(100) < pc[0])
        {
            let count = Table.rollDie(pc[1]);

            while (count-- > 0)
            {
                let table = ["climbing", "diminution", "extra healing", "fire resistance", "flying", "gaseous form", "growth", "healing", "invisibility", "polymorph self"];

                this.items.push(`potion:${table[Table.rollDie(table.length)-1]}`);
            }            
        }        
    }
    
    setEquipment = function()
    {
        let res = Def.addEquipment(this).filter(v => v != "");

        let iset = [...new Set(res)];

        let max_lvl = 0;
        let char = this;

        this.xps.forEach((xp,clz) => {max_lvl = Math.max(max_lvl, Char.clazzLevel(clz, char));});

        iset.push(`gold: ${max_lvl * max_lvl * Table.rollDie(20)}`);

        let itn = [];

        this.items.push(...iset);

        if ([Def.DWARF, Def.HALFLING, Def.GNOME].includes(char.race))
        {
            this.items = this.items.map(v => {return v.replace("horse", "pony");});
        }
    }

    setMisc = function()
    {
        let max_lvl = 0;
        let char = this;

        this.xps.forEach((xp, clz) => {max_lvl = Math.max(Char.clazzLevel(clz,char));});

        let sd = 1 + Math.max(0, Math.floor((max_lvl - 3)/2));
        let count = Table.rollDie(sd) - 1;

        while (count-- > 0)
        {
            let table = ["ring o.feath.fall", "ring o.warmth", "ring o.waterwalk", "wand o.negation", "wand o.wonder", "bag o.holding", 
                         "folding boat", "brooch o.shielding", "cloak o.elvenkind", "boots o.elvenkind", "2 javelin o.lightning", 
                         "2 javelin o.piercing", "necklace o.adaptation", "robe o.useful items", "rope o.climbing", "trident o.warning",
                         "wings o.flying", "boots o.levitation"];

            let item = table.at(Table.rollDie(table.length)-1);
            
            if (!this.items.includes(item)) this.items.push(item);
        }        
    }

    setScrolls = function()
    {
        if (Table.rollDie(100) < this.scrollChance())
        {
            let count = Table.rollDie(3);
            let table = undefined;

            while (count-- > 0)
            {
                if (this.clazz.includes(Def.ILLUSIONIST)) 
                    table = Spells.SPELLS_IL.get(Table.rollDie(4));

                else if (this.clazz.includes(Def.MAGICUSER)) 
                    table = Spells.SPELLS_MU.get(Table.rollDie(6));

                else if (this.clazz.includes(Def.CLERIC))  
                    table = Spells.SPELLS_CL.get(Table.rollDie(4));

                else {
                    table = Def.ITEMS_PROTSC.map(spl => [spl, 1]);
                    count = 0;
                }

                const tbl = table.map(spl => [spl[0],1]);                

                this.items.push(`scroll:${new Table(new Map(tbl)).roll()}`);
            }            
        }        
    }

    setMagicWeapon = function()
    {
        if (this.xp < 1) return;

        let tgt = undefined;  //array [name,prob,dmg,rof]
        let wname = undefined;//name only
        let replace = undefined;
        let roll = 0;
        let better = 0;
        let wdx = -1;

        this.clazz.split("|").forEach(c => {

            if (!tgt)
            {
                let arr = Def.ITEMS_WPNS.get(c);
                wdx = new Table(new Map(arr)).rollIdx();
                wname = arr[wdx][0];
                roll  = arr[wdx][1];                

                this.weapons.find((val,idx)=>{
                    if (val[0] == wname) {
                        replace = idx;
                        return true;
                    }
                });
                
                tgt = structuredClone(Def.findWeapon(this.weaponTableClass(0),wname));

                let lvl = this.classLevel(c);

                roll *= lvl;
                    
                better = lvl + Math.max(0, roll-90);                
            }
        });  

        if (!tgt)
        {
            console.log("dadaa");
        }
            
        
        let dr = Table.rollDie(100);    

        if (tgt && dr < roll)
        {            
            let res = dr < better ? ["+2", 2] : ["+1", 1];
            
            Char.enchant(tgt, res);
            
            if (replace)
                this.weapons.splice(replace,1,tgt);                
            else 
                this.weapons.push(tgt);
        }
        else
        {
            console.log("dadaa");
        }
    }

    setMagicArmor = function()
    {
        if (this.xp < 1) return;

        let tgt = undefined; // target item (which item rolls for magic bonus)
        let arr = undefined; // class table to use
        let rol = 0          // chance per level to have it (tenth of that makes +2)        
        let better = 0;

        this.clazz.split("|").forEach(c => {

            if (!tgt)
            {
                arr = Def.ITEMS_ARMR.get(c);

                if (arr)
                {
                    if (this.armor) 
                        tgt = arr.find(ar => {rol = ar[1]; return ar[0] == this.armor;});
                    if (!tgt && this.hasShield) 
                        tgt = arr.find(ar => {rol = ar[1]; return ar[0] == "shield";});

                    let rl = Table.rollDie(2);

                    if (!tgt) 
                        tgt = arr.find(ar => {rol = ar[1]; return ar[0].startsWith(rl > 1 ? "bracers" : "ring o.protection");});
                    if (!tgt) 
                        tgt = arr.find(ar => {rol = ar[1]; return ar[0].startsWith(rl > 1 ? "ring o.protection" : "bracers");});
                } // else Monk?

                let lvl = this.classLevel(c);
                rol *= lvl;
                better = lvl + Math.max(0, rol-90);
            }
        });  
        
        let dr = Table.rollDie(100);
        
        if (tgt && dr < rol)
        {
            let item = tgt[0];
            let bracers = item.startsWith("bracers") ? 1 : 0;
            let res = dr < better ? ["+2", "AC4", -2, -6] : ["+1", "AC6", -1, -4];

            item += res[0+bracers];
            
            if (item.startsWith("shield") || item.startsWith("ring")) 
              this.items.push(item);
            else
              this.armor = item;

            this.ac += res[2+bracers]
            this.ac_shield += res[2+bracers];
        }
    }

	// setItems = function() 
	// {
    //     setMagicArmor();
    //     setMagicWeapon();
    //     setScrolls();
    //     //check for scrolls
    //     //check for potions
    //     //check for miscellanea
    // }

	setLevels = function(xp) 
	{
        this.xp = xp;
		this.xps = new Map();
				
		let clz = this.clazz.split("|");

		let div = 0.0;
		
		let shares = [];

		clz.forEach(c => {
			let shr = this.bonusForClass(c) ? 1.1 : 1.0;
			div += shr;
			shares.push([c,shr]);
		});
		
		shares.forEach(sh => {this.xps.set(sh[0], Math.floor(sh[1] * xp/div));});
	}

    setStats = function(xp) {
            
		this.setLevels(xp);
        this.setHitpoints();
		this.setSkills();
        this.setWeapons();
        this.setArmor();
        this.setSpellbook();
        this.setMagicArmor();
        this.setMagicWeapon();
        this.setScrolls();
        this.setPotions();
        this.setMisc();
        this.setEquipment();
    }

    minHitpoints(clazz)
    {
        
    }

    rollHitpoints(clazz, level)
    {
        let res = [];

        let c = level;
        
        let spec = [Def.RANGER, Def.MONK].includes(clazz);
        let hd = Def.HITDICE.get(clazz);
        let min = spec ? hd+1 : (hd+2)/2;

        while (c-- > 0)
        {
            let roll = 0;
            
            roll += Math.floor(Def.HITDICE.get(clazz) * this.random() + 1);

			if (spec && c == 0)
				roll += Math.floor(Def.HITDICE.get(clazz) * this.random() + 1);
            
            res.push(c==0 ? Math.max(roll, min) : roll);
        }
        return res;
    }

    setHitpoints = function() {
    
        let con = Math.min(Math.max(0, this.CON - 14), this.isFighter() ? 5 : 2);
        let conHp = 0;
        let char = this;

        this.hps = new Map(); // key = subclass, val = array of rolled hp        
        
        this.xps.forEach((xp,clz) => {
            
            let lvl = Char.clazzLevel(clz, char);

            conHp += lvl * con;

            this.hps.set(clz, this.rollHitpoints(clz, lvl))
        });

        let thp = 0.0;

        this.hps.forEach((rld,clz) => {rld.forEach(dr => thp += dr)});        

        this.hp = Math.round((thp+conHp)/this.xps.size*10) / 10;
    }

    isFighter = function() {
        return (this.clazz.includes(Def.FIGHTER) || this.clazz.includes(Def.RANGER) || this.clazz.includes(Def.PALADIN));
    }

    isMulticlass = function() {
        return this.clazz.includes("|");
    }

    getHitpoints = function() {
        return this.isMulticlass() ? Math.round(this.hp).toString() : this.hp.toString();
    }

    getLevels = function() {
        
        if (!this.isMulticlass()) return this.classLevel(this.clazz);

        let res = [];
        let char = this;

        this.xps.forEach((xp,clz) => res.push(Char.clazzLevel(clz,char)));

        return "[" + res.join("|") + "]";
    }
    
    // returns obect with keys and values (chances for a table ...)
    static alignmentOfClass = function(clazzz) {
        
        var clazz = clazzz;

             if (clazz.includes(Def.RANGER))   clazz = Def.RANGER;
        else if (clazz.includes(Def.ASSASSIN)) clazz = Def.ASSASSIN;
        else if (clazz.includes(Def.THIEF))    clazz = Def.THIEF;

        switch (clazz)
        {            
            case Def.DRUID :                  
                return new Map([[Def.NN, 1]]);
            case Def.RANGER :
                return new Map([[Def.LG, 1], [Def.CG, 1], [Def.NG, 1]]);
            case Def.PALADIN : 
                return new Map([[Def.LG, 1]]);
            case Def.THIEF : 
                return new Map([[Def.LN, 4], [Def.LE, 3], 
                                [Def.CN, 4], [Def.CE, 3], 
                                [Def.NG, 2], [Def.NE, 3]]);
            case Def.ASSASSIN : 
                return new Map([[Def.LE, 1], [Def.CE, 1], [Def.NE, 1]]);
            case Def.MONK : 
                return new Map([[Def.LG, 1], [Def.LN, 1], [Def.LE, 1]]);
            default :
                // most are good, some are neutral, few are evil
                return new Map([[Def.LG, 3], [Def.LN, 2], [Def.LE, 1], 
                                [Def.CG, 3], [Def.CN, 2], [Def.CE, 1],
                                [Def.NN, 2], [Def.NG, 3], [Def.NE, 1]]); 
        }
    }

    toEmbedSpellsPerLevel = function(clazz, lvl) {

        let res = [];


        return res;
    }

    toEmbedAttributesField = function() {

        let all = [];

        Def.ATTRIBUTES.forEach(attr => {            
            let perc_ = "";
            if (this.percs) perc_ = (this.percs < 1) ? `` : (this.percs == 100 ? `00` : `${this.percs}`);
            let no = `${this[attr]}${(this.percs && this.percs > 0 && attr == Def.STR) ? '.'+perc_ : ''}`
            all.push(`${attr}: ${no.padStart(5,' ')}  |${Def.mods(attr, this[attr], this.percs, (this.arcaneBook || this.illusionsBook), false)}`);
        });

        return {name: "Attributes", value : `\`\`\`${all.join("\n")}\`\`\``, inline : false};
    }

    spellArrayToString = function(arr) {
        
        if (arr.length < 1) return "";

        return `[${arr.join("/")}]`;
    }
    
    toEmbedSpells = function(book, title, perLevel) {

        if (!book || !perLevel) return undefined;

        let spls = "";

        book.forEach((spells, lvl) => { spls += `\`\`\`${spells.join(", ")}\n\`\`\``; });

        return {name: `${title}: ${this.spellArrayToString(perLevel)}`, value : spls, inline : false};
    }
    
    toTextSheetHeader = function() {
        let res = [];
        let lm = "  ";
        
        res.push(lm + "Name:".padEnd(12," ") + this.name || 'john doe');
        res.push(lm + "Race:".padEnd(12," ") + this.race || 'missing!');
        res.push(lm + "Class:".padEnd(12," ") + this.clazz || 'missing!');
        res.push(lm + "Level:".padEnd(12," ") + this.getLevels());
        res.push(lm + "Alignment:".padEnd(12," ") + this.alignment || 'missing!');
        res.push(lm + "Hitpoints:".padEnd(12," ") + this.getHitpoints());
        res.push(lm + "Experience:".padEnd(12," ")+ "[" + Array.from(this.xps.values()).join("/") + "]\n");
        return res.join("\n");
    }

    numberOfAttacks = function() 
    {
        let lvl = 0;
        let char = this;

        let cc = [Def.FIGHTER, Def.PALADIN, Def.RANGER].find(clz => {
            lvl = Char.clazzLevel(clz, char);
            return lvl > 1;
        });

        if (!cc) return "";

        let noRng = cc != Def.RANGER;

        if (lvl > 14) return "At#:2";
        if (lvl > 12 && noRng) return "At#:2";
        if (lvl > 7) return "At#:3/2";            
        if (lvl > 6 && noRng) return "At#:3/2";

        return "";
    }

    toTextSheetWeapons = function() {

        let lm = "  ";
		let res = ("_________________________________________________________________________________\n");            
            res += lm + "Weapons:\n";
        let monk = this.clazz.includes(Def.MONK);
        let monklvl = monk ? this.classLevel(Def.MONK) : 0;
        let hand = monk ? Def.OPEN_HAND_DMG.at(monklvl) : undefined;        
        let b = monk ? [11, hand[0].length,(hand[1]||"").length] : [11,0,0];
        
        if (this.weapons)
        {            
            this.weapons.forEach(w => {
                b[0] = Math.max(b[0],w[0].length);
                b[1] = Math.max(b[1],w[2].length);
                if (w[3]) b[2] = Math.max(b[2],Def.rofOf(w[3]).length); 
            });

            this.weapons.forEach(w => {
                
                let missile = w.length > 3;

                if (!missile) w.push()

                let aggro = Def.baseThaco(this);

                    if (this.race == Def.ELF)
                        if (w[0].includes("longsword") || w[0].includes("shortsword") || (w[0].includes("bow")&&(!w[0].includes("cross"))))
                            aggro -= 1;

                    if (!monk)
                        aggro -= missile ? Def.missileBonus(this.DEX) : Def.strengthBonus(this.STR, this.percs);

                    aggro -= Def.echantmentBonus(w[0]);

                let damage = missile ? 0 : Def.strengthDamageBonus(this.STR, this.percs);
                    //damage += Number(Def.echantmentBonus(w[0]));

                    if (monk) damage = Math.floor(monklvl/2);

                    let d = w[2].split("/");                   // e.g. d6+1/d8  => ["d6+1","d8"]
                    
                    let smal = (/\+(\d)/.exec(d[0]) || ["","0"])[1];           //=> smal = "1"
                    let larg = (/\+(\d)/.exec(d[1]) || ["","0"])[1];           //=> larg = "0"
                     
                    if (smal != "0") d[0] = d[0].replace("+"+smal, "");        //=> ["d6","d8"]
                    if (larg != "0") d[1] = d[1].replace("+"+larg, ""); 
 
                    smal = Number(smal) + damage;                              //=> smal = 1 + str
                    larg = Number(larg) + damage;                              //=> larg = 0 + str
 
                    d[0]+= smal > 0 ? `+${smal}` : (smal < 0 ? `${smal}` : ``);//=> 
                    d[1]+= larg > 0 ? `+${larg}` : (larg < 0 ? `${larg}` : ``);//=> 

                    w[2] = d.join("/");

                let thaco = " THACO:" + `${aggro}`.padStart(2," ") + "  ";

                let dmg = " DMG:" + w[2].padEnd(b[1]+2, " ");
                let rof = (w[3]==undefined) ? ` ${this.numberOfAttacks()}`.padStart(b[2], " ") : ` RoF:${Def.rofOf(w[3])}`.padStart(b[2], " ");
                res += lm + w[0].padEnd(Math.min(14,b[0]), " ") + thaco + dmg + rof + "\n";
            });
        }

        if (monk)
        {
            let aggro = Def.baseThaco(this);
            let dmg = " DMG:" + hand[0].padEnd(b[1], " ");
            let rof = hand[1] ? ` At#:${hand[1]}`.padStart(b[2], " ") : "";
            res += lm + "open hand".padEnd(Math.min(14,b[0]), " ") + " THACO:" + `${aggro}`.padStart(2," ") + "  " + dmg + rof +"\n";
        }            

        return res;
    }

    toTextSheetAttributes = function() {
        let res = [];
        let lm = "  ";

        res.push("_________________________________________________________________________________");

        Def.ATTRIBUTES.forEach(attr => {            
            let lm = "  ";
            let perc_ = "";
            
            if (this.percs) perc_ = (this.percs < 1) ? "" : (this.percs == 100 ? "00" : `${this.percs}`.padStart(2,"0"));

            let no = `${this[attr]}${(this.percs && this.percs > 0 && attr == Def.STR) ? '.'+perc_ : ''}`

            res.push(`${lm}${attr}: ${no.padStart(5,' ')}  ${Def.mods(attr, this[attr], this.percs, (this.arcaneBook || this.illusionsBook), true)}`);
        });

        return res.join("\n") + "\n";
    }

    toTextSheetArmor = function() {

        let res = "_________________________________________________________________________________\n";
        
        res += "  Armor:\n";
        res += "  " + this.armor.padEnd(14, " ") + " AC: " + this.ac + (this.ac_shield ? " (+shield): " + this.ac_shield : "") + "\n";

        return res;
    }

    toTextSheetSkills = function() {

        if (!this.skills) return "";

        let res = "_________________________________________________________________________________\n";
        let lm = "  ";
        let isMonk = this.clazz.includes(Def.MONK);

        let names = ["Pick Pockets........", "Open Locks..........", "Find&Remove Traps...", "Move Silent.........", 
                     "Hide in Shadow......", "Hear Noise..........", "Climb Wall..........", "Read Language......."];

        if (isMonk) names = names.splice(1,names.length-2);

        names.forEach((n,i) => {
            res += lm + n + this.skills[i + (isMonk ? 1 : 0)].toString().padStart(2," ") + ((i+1) % 3 ? "% " : "% \n");
        });

        return res+"\n";
    }

    racialBonus = function() {
        if ([Def.DWARF, Def.HALFLING, Def.GNOME].includes(this.race))
            return Math.floor(this.CON / 3.5);            
        return undefined;
    }

    toTextSheetRacialAbilities = function() {

        if (this.race == Def.HUMAN) return "";        

        let lm = "  ";
        let ab = "";
        let res  = "_________________________________________________________________________________\n";
            res += lm + `${this.race} abilities: \n`;
        if (this.race == Def.DWARF)
            ab = lm + `saves vs. poison/magic/rod,staff,wand +${this.racialBonus()} / infravision 60'\n` + 
                 lm + `+1 vs.goblinoid / giantkin hit -4 / detect slopes 75% sliding walls 66%\n` +
                 lm + `stonetraps/depth 50%\n`;
        if (this.race == Def.ELF)
            ab = lm + `90% resistance to sleep&charm / find secret (1in6) or concealed doors (3in6)\n` + 
                 lm + `infravision 60' / surprise monsters (4in6) when alone\n`;
        if (this.race == Def.GNOME)
            ab = lm + `saves vs. magic/rod,staff,wand +${this.racialBonus()} / infravision 60'\n` + 
                 lm + `+1 vs.kobolds&goblins / speak with small burrowing animals\n` + 
                 lm + `giantkin hit -4 / detect slopes 80% sliding walls 70% depth 60% direction 50%\n`;
        if (this.race == Def.HALFELF)
            ab = lm + `30% resistance to sleep&charm / find secret (1in6) or concealed doors (3in6)\n` + 
                 lm + `infravision 60'\n`;
        if (this.race == Def.HALFLING)
            ab = lm + `saves vs. poison/magic/rod,staff,wand +${this.racialBonus()} / infravision 60' / surprise 4in6\n` + 
                 lm + `detect slopes 75% direction 50%\n`;
        if (this.race == Def.HALFORC)
            ab = lm + `infravision 60'\n`;

        return res + ab;
    }

    toTextSheetSaves = function() {
        
        let lm = "  ";
        let sv = Char.saves(this);
                      
        let res =     "_________________________________________________________________________________\n";    
            res += lm + "Saving throws:\n";
            res += lm + `Paralyze/Poison/Death.${sv[0].toString().padStart(2,".")}  Rod/Staff/Wand........${sv[2].toString().padStart(2,".")}  Spells ...............${sv[4].toString().padStart(2,".")}\n`;
            res += lm + `Petrify/Polymorph.....${sv[1].toString().padStart(2,".")}  Breath Weapon.........${sv[3].toString().padStart(2,".")}  \n`;

        return res;
    }

    toTextSheet = function() {

        let res  = this.toTextSheetHeader();
            res += this.toTextSheetAttributes();
            res += this.toTextSheetRacialAbilities();
            res += this.toTextSheetSaves();
            res += this.toTextSheetWeapons();
            res += this.toTextSheetArmor();
            res += this.toTextSheetSkills();
            res += this.toTextSheetSpells(this.preparedDruidSpells, "Memorized Druid Spells ", this.druidSpellsPerLevel);
            res += this.toTextSheetSpells(this.preparedClericSpells, "Memorized Cleric Spells ", this.clericSpellsPerLevel);
            res += this.toTextSheetSpells(this.illusionsBook, "Book of Illusions ", this.illusionsPerLevel);
            res += this.toTextSheetSpells(this.arcaneBook, "Arcane Spellbook ", this.arcaneSpellsPerLevel);
            res += this.toTextSheetItems();
        return res;
    }

    toTextSheetItems = function()
    {
        if (!this.items && this.items.length < 1) return "";

        let lm = "  ";

        let res = "_________________________________________________________________________________\n";
            res+= lm + "Equipment:\n\n";

        this.items.forEach((it,idx) => {
            
            let last = (idx % 2) != 0;

            res += lm + it.padEnd(36, " ") + (last ? "\n" : "");
        });

        return res;        
    }

    toTextSheetSpells = function(book, title, perLevel, oo) {
        
        if (!book || !perLevel) return "";

        let ll = "  Lvl1: ";
        let lm = "  ";
        let lo = oo ? "O" : " ";
        let res =  "_________________________________________________________________________________\n";
            res += `${lm}${title}: ${this.spellArrayToString(perLevel)}\n\n`;
        let regex = /\s([OØ]{1,4}$)/

        book.forEach((spells, lvl) => { 
            spells.forEach((spell, idx) => {

                let mem = regex.exec(spell);
                let name = spell.replace(regex, "");

                if (idx % 2 == 0) 
                    res += lm + (idx == 0 ? `Lvl${lvl}: ` : `      `) + mem[1].padEnd(4,lo) + name.padEnd(24, " ") + ((idx == spells.length-1) ? "\n" : "");
                else
                    res += lm + mem[1].padEnd(4,lo) + " " + name.padEnd(23, " ") + "\n";
            });
        });

        return res; 
    }


    toEmbedSheet = function() {

        let cmn = `\`\`\`Name:      ${this.name}\nRace:      ${this.race}\nClass:     ${this.clazz || 'none'}\nLevel:     ${this.getLevels() || '?'}\nhitpoints: ${this.getHitpoints() || '?'}\nAlignment: ${this.alignment || 'neutral'}\nExperience:[${Array.from(this.xps.values()).join("/")}]\`\`\``;
        let attrs = this.toEmbedAttributesField();
		let skills = undefined;
        let isMonk = this.clazz.includes(Def.MONK);

		if (this.skills)
		{
            let names = ["PckPcket:", "Opn Lock:", "Fd/RmTrp:", "Mve Slnt:", 
                         "Hide iSd:", "Hear Nse:", "ClmbWall:", "ReadLang:"];

            if (isMonk) names = names.splice(1,names.length-2);

            skills = "";

            names.forEach((n,i) => {
                skills += n.padEnd(10," ") + this.skills[i + (isMonk ? 1 : 0)].toString().padStart(3," ") + (i % 2 ? "\n" : "    ");
            });

			skills = `\`\`\`${skills}\`\`\``;
		}

        let items = this.items ? this.items.join(", ") : "";

        // if (this.items) // 39 chars + \n        // 19|19\n
        //     for (let x=0; x < this.items.length; x++) 
        //         items += this.items[x].padEnd(19) + ((x % 2) ? "\n" : "|");                

		let wpns = "";

        if (this.weapons)
        {
            let b = [0,0,0]; 
            this.weapons.forEach(w => {b[0] = Math.max(b[0],w[0].length);
                                       b[1] = Math.max(b[1],w[2].length);
                                       if (w[3]) b[2] = Math.max(b[2],Def.rofOf(w[3]).length); });

            this.weapons.forEach(w => {
                let dmg = " DMG:" + w[2].padEnd(b[1], " ");
                let rof = (w[3]==undefined) ? `` : ` RoF:${Def.rofOf(w[3])}`.padStart(b[2], " ");
                wpns += w[0].padEnd(b[0], " ") + dmg + rof + "\n";
            });
        }

        if (this.clazz.includes(Def.MONK))
        {
            let hand = Def.OPEN_HAND_DMG.at(this.classLevel(Def.MONK));

            wpns += "open hand    DMG:" + hand[0].padEnd(10, " ") + (hand[1] ? ` At#:${hand[1]}` : ``).padStart(8, " ");
        }

		wpns = `\`\`\`${wpns}\`\`\``;

        let armr = `\`\`\`${this.armor.padEnd(14, " ") + " AC: " + this.ac + (this.ac_shield ? " (+shield): " + this.ac_shield : "")}\`\`\``;

        let res = new EmbedBuilder();

        res.setColor("#999999");
        res.setTitle(`Charakter: ${this.name || 'Protomatter'}`);
        res.addFields(  {name: "Personal", value : cmn, inline : false});    
        res.addFields( attrs);    
        res.addFields(  {name: "Weapons", value : wpns, inline : false});
        res.addFields(  {name: "Armor", value : armr, inline : false});
		if (skills)
			res.addFields(  {name: "Thief Skills", value : skills, inline : false});    				
        if (this.items && this.items.length > 0)
            res.addFields( {name: "Items", value : `\`\`\`${items}\`\`\``, inline : false} );
        if (this.druidSpellsPerLevel)
            res.addFields(this.toEmbedSpells(this.preparedDruidSpells, "Memorized Druid Spells ", this.druidSpellsPerLevel));
        if (this.clericSpellsPerLevel)
            res.addFields(this.toEmbedSpells(this.preparedClericSpells, "Memorized Cleric Spells ", this.clericSpellsPerLevel));
        if (this.illusionsPerLevel)
            res.addFields(this.toEmbedSpells(this.illusionsBook, "Book of Illusions ", this.illusionsPerLevel));
        if (this.arcaneSpellsPerLevel)
            res.addFields(this.toEmbedSpells(this.arcaneBook, "Arcane Spellbook ", this.arcaneSpellsPerLevel));

        return res;
    }

    static createSortedAttributes()
    {
        let res = []

        Def.ATTRIBUTES.forEach(a => {res.push(Char.rollAttribute())});

        return res.sort((a,b) => b-a);
    }

    getOrCreateSortedAttributes(params, proto)
    {
        this.setParamAttributes(params);
        
        let res = this.rollAttributes();

        return res.sort((a,b) => b-a);
    }

    setParamAttributes = function(params)
    {
        if (!params) return;

        Def.ATTRIBUTES.forEach(a => {
            let v = params.get(a);
            if (v) this[a]=parseInt(v); 
        });
    }

    rollAttributes = function()
    {        
        let res = [];

        let hasNine = false;   // one score of 9+ is required to find a class

        Def.ATTRIBUTES.forEach(a =>{

            let t = this[a] || res[res.push(Char.rollAttribute())-1];

            hasNine |= t > 8;
        });

        if (!hasNine)
            if (res.length > 0)
                res[0] = 9;
            else
                this[[Def.DEX, Def.WIS][Math.floor(2 * this.random())]] = 9;
        return res;
    }

    static testRollClassAndSpecies = function()
    {
        let rmap = new Map();
        let clmap = new Map();
        let params = new Map();

        Def.ALLCLASSES.forEach(e => clmap.set(e,0));
        Def.RACES.forEach(e => rmap.set(e,0));

        let it = 10000;
        
        let x = it;

        while (x-- > 0)
        {
            let char = new Char("","").make(params, undefined);

            rmap.set(char.race, rmap.get(char.race) + 1);
            clmap.set(char.clazz, clmap.get(char.clazz) + 1);
        }       

        return [Char.embedMap("Class", clmap), Char.embedMap("Species", rmap)];
    }   

    static shorten = function(str, maxLen)
    {
        let res = str.split("|");
        let max = Math.floor(maxLen/res.length);
        return res[0].substring(0, max-1) + (res[1] ? "/"+res[1].substring(0, max-1) : "") 
                                          + (res[2] ? "/"+res[2].substring(0, max-1) : "");
    }

    static embedMap = function(title, map)
    {
        const emb = new EmbedBuilder();

        let stats = `\`\`\``;
        
        let kLen = 0;
        let vLen = 0;
        let aLen = 28;
        let vMax = 0;
        let it = 0;

        map.forEach((v,k) => {
            kLen = Math.max(k.length, kLen);            // max value length
            vLen = Math.max(`${v}`.length, vLen);       // max count length
            vMax = Math.max(vMax, v);                   // biggest number
            it += v;                                    // iterations
        });

        kLen = Math.min(10,kLen); // if longer than 10 chars ... cut the name (Illusionist: => Illusioni.:)

        let p1Len = kLen + vLen + 1;
        let p2Len = aLen - p1Len;
        let dots = (vMax/(p2Len-1));

        map.forEach((v,k) => {

            let sk = k.length > kLen ? Char.shorten(k,kLen) : k;
            let p1 = `${sk}:${' '.repeat(p1Len - `${v}`.length - sk.length)}${v} `;
            let p2 = `${'-'.repeat(Math.round(v/dots))}|\n`;

            stats += (p1 + p2);
        });

        stats += `\`\`\``;    
        
        emb.setColor("#999999");
        emb.addFields(  {name: `${title} rolled (${it} iterations)`, value : stats, inline : false});    

        return emb;
    }

    static testRollClass = function()
    {
        let clmap = new Map();

        Def.CLASSES.forEach(e => clmap.set(e,0));

        let it = 100000;
        
        let x = it;

        while (x-- > 0)
        {
            let scr = Char.classTable(Char.createSortedAttributes());
            let clz = (new Table(scr.claz)).roll();
            clmap.set(clz, clmap.get(clz) + 1);
        }       

        const emb = new EmbedBuilder();

        let stats = `\`\`\``;

        for (let i = 0; i < Def.CLASSES.length; i++)
        {
            let key = Def.CLASSES[i];
            let p1 = `${key}:${' '.repeat(12 - key.length)}${clmap.get(key)}`;
            let p2 = `${' '.repeat(18 - p1.length)} ${'-'.repeat(Math.round(clmap.get(key)/it * 45))}|\n`
            stats += p1 + p2;
        }
        stats += `\`\`\``;    
        
        emb.setColor("#999999");
        emb.addFields(  {name: `Classes rolled (${it} iterations)`, value : stats, inline : false});    

        return emb;
    }   

    static testRollAttribute = function()
    {                
        let it = 1000000;
        let res = [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0];
        let x = it;
        
        while (x-- > 0) res[Char.rollAttribute()-3]++;

        for (let i = 0; i < res.length; i++)
            console.log(`${i+3} => ${res[i]}`);

        const emb = new EmbedBuilder();

        let stats = `\`\`\``;
        for (let i = 0; i < res.length; i++)
        {
            let p1 = `${i+3}:${' '.repeat(i<7 ? 2 : 1)}${res[i]}`;
            let p2 = `${' '.repeat(10 - p1.length)} ${'-'.repeat(Math.round(res[i]/it*100))}|\n`
            stats += p1 + p2;
        }
        stats += `\`\`\``;    
        
        emb.setColor("#999999");
        emb.addFields(  {name: `Attributes (Method I) rolled (${it} iterations)`, value : stats, inline : false});    

        return [emb];
    }

    static normalizeClass = function(str)
    {
        if (!str) return undefined;

        let comp = str.split("|");                
        let match = comp.length;

        return Def.ALLCLASSES.find(clz => {                                    
            let hits = 0;            
            comp.forEach(c => {if (clz.includes(c)) hits++});            
            return (hits == comp.length) && (hits == clz.split("|").length);
        });
    }

    static parseParams = function(str)
    {
        var res = new Map();

        if (!str.trim()) return res;

        var pieces = str.split(/\s+/);        

        pieces.forEach(l => {

            var m = l.match(/([^\d^=]+)[=]?(\d{0,7})?(\D{2,64})?/);           
            
            if (m && m[1])
            {
                if (m[1].toLowerCase() == "name")
                    res.set("name", m[3]);
                else if (Char.keywords.includes(m[1].toLowerCase()))
                    res.set(m[1], parseInt(m[2]));
                else if (Def.RACES.includes(m[1].toLowerCase()))
                    res.set("race", m[1].toLowerCase());
                else if (Def.ATTRIBUTES.includes(m[1].toUpperCase()))
                    res.set(m[1], m[2].toUpperCase());
                else 
                {
                    let cl = Char.normalizeClass(m[1].toLowerCase());

                    if (cl) res.set("class", cl);
                }
            }
            else console.log(`unknown param: ${l}`);
        });        

        return res;    
    }

    static desiredAttributes = function(clazz, attrs)
    {
        //random decision 50/50
        let v1 = Math.floor(2 * this.random());
        let v2 = Math.floor(3 * this.random());

        switch (clazz)
        {
            case Def.MONK       :      //monk str15, wis15, dex15, con11
                return [Def.DEX, v1 ? Def.CON : Def.STR, v1 ? Def.STR : Def.CON];                

            case Def.PALADIN    :      //paladin cha17, wis13, str12, con9
                return [v1 ? Def.CON : Def.STR, v1 ? Def.STR : Def.CON, Def.DEX];

            case Def.RANGER     :      //ranger (wis14,con14,int13,str13)
                return [v1 ? Def.CON : Def.STR, v1 ? Def.STR : Def.CON, Def.DEX];

            case Def.DRUID      :      //druid (cha15,wis12)
                return [Def.WIS, Def.CON];

            case Def.ILLUSIONIST:      //illusionist (dex16,int15)
                return [Def.INT, v1 ? Def.CON : Def.DEX, v1 ? Def.DEX : Def.CON];

            case Def.CLERIC     :      //cleric (wis9)
                return [Def.WIS, Def.CON];    

            case Def.MAGICUSER  :      //magic-user (int9,dex6)
                return [Def.INT, v1 ? Def.CON : Def.DEX, v1 ? Def.DEX : Def.CON];

            case Def.ASSASSIN   :      //assassin (str12,dex12,int11)        
                return [Def.DEX, v1 ? Def.CON : Def.STR, v1 ? Def.STR : Def.CON, Def.INT];

            case Def.FIGHTER   :       //fighter (str9,con7)
                return [v1 ? Def.CON : Def.STR, v1 ? Def.STR : Def.CON, Def.DEX];

            case Def.THIEF     :       //thief (dex9)
                return [Def.DEX, Def.CON, Def.INT];
                
            case Def.FIGHTER_THIEF :
                return [v1 ? Def.STR : Def.DEX, v1 ? Def.DEX : Def.STR, Def.CON, Def.INT];

            case Def.FIGHTER_CLERIC :
                return [v1 ? Def.WIS : Def.STR, v1 ? Def.STR : Def.WIS, Def.CON];

            case Def.FIGHTER_MAGICUSER :                                    
                return [v1 ? Def.STR : Def.INT, v1 ? Def.INT : Def.STR, Def.CON];

            case Def.FIGHTER_ASSASSIN :
                return [v1 ? Def.STR : Def.DEX, v1 ? Def.DEX : Def.STR, Def.CON, Def.INT];

            case Def.FIGHTER_ILLUSIONIST :
                return [v1 ? Def.STR : Def.INT, v1 ? Def.INT : Def.STR, Def.CON];

            case Def.FIGHTER_THIEF_MAGICUSER :                                    
				if (v2 < 1) return [Def.STR, Def.DEX, Def.INT];
                if (v2 < 2) return [Def.DEX, Def.INT, Def.STR];
                            return [Def.INT, Def.STR, Def.DEX];

            case Def.FIGHTER_MAGICUSER_CLERIC :
                if (v2 < 1) return [Def.STR, Def.WIS, Def.INT];
				if (v2 < 2) return [Def.WIS, Def.INT, Def.STR];
							return [Def.INT, Def.STR, Def.WIS];

			case Def.THIEF_MAGICUSER :
            case Def.THIEF_ILLUSIONIST :
                return [v1 ? Def.DEX : Def.INT, v1 ? Def.INT : Def.DEX, Def.CON];
            case Def.THIEF_CLERIC :                                    
            case Def.CLERIC_ASSASSIN :
                return [v1 ? Def.DEX : Def.WIS, v1 ? Def.WIS : Def.DEX, Def.CON];
            case Def.CLERIC_RANGER :                                    
                return [v1 ? Def.STR : Def.WIS, v1 ? Def.WIS : Def.STR, Def.CON];
        }
		return [];
    }

    distributeDesired = function(srt, params)
    {
        srt.sort((a,b) => b-a);

        let wnt = Char.desiredAttributes(this.clazz, srt);
        let rmod = Def.raceMods(this.race);

        wnt.forEach(w => {
            if (!params.get(w))
            {
                let cur = this[w];
                let mod = rmod.get(w)||0;

                if (srt.length > 0 && (!cur || cur+mod < srt[0])) {

                    this[w]=srt.splice(0,1)[0];

                    if (cur)
                    {
                        let idx = srt.findIndex(v => {return v < cur});
                        srt.splice(idx < 0 ? srt.length : idx,0,cur);
                    }
                }
            }
        });
        return srt;
    }

    applyRacialMods = function(params)
    {
        // racial modifiers don't apply to attributes set via parameter
        Def.raceMods(this.race).forEach((v,k) => {
            if (!params.get(k)) this[k]+=v;
        });
    }

    distributeRemaining = function(srt)
    {
        Char.shuffle(srt);
		
		Def.ATTRIBUTES.forEach(a => {
			if (this[a] == undefined)
				this[a] = srt.splice(0,1)[0];
		});

        if (this.clazz.includes(Def.FIGHTER) || this.clazz.includes(Def.RANGER) || this.clazz.includes(Def.PALADIN))
            this.percs = (this.STR >= 18) ? Table.rollDie(100) : 0;        
    }

    static shuffle = function(array)
    {
        let cur = array.length;
        
        while (cur-- > 0) 
        {        
			let rand = Math.floor(Math.random() * (cur+1));

			[array[cur], array[rand]] = [array[rand], array[cur]];
        }
    }

    static rollSRAttributes()
    {
        let res = [];

        Def.ATTRIBUTES.forEach(a => {res.push(Char.rollAttribute());});

        return res;
    }

    static enchant(wpn, lvl)
    {
        let res = []
        
        wpn[2].split("/").forEach(dmg => {
            res.push(dmg.includes("+1") ? dmg.replace("+1", `+${1+lvl[1]}`) : dmg+lvl[0]);
        });

        wpn[0] += lvl[0];
        wpn[2] = res.join("/");
    }

    static saves(char)
    {
        let res = [20,20,20,20,20,20];
        let tmp = [];

        char.clazz.split("|").forEach( clz => {
            switch (clz)
            {
                case Def.FIGHTER :
                    tmp = Def.SAVES.get(Def.FIGHTER)[Math.ceil((Char.clazzLevel(Def.FIGHTER,char)/2))-1];
                    break;
                case Def.PALADIN :
                    tmp = Def.SAVES.get(Def.FIGHTER)[Math.ceil((Char.clazzLevel(Def.PALADIN,char)/2))-1];
                    break;
                case Def.RANGER :                
                    tmp = Def.SAVES.get(Def.FIGHTER)[Math.ceil((Char.clazzLevel(Def.RANGER,char)/2)-1)];
                    break;
                case Def.CLERIC :
                    tmp = Def.SAVES.get(Def.CLERIC)[Math.ceil((Char.clazzLevel(Def.CLERIC,char)/3)-1)];
                    break;
                case Def.DRUID :
                    tmp = Def.SAVES.get(Def.CLERIC)[Math.ceil((Char.clazzLevel(Def.DRUID,char)/3)-1)];
                    break;
                case Def.THIEF :
                    tmp = Def.SAVES.get(Def.THIEF)[Math.ceil((Char.clazzLevel(Def.THIEF,char)/4)-1)];
                    break;
                case Def.ASSASSIN :
                    tmp = Def.SAVES.get(Def.THIEF)[Math.ceil((Char.clazzLevel(Def.ASSASSIN,char)/4)-1)];
                    break;
                case Def.MONK :
                    tmp = Def.SAVES.get(Def.THIEF)[Math.ceil((Char.clazzLevel(Def.MONK,char)/4)-1)];
                    break;
                case Def.MAGICUSER :
                    tmp = Def.SAVES.get(Def.MAGICUSER)[Math.ceil((Char.clazzLevel(Def.MAGICUSER,char)/5)-1)];
                    break;
                case Def.ILLUSIONIST :
                    tmp = Def.SAVES.get(Def.MAGICUSER)[Math.ceil((Char.clazzLevel(Def.ILLUSIONIST,char)/5)-1)];
                    break;
            }

            let ring = char.items ? char.items.find(v => {return v.startsWith("ring o.protection");}) : "";
            let bonus = ring ? (ring.endsWith("+2") ? 2 : 1) : 0;

            res = tmp.map((v,i) => {return Math.min(v,res[i]) - bonus;});
        });
        
        return res;
    }
}

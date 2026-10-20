const { Client, Partials, Events, EmbedBuilder, AttachmentBuilder, Intents, GatewayIntentBits } = require('discord.js');

const Files = require('fs');
const { inherits } = require('util');
const { config } = require('process');
const { Z_DEFAULT_STRATEGY, brotliCompress } = require('zlib');

const History = require('./history');
Calendar = require('./calendar');
const {Weather} = require('./weather');
const { Readable } = require('stream');
const { Battlemap } = require('./battlemap');

const { Defines } = require('./defines');
const { Character } = require('./character');

const { Greyhawk } = require('./greyhawk');
const { Moon } = require('./moon');

const bot = new Client({ 
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] ,
    partials: [Partials.Channel]
});

// stateful things
states = {};
notes = {};
users = undefined;
buffers = {}; 


dirty = false;
dirty_notes = false;
dirty_users = false;
 

bot.on('ready', () => {console.log('subservient weathergobbo, at your command');})

bot.on(Events.MessageCreate, msg => {

    str = msg.content.trim();
      
    try
    {
        if (!str.startsWith('~')) return;
        
        if (msg.author.bot) return;

        //if (!str.startsWith('~rollHero') && !str.startsWith('~rollAttributes')) return; // test operation        

        if (str.startsWith('~date weather')) msg.channel.send(handleDateWeather(msg));        

        else if (str.startsWith('~date')) msg.channel.send(handleDate(msg));
        
        else if (str.startsWith('~note')) msg.channel.send(handleNote(msg));

        else if (str.startsWith('~allnotes')) msg.channel.send(handleSummary(msg));

        else if (str.startsWith('~help')) msg.channel.send(handleHelp(msg));
        
        else if (str.startsWith('~drawHex')) msg.channel.send(handleHex(msg));
        
        else if (str.startsWith('~drawHexImage')) handleHexImage(msg);

        else if (str.startsWith('~removenotes')) msg.channel.send(handleRemoveNotes(msg));

        else if (str.startsWith('~timelines')) msg.channel.send(handleTimelines(msg));

        else if (str.startsWith('~sync')) msg.channel.send(handleSync(msg));
    
        //if (str.startsWith('~test')) msg.channel.send(handleTest(msg));
        //else if (str.startsWith('~test')) msg.channel.send(test(msg));
        
        else if (str.startsWith('~rollAttributes')) msg.channel.send(handleRollAttributes(msg));
        
        else if (str.startsWith('~rollHero')) msg.channel.send(handleRollHero(msg));
        else if (str.startsWith('~testCharCreation')) msg.channel.send(testCharCreation(msg));

        //else if (str.startsWith('~testMoonphases')) msg.channel.send(testMoonphases(msg));

        if (dirty) saveState(msg.guild.name);
        if (dirty_notes) saveNote(msg.guild.name);
        if (dirty_users) saveUserfile(msg.guild.name);
    }
    catch (err)
    {
        let desc = "that didn't work! [" + err.message + "]";
        console.log(desc);
        console.log(err.stack);
        msg.channel.send(desc);
    }
    return null;
})

bot.login("<place the bot token here>");

function getDirtyState(name)
{
    dirty = true;

    return getState(name);
}

function getState(name)
{
    if (states[name]) return states[name];

    res = Files.existsSync(name + '.json') && JSON.parse(Files.readFileSync(name + '.json'));

    if (res) 
        states[name] = res 
    else
        throw new Error("no configuration found for " + "[" + name+ "]");
    
    return states[name];
}

function getDirtyNotes(name)
{
    dirty_notes = true;
    
    return getNotes(name);
}

// msg.guild.name, message.author
function getDirtyUsers(guild)
{
    dirty_users = true;
        
    return getUsers(guild);
}


// msg.guild.name, message.author
function getDirtyUser(guild, author)
{
    if (author.bot) return null;

    let usrs = getDirtyUsers(guild);

    if (usrs[author.username]) return usrs[author.username];
    
    usrs[author.username] = {};

    return usrs[author.username];
}


function getUsers(guild)
{
    if (users) return users;

    users = Files.existsSync(guild + '_users.json') && JSON.parse(Files.readFileSync(guild + '_users.json'));

    return users;
}

function getNotes(name)
{
    if (notes[name]) return notes[name];

    res = Files.existsSync(name + '_notes.json') && JSON.parse(Files.readFileSync(name + '_notes.json'));

    notes[name] = res || [];

    return notes[name];
}

function saveNote(name)
{
    Files.writeFileSync(name + '_notes.json', JSON.stringify(getNotes(name)));
}

function saveUserfile(name)
{
    let str = JSON.stringify(getUsers(name));

    Files.writeFileSync(name + '_users.json', str);
}

function saveState(name)
{
    Files.writeFileSync(name + '.json', JSON.stringify(getState(name)));
}

function commandLineToDateParam(str)
{
    if (!str.trim()) return {res : 'none'};

    param = str && str.trim().match(/^([0-9]{4})[.\-\/ ]?([0-9]{2})[.\-\/ ]?([0-9]{2})$/);

    if (param) 
    {
        if (parseInt(param[1]) < 0 || 
            parseInt(param[2]) == 0 || 
            parseInt(param[3]) == 0) return {res : 'month or day may not be null (negative year not supported yet, use relative move instead)'};

        return { res : 'abs', 'params' : param};
    }

    param = str && str.trim().match(/^(?:([+-]?[0-9]+)y\s*)?(?:([+-]?[0-9]+)m\s*)?(?:([+-]?[0-9]+)d\s*)?$/);    

    if (param) return { res : 'rel', 'params' : param};

    return {res : `unrecognized date parameter [${str}]`};
}

function commandLineToNoteParam(str)
{
    if (!str.trim()) return {res : 'status'};

    return {res : "", note : ""+str};
}

function plane(msg)
{
    state = getState(msg.guild.name);
    
    tline = timeline(msg);    

    if (!state.planes[tline.planeId]) throw new Error("no plane found : [" + tline.planeId + "]");
    
    return state.planes[tline.planeId];
}

function timeline(msg)
{
    state = getState(msg.guild.name);    

    for (id in state.timelines)
    {
        if (id === msg.channel.parent.name) return state.timelines[id];
    }

    throw new Error("no timeline found : [" + msg.channel.parent.name + "]");
}

function elsewhereDates(msg)
{
    let res = [];

    let state = getState(msg.guild.name);

    let pl = plane(msg);
    let tl = timeline(msg);

    for (var entry of pl.planar_offsets)
    {
        let planeId = Object.keys(entry)[0];

        let other = state.planes[Object.keys(entry)[0]];

        let odate = Calendar.create(other.calendarId, tl.date + Object.values(entry)[0]);

        res.push({"plane" : planeId, "date" : odate});
    }
    return res;
}

function moons(msg)
{
    let res = [];

    let pl = plane(msg);
    let tl = timeline(msg);

    let dt = Calendar.create(pl.calendarId, tl.date);

    if (pl.moons) for (var m of pl.moons)
    {
        let moon = new Moon(m)

        res.push(`${moon.name()} : ${moon.icon(dt.getDay())}`);
    }

    return res.length > 0 ?  res.join("   ") : "";
}


function elsewhereDate(msg)
{
    let pdates = elsewhereDates(msg);

    res = "";

    for (var dt of pdates)
    {
        res += "\n ... in " + dt.plane + " ist gerade : " + dt.date.short();
    }

    return res;
}

function handleStatus(msg)
{
    let tl = timeline(msg);
    let pl = plane(msg);

    let dt = Calendar.create(pl.calendarId, tl.date);

    let wt = new Weather(pl.weatherseed, tl.weatherZone, dt);

    let mn = moons(msg);

    let res =  "status\nDatum: " + dt.toString();
        res += "\n" + wt.toString();
        res += "\n" + elsewhereDate(msg) + "\n";
        res += mn ? "\n" + mn + "\n" : "";
        res += "\n" + getNote(notesDatePrefix(msg), getNotes(msg.guild.name));

    return res;
}

function handleAbsolute(msg, param)
{   
    let tl = timeline(msg);
    let pl = plane(msg);

    let dt = Calendar.create(pl.calendarId, tl.date);

    dt.moveTo(parseInt(param[1] || '0000'), parseInt(param[2] || '0'), parseInt(param[3] || '0'));    

    tl.date = dt.getMs();

    dirty = true;

    return `setze Datum auf: [${param[0]}]\n\n` + handleStatus(msg);
}

function handleRelative(msg, param)
{
    let tl = timeline(msg);
    let pl = plane(msg);
    
    let cal = Calendar.create(pl.calendarId, tl.date);

    cal.moveBy(parseInt(param[1] || '0'), parseInt(param[2] || '0'), parseInt(param[3] || '0'));    

    tl.date = cal.getMs();

    dirty = true;

    return `verschiebe Datum um [${param[0]}]\n\n` + handleStatus(msg);
}

function test(msg)
{
    res = msg.channel.name;
    pa = msg.channel.parent;
    while (pa != null)
    {
        res += ` -> ${pa.name}`;
        pa = pa.parent;
    }
    return res;
}

function findPlanarOffset(otherPlaneId, thisPlane)
{
    for (it of thisPlane.planar_offsets)
    {        
        if (Object.keys(it)[0] == otherPlaneId) return Object.values(it)[0];
    }
    return null;
}

function notesDatePrefix(msg)
{
    let res = [];

    let state = getState(msg.guild.name);

    let pl = plane(msg);
    let tl = timeline(msg);

    for (let key in state.planes)
    {
        let offset = (tl.planeId == key) ? 0 : findPlanarOffset(key, pl);

        if (offset != null)
        {
            let odate = Calendar.create(state.planes[key].calendarId, tl.date + offset);

            res.push(odate.sortableShort());    
        }
        else console.log("no planar offset given for " + key + " from " + tl.planeId);
    }
    
    return res.join("|");
}

function notesPrefix(msg)
{
    let tl = timeline(msg); 

    let name = tl.name.slice(0,11);
    let tlHint = `[${name}]${" ".repeat(Math.max(11-name.length,1))}`;

    return notesDatePrefix(msg) + tlHint + "# ";
}

function handleNote(msg)
{
    let cmd = commandLineToNoteParam(msg.content.trim().substring("~Note".length));    

    if (cmd.res == 'status')
      return getNote(notesDatePrefix(msg), getNotes(msg.guild.name));
    else
    {
      if (cmd.note.startsWith(" "))
        return addNote(notesPrefix(msg), getDirtyNotes(msg.guild.name), cmd.note);
      else 
        return "... missing space? try ~note <space> blabla";
    }
}

function addNote(date, notes, txt)
{
    let idx = notes.findIndex(el => {return (date < el.substring(0, date.length));});

    notes.splice(idx < 0 ? notes.length : idx, 0, date + txt);

    return "... added";
}

function handleSummary(msg)
{
    let notes = getNotes(msg.guild.name);

    let res = "Greyhawk |Gnomoog  #  Ereignis\n" +
              "------------------------------\n" + notes.join("\n");   

    let att = new AttachmentBuilder().setFile(Buffer.from(res)).setName("Ereignisse.txt");
    
    return {files: [att]};
}


function handleHelp(msg)
{
    let embed = new EmbedBuilder();

    embed.setColor("#999999");
    embed.setTitle("Wettergoblin Kommandos:");    
    embed.addFields({name: "~date", value: "zeigt das Datum, Wetter und Notizen zum aktuellen Tag der Zeitlinie, die dem benutzten Kanal zugeordnet ist", inline: false},
                    {name: "~date <yyyymmdd>", value: "setzt das Datum der Zeitlinie auf einen absoluten Wert. Beispieldatum : 05781410 = Jahr 578, Monat 14, Tag 10", inline: false},
                    {name: "~date [+,-]n{d,m,y}", value: "setzt das Datum der Zeitlinie um Tage (d), Monate (m) oder Jahre (y) in die Zukunft (+) oder Vergangenheit (-)", inline: false},
                    {name: "~note txt", value: "fügt einen Eintrag txt mit aktuellem Datum der Ereignisliste hinzu", inline: false},
                    {name: "~allnotes", value: "stellt ein Textdokument aller Ereignisse, aus allen Zeitlinien in den Kanal", inline: false},
                    {name: "~removenotes", value: "entfernt alle Ereignisse des aktuellen Tages", inline: false},
                    {name: "~timelines", value: "zeigt eine Übersicht aller Zeitlinien", inline: false},
                    {name: "~sync", value: "setzt das Datum auf den aktuellen 'echten' Tag (MEZ)", inline: false},
                    {name: "~drawHex", value: "erzeugt eine kleine Hexkarte als svg-file (download + open w/browser). Mögliche Parameter: \n - riverAB (A und B sind Start- und Stopkanten der Karte)\n- roadAB\n- mountsNN (NN Anzahl der Felder)\n- hillsNN \n- bogsNN \n- woodsNN", inline: false},
                    {name: "~rollAttributes", value: "würfelt sechs Attribute (4d6 drop lowest) und merkt sich das Ergebnis für den Benutzer", inline: false},
                    {name: "~rollHero", value: "generiert eine Personnage, benutzt dabei Attribute des Benutzers (siehe oben), wenn vorhanden. Mögliche Parameter: \n - <class>[fighter,thief,cleric,magicuser] multiclass mit '|' getrennt\n- <species>[elf,dwarf,half-elf,half-orc,halfling,gnome]\n - xp<number> Erfahrung, z.B.: '~rollHero fighter|thief xp12000'\n - verbose mit ausgabe im discord", inline: false});

    return {embeds: [embed] };
}

function handleRemoveNotes(msg)
{
    let prefix = notesPrefix(msg);
 
    let notes = getNotes(msg.guild.name);

    let first = notes.findIndex(el => {return (prefix == el.substring(0, prefix.length));});

    if (first < 0) return "kein Eintrag gefunden";

    dirty_notes = true;

    let last = notes.findIndex(el => {return (prefix < el.substring(0, prefix.length));});
    
    last = (last < 0) ?  notes.length -1 : last - 1;

    let c = last - first + 1;

    notes.splice(first, c);

    return `es ${c > 1 ? "wurden" : "wurde"} ${c} ${c > 1 ? "Einträge" : "Eintrag"} gelöscht`;
}

function getNote(date, notes)
{
    let res = [];
    
    notes.every(el => {
        let pre = el.substring(0, date.length);

        if (date === pre) 
            res.push(el.substring(el.indexOf("#  ") + 3));

        return (pre <= date);
    });    
    return (res.length == 0) ? "-keine Ereignisse-" : "Ereignisse: \n" + res.join("\n");
}

// return message, return date, set date, or move date
function handleDate(msg)
{
    clp = commandLineToDateParam(msg.content.trim().substring("~Date".length));

    if (clp.res == 'none') return handleStatus(msg);
    if (clp.res == 'abs') return handleAbsolute(msg, clp.params);
    if (clp.res == 'rel') return handleRelative(msg, clp.params);

    return clp.res;
}

function handleSync(msg)
{
    let tl = timeline(msg);
    let pl = plane(msg);

    let off = findPlanarOffset("echt (MEZ)", pl);

    if (!off) return 'keinen Bezug zum \'echten\' Datum gefunden';

    tl.date = Date.now() - off;

    let local = Calendar.create(pl.calendarId, tl.date);

    dirty = true;
    
    return `setze Datum auf: ${local.short()}\n\n` + handleStatus(msg); 
}

function handleDateWeather(msg)
{
    clp = commandLineToDateParam(msg.content.trim().substring("~Date weather".length));

    if (clp.res == 'none') return handleStatusWeather(msg);
    if (clp.res == 'abs')  return handleAbsoluteWeather(msg, clp.params);
    if (clp.res == 'rel')  return handleRelativeWeather(msg, clp.params);

    return clp.res;    
}
function handleStatusWeather(msg)
{
    res = getState(msg.guild.name).weather;

    return 'current weather date is: ' + (res ? History.toDate(res) : 'not set');
}


function handleTimelines(msg)
{
    let refTl = timeline(msg);
    let refPlane = plane(msg);    
    let refDays = Calendar.create(refPlane.calendarId, refTl.date).getDay();

    let data = getState(msg.guild.name);    

    let summary = [];
    let reps = [];
    let ahead = 0;
    let behind = 0;

    for (var id in data.timelines)
    {
        let tline = data.timelines[id];
        let offset = (refTl.planeId == tline.planeId) ? 0 : findPlanarOffset(tline.planeId, refPlane);
        let days = Calendar.create(refPlane.calendarId, tline.date - offset).getDay() - refDays;        
        let out = Math.abs(days) < 365;

        if (out)
        {
            behind = Math.min(days, behind);
            ahead = Math.max(days, ahead);
        }
        
        let line = `${tline.name} `;

        if (id !== msg.channel.parent.name) line += `[${days > 0 ? "+" : "-"}${Math.abs(days)}]`;

        if (out) reps.unshift(days); else reps.push(days);
        if (out) summary.unshift(line); else summary.push(line);
    }
    
    let factor = Math.ceil((ahead - behind + 1) / 30);

    for (i=0; i< summary.length; i++)
    {
        let pref = (Math.abs(reps[i])<365) ?  "|--" + "-".repeat((reps[i]-behind)/factor) : ((reps[i] < 0) ? "| <<< " : "| >>> ");
        summary[i] = pref + summary[i];
    }

    return "Timelines:\n\n" + summary.join("\n");
}

function handleAbsoluteWeather(msg, params)
{
    if (params[1] < 100) return ""
    d = getDate(params[1], params[2]-1, params[3])

    getDirtyState(msg.guild.name).weather = d.getTime();

    return `setting weather to: [${param[0]} => ${d.getTime()} =>${new Date(d.getTime())} ]`;
}

function handleRelativeWeather(msg, params)
{
    state = getDirtyState(msg.guild.name);
    
    old = state.weather ? getDate(state.weather) : getDate(state.date);

    state.weather = getDate( old.getFullYear() + parseInt(param[1] || '0'),
                             old.getMonth() + parseInt(param[2] || '0'),
                             old.getDate() + parseInt(param[3] || '0')).getTime();    

    return `move weather from ${old == getDate(state.date) ? 'date' : 'weather'} by [${param[0]}]`;
}

function handleHex(msg)
{
    bm = new Battlemap(msg.content);    

    let dr = bm.drawMap();

    buff = Buffer.from(dr);
    
    let att = new AttachmentBuilder().setFile(buff).setName("map.svg");
    
    return {files: [att]};
}

function handleHexImage(msg)
{
    //try node-canvas + librsvg
    // bm = new Battlemap(msg.content);    

    // let dr = bm.drawMap();
   
    // svg2img(Buffer.from(dr), { format: 'png', width: 800, height: 800 }, function(err, data) { 
    //     msg.channel.send(new Discord.MessageAttachment(data, "map.png"));
    // });    
}

function handleRollAttributes(msg)
{
    if (msg.author.bot) return null;

    let user = getDirtyUser(msg.guild.name, msg.author);

    if (!user.srt) user.srt = Character.rollSRAttributes();

    res = new EmbedBuilder();

    res.addFields({name: "Attributes", value : `\`\`\`${user.srt.join(", ")}\`\`\``, inline : false});

    return {embeds: [res]};
}


function handleRollHero(msg)
{
    if (msg.author.bot) return null;

    let user = getDirtyUser(msg.guild.name, msg.author);        

    let char = new Character(user.srt, msg.content);

    user.srt = undefined;    

    //return {embeds: [char.toEmbedSheet()]};

    let res = char.toTextSheet();
    
    let att = new AttachmentBuilder().setFile(Buffer.from(res, "utf-8")).setName("char.txt");

    if (msg.content.includes("-verbose"))
        return {files: [att], embeds: [char.toEmbedSheet()]};
    else
        return {files: [att]};
}

function testMoonphases(msg)
{
    let prop = {"name": "Phoebe",
                "cycle_days": 91,
                "offset_days": 0};

    let mn = new Moon(prop);

    let start = 5*364;
    let x = start;    

    while (x < start + 365) 
    {
        let val = Moon.emojis.indexOf(mn.icon(x++));

        console.log(`Phoebe: ${x} ${' '.repeat(9 - val)} ${'O'.repeat(val)}`);
    }        

    return "done";
}

function testCharCreation(msg)
{   
    var emb = [].concat(Character.testRollAttribute())
                .concat(Character.testRollClassAndSpecies());

    // let spec = Character.testRollSpecies();
    // let alig = Character.testGeneralAlignment(null)

    return {embeds: emb}; 
}

function handleTest(msg)
{
    let et = new Date(2025,0,1);

    console.log(`echt#1 : ${et.getTime()}`);

    return "ok";

}

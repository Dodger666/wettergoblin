const Files = require('fs');

exports.History = class History {
    constructor(name) {
        this.name = name;
        this.lines = getLines(name);
    }
}

function fileName(name)
{
    return name+'_history.txt';
}

function getLines(name)
{
    var res;
    
    if (Files.existsSync(fileName(name)))
        Files.readFileSync(fileName(name)).toString().split('\n').foreach(
            line => {
                match = dateMatch(line);
                res[exports.toDate(match)] = match[4];
            }
        );    
        
    return res;
}

exports.dateMatch = function dateMatch(str)
{
    return str ? str.match(/^([0-9]{4})[.-\/ ]?([0-9]{2})[.-\/ ]?([0-9]{2})\s*(.*)/) : undefined;
}

exports.toDate = function(val)
{
    if (typeof val === 'number' && isFinite(val)) return new Date(val);

    var param;

    if (typeof val === 'string' || value instanceof String) param = exports.dateMatch(val);
    if (typeof val === 'object' && val.constructor === RegExpMatchArray) param = val;
       
    return param ? new Date(parseInt(param[1]), parseInt(param[2])-1, parseInt(param[3])) : undefined;
}

exports.dateToString = function(val)
{
    var date = val;
    
    if (!val) return "date not set, or invalid (use ~date weather yyyymmdd)";    

    if (typeof val === 'number' && isFinite(val)) date = new Date(val);

    return date ? `${('0000' + date.getFullYear()).slice(-4)}-${('0' + (date.getMonth()+1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}` : "";
}


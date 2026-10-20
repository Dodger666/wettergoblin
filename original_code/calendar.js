const Files = require('fs');
const { Gregorian } = require('./gregorian');
const { Greyhawk } = require('./greyhawk');

exports.Calendar = class Calendar {
}



// params are calendar id and milliseconds from 1970/01/01:00.00.00
exports.create = function(id, ms)
{
    if (id === "gregorian") return new Gregorian(id, ms);
    
    if (id === "greyhawk") return new Greyhawk(id, ms);

    return null;
}


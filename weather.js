const Files = require('fs');
const seedrandom = require('seedrandom');
const { Gregorian } = require('./gregorian');

exports.Weather = class Weather {

    static zones = {"yourWeatherId" : require('./yourWeatherHere.json')};
    
    constructor(seed, planeId, date) {
        this.seed = seed;
        this.salt = planeId;
        this.date = date;
        this.zone = planeId;
    }

    toString = function()
    {
        return this.weatherText();
    }    

    weatherText = function()
    {
        let season = this.getSeason();

        let z = Weather.zones[this.zone];

        return `es ist ${season}. ${z[season][this.curValue() % (z[season].length)]}`;
    }

    getSeason = function()
    {
        let cur = parseInt(('0'+(this.date.getMonth()+1)).slice(-2)+(('0'+this.date.getDate()).slice(-2)));

        let z = Weather.zones[this.zone];

        let seasons = z["seasons"];

        seasons.sort((b, a) => {return Object.values(a)[0] - Object.values(b)[0];});

        for (var e of seasons)
        {
            if (cur > e[Object.keys(e)[0]]) return Object.keys(e)[0];
        }
        return Object.keys(seasons[0])[0];
    }

    curValue = function()
    {
        let reqDays = this.date.calcDays();
    
        let backward = reqDays < 0;
    
        reqDays = Math.abs(reqDays);
            
        let random = seedrandom("" + this.seed + (backward ? "-past" : "-future"));
    
        let res = 17;
    
        let day = 0;
    
        let buf = new ArrayBuffer(24);      // memory for 3x64bit (3x8byte = 24)
        let arrRnd = new Float64Array(buf); // array is a view on three 64bit entries
        let arr32 = new Uint32Array(buf);   // array is a view on 6 unsigned integers
            
        arrRnd[0] = random();   //fills array with random bits
        arrRnd[1] = random();
        arrRnd[2] = random();    
    
        while (day++ < reqDays)
        {
            let val = arr32[0] >>> 29; // first three bit (roll of 0-7 => 1d8)
    
            let mov = ((val > 6) ? -1 : ((val > 4) ? 1 : 0));
            
            res = (res + (reqDays < 0 ? -mov : mov)) % 32;
    
            if (res < 0) res = 32-res;
    
            arr32[0] = (arr32[0] << 3) + (arr32[1] >>> 29);
            arr32[1] = (arr32[1] << 3) + (arr32[2] >>> 29);
            arr32[2] = (arr32[2] << 3) + (arr32[3] >>> 29);
            arr32[3] = (arr32[3] << 3) + (arr32[4] >>> 29);
            arr32[4] = (arr32[4] << 3) + (arr32[5] >>> 29);
            arr32[5] = (arr32[5] << 3);
    
            if (day % 64 == 0)
            {
                arrRnd[0] = random();
                arrRnd[1] = random();
                arrRnd[2] = random();    
            }
        }
        return res;
    }        
}


exports.create = function() {
      console.log("in create!!");

    return new Weather();
}
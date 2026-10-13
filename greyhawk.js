
exports.Greyhawk = class Greyhawk 
{
    // static MSPERDAY = 86400000 * (365.25/364); // time runs faster in greyhaw
    static MSPERDAY = 86400000;        // actual 86104312,114989733059548254620123

    // static MSPERYEAR = Greyhawk.MSPERDAY * 364; // 31449600000
                                       // 31557600000

                                       // greyhawk year = 31341969609,856262833675564681725
                                       // greg year     = 31557600000

    //milliseconds since 1970.01.01:00.00.00 gregorian time
    constructor(id, ms) {
        this.id = id;
        this.ms = ms;
    }

    // zero considered 1st day
    getDay()
    {
        let x = this.ms / Greyhawk.MSPERDAY;

        return Math.floor(x) + (x < 0 ? 0 : 1);
    }

    getDayOfYear()
    {
        let x = this.ms / Greyhawk.MSPERDAY;

        return Math.floor(((x % 364) + 364) % 364) + 1;
    }

    getDate()
    {
        return getDayOfMonth();
    }

    getDayOfMonth()
    {
        let day = (this.getDayOfYear() % 91);

        if (day == 0) return 28;

        day = day < 8 ? day : (day - 7) % 28;

        return day == 0 ? 28 : day;
    }

    getSeason()
    {
        if (this.ms == null) return null;

        let days = this.getDayOfYear();

        return Math.ceil(days / 91);
    }

    getDayOfSeason()
    {
        if (this.ms == null) return null;

        let days = this.getDayOfYear() % 91;

        return days == 0 ? 91 : days;
    }

    getMonthOfSeason()
    {
        if (this.ms == null) return null;

        let day = this.getDayOfSeason();

        return day < 8 ? day : Math.ceil((day-7)/28) +1;
    }

    getFullYear()
    {
        let x = this.getDay() / 364;

        return x < 0 ? Math.floor(x) : Math.ceil(x) -1;
    }

    getMonth()
    {
        return this.getMonthNr() - 1;
    }

    getMonthNr()
    {
        if (this.ms == null) return null;

        let days = this.getDayOfYear();

        let month = Math.floor(days / 91) * 4;

        if (days % 91 != 0) month++;

        let qday = days % 91 - 7;

        while (qday > 0)
        {
            month++;

            qday -= 28;
        }
        return month;
    }

    sortableShort()
    {
        if (this.ms == null) return "[invalid date]";

        let y = this.getFullYear();
        
        let pre = y < 0 ? '-' : '+';

        return `${pre + ('0000' + Math.abs(y)).slice(-4)}${('0' + (this.getMonthNr())).slice(-2)}${('0' + this.getDayOfMonth()).slice(-2)}`;
    }

    short()
    {
        if (this.ms == null) return "no date set!";

        let y = this.getFullYear();
        
        let pre = y < 0 ? '-' : '';

        return ` [${pre + ('0000' + Math.abs(y)).slice(-4)}-${('0' + (this.getMonthNr())).slice(-2)}-${('0' + this.getDayOfMonth()).slice(-2)}]`;
    }

    toString() 
    {        
        if (this.ms == null) return "no date set!";

        let y = this.getFullYear();
        
        let pre = y < 0 ? '-' : '';

        let dtxt =  `${this.getDayOfMonth()}er ${this.nameOfMonth(this.getMonthNr())} des Jahres ${this.getFullYear()} Gemeiner Zählung`;        

        return dtxt + this.short();
    }

    getDate()
    {
        return this.ms ? this.getDayOfMonth() : null;
    }

    //returns number of days from 1970-01-01 to given date
    calcDays() 
    {
        return this.getDay();
    }
    
    moveBy(years, months, days)
    {
        let d = days;

        if (months != 0)
        {
            let neg = months < 0;

            d += (neg ? Math.ceil(months / 4) : Math.floor(months / 4)) * 91;

            let mos = this.getMonthOfSeason();

            let max = (neg ? (4 + mos - 2) : (5 - (mos % 4))) % 4;

            let delta = months % 4; // d is 1,2 or 3 => 0 may be ignored                

            d += delta * 28;

            if (Math.abs(delta) > max) d+= neg ? 21 : -21;
        }

        d += years * 364;

        this.ms += d * Greyhawk.MSPERDAY;
    }

    moveTo(year, month, day)
    {
        this.ms = 0;

        this.moveBy(year, month-1, day-1);
    }

    getMs()
    {
        return this.ms;
    }

    nameOfMonth(m)
    {
        this.mnths = [  'Needfest', 'Fireseek', 'Readying', 'Coldeven', 
                        'Growfest', 'Planting', 'Flocktime', 'Wealsun', 
                        'Richfest', 'Reaping', 'Goodmonth', 'Harvester', 
                        'Brewfest', 'Patchwall', 'Ready´Reat', 'Suns´Ebb'];

        return this.mnths[m-1];
    }

    nameOfDay(d)
    {
        this.days = ['Starday', 'Sunday', 'Moonday', 'Godsday', 'Waterday', 'Earthday', 'Freeday'];

        return this.days[d-1];
    }
}

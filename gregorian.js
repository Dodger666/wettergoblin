
exports.Gregorian = class Gregorian 
{
    //milliseconds since 1970.01.01:00.00.00
    constructor(id, ms) {
        this.id = id;
        this.date = new Date(ms);
    }

    sortableShort()
    {
        if (this.date == null) return "[invalid date]";

        let y = this.date.getFullYear();
        
        let pre = y < 0 ? '-' : '+';

        return `${pre + ('0000' + Math.abs(y)).slice(-4)}${('0' + (this.date.getMonth()+1)).slice(-2)}${('0' + this.date.getDate()).slice(-2)}`;
    }

    short()
    {
        return this.toString();
    }

    toString() 
    {
        return this.date ? `${('0000' + this.date.getFullYear()).slice(-4)}-${('0' + (this.date.getMonth()+1)).slice(-2)}-${('0' + this.date.getDate()).slice(-2)}` : "[invalid date]";
    }

    getMonth()
    {
        return this.date ? this.date.getMonth() : null;
    }

    getDate()
    {
        return this.date ? this.date.getDate() : null;
    }

    getDayOfYear(date)
    {
        return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    }

    //returns number of days from 1970-01-01 to given date
    calcDays() 
    {
        let ms = this.date.getTime();

        return Math.floor(ms/86400000) + (ms > 0 ? 1 : -1);
    }
    
    //not counting planar offset
    getDay()
    {
        return this.calcDays();
    }

    moveBy(years, months, days)
    {
        let old = new Date(this.date);

        this.date = new Date( old.getFullYear() + parseInt(param[1] || '0'),
                              old.getMonth() + parseInt(param[2] || '0'),
                              old.getDate() + parseInt(param[3] || '0'));
    }

    moveTo(year, month, day)
    {
        let utc = `${('0000' + year).slice(-4)}-${('00' + month).slice(-2)}-${('00' + day).slice(-2)}`;

        //let dy = param[1] < 100 ? param[1] - 1970 : param[1];

        this.date = new Date(utc);
    }

    getMs()
    {
        return this.date.getTime();
    }
}

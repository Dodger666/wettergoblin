
exports.Midgard = class Midgard 
{
    static MSPERDAY = 86400000;

    //milliseconds since 1970.01.01:00.00.00 gregorian time
    constructor(id, ms) {
        this.id = id;
        this.ms = ms;
    }

    // zero considered 1st day
    getDay()
    {
        let x = this.ms / Midgard.MSPERDAY;

        return Math.floor(x) + (x < 0 ? 0 : 1);
    }

    getDayOfYear()
    {
        let x = this.ms / Midgard.MSPERDAY;

        return Math.floor(((x % 364) + 364) % 364) + 1;
    }

    getDate()
    {
        return getDayOfMonth();
    }

    getDayOfMonth()
    {
        let day = (this.getDayOfYear() % 28);

        return day == 0 ? 28 : day;
    }

    getSeason()
    {
        if (this.ms == null) return null;

        let days = this.getDayOfYear();

        return min(Math.ceil(days / 42), 4);
    }

    getDayOfSeason()
    {
        if (this.ms == null) return null;

        let days = this.getDayOfYear() % 42;

        return days == 0 ? 42 : days;
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

        let month = Math.floor(days / 28);

        if (days % 28 != 0) month++;

        return month;
    }

    sortableShort() //--
    {
        if (this.ms == null) return "[invalid date]";

        let y = this.getFullYear();
        
        let pre = y < 0 ? '-' : '+';

        return `${pre + ('0000' + Math.abs(y)).slice(-4)}${('0' + (this.getMonthNr())).slice(-2)}${('0' + this.getDayOfMonth()).slice(-2)}`;
    }

    short() //--
    {
        if (this.ms == null) return "no date set!";

        let y = this.getFullYear();
        
        // 2425-13-28
        let pre = y < 0 ? '-' : '';

        return ` [${pre + ('0000' + Math.abs(y)).slice(-4)}-${('0' + (this.getMonthNr())).slice(-2)}-${('0' + this.getDayOfMonth()).slice(-2)}]`;
    }
    
    toString() //--
    {        
        if (this.ms == null) return "no date set!";

        let y = this.getFullYear();
        
        let pre = y < 0 ? 'vor' : 'nach';

        let d = this.getDayOfMonth();
        let day = this.nameOfDay(d);
        let tr = d > 13 ? "zweiten" : "ersten";
        
        if (day.includes('|')) day = day.split('|')[d > 14 ? 1 : 0];

        // Aonadach der zweiten Triadare im Luchsmond des Jahres 2425 nach Landung
        let dtxt =  `${day} der ${tr} Triadare im ${this.nameOfMonth(this.getMonthNr())} des Jahres ${this.getFullYear()} ${pre} Landung `;

        return dtxt + this.short();
    }

    getDate() //--
    {
        return this.ms ? this.getDayOfMonth() : null;
    }

    //returns number of days from 1970-01-01 to given date
    calcDays() 
    {
        return this.getDay();
    }
    
    moveBy(years, months, days) //--
    {
        let d = days + months*28 + years*364;

        this.ms += d * 86400000;
    }

    moveTo(year, month, day) //--
    {
        this.ms = 0;

        this.moveBy(year, month-1, day-1);
    }

    getMs() //--
    {
        return this.ms;
    }

    nameOfMonth(m) //*
    {
        this.mnths = [  'Bärenmond', 'Luchsmond', 'Einhornmond', 
                        'Nixenmond', 'Schlangenmond', 'Feenmond', 
                        'Hirschmond', 'Drachenmond', 'Kranichmond',
                        'Rabenmond', 'Trollmond', 'Draugmond', 'Wolfmond'];

        return this.mnths[m-1];
    }

    nameOfDay(d) //--
    {
        this.days = ['Ceaddag', 'Daradag', 'Triudag', 'Catrudag', 'Cuindag', 'Sedag', 'Seachdag',
                     'Oachdag', 'Naondag', 'Deachdag', 'Aonadag', 'Dosandag', 'Criochdag', 'Ljosdag Vollmond|Myrkdag Neumond'];

        return this.days[d-1];
    }
}

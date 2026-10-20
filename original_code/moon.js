console.log("... moon.js");

exports.Moon = class Moon {

    static emojis = [":full_moon:", ":waning_gibbous_moon:", ":last_quarter_moon:", ":waning_crescent_moon:", 
                     ":new_moon:", ":waxing_crescent_moon:", ":first_quarter_moon:", ":waxing_gibbous_moon:"];

    constructor(props)
    {
        this.props = props;
    }

    name = function() {return this.props.name;}

    // größerer offset schiebt den vollmond in die vergangenheit
    icon = function(days) {
        
        let pos = (days + this.props.offset_days) % this.props.cycle_days;
        
        if (pos < 0) pos += this.props.cycle_days; 
        
        let phase = this.props.cycle_days / Moon.emojis.length;
        
        return Moon.emojis[Math.floor(pos/phase)];
    }
}

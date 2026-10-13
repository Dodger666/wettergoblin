console.log("... table.js");

const seedrandom = require('seedrandom');

exports.Table = class Table
{
    //let sd = this.params.find(p => p.id == "seed");

    constructor(map)
    {
        this.random = seedrandom();

        this.map = map || new Map();

        this.max = 0;

        for (let [k, v] of this.map) {
            if (!v) this.map.set(k, 1);
            this.max += this.map.get(k);
        }
    }

    static rollDie = function(sides)
    {
        return Math.floor(sides * seedrandom()() + 1);
    }

    roll = function()
    {
        let roll = Math.floor(this.max * this.random());

        let prog = 0;        
        
        for (let [k, v] of this.map) {
            prog += v;
            if (roll < prog) return k;
        }
    }

    rollIdx = function() // returns entry index instead of value
    {
        let roll = Math.floor(this.max * this.random());

        let idx = 0;
        let prog = 0;        
        
        for (let [k, v] of this.map) {
            prog += v;            
            if (roll < prog) return idx;
            idx++;
        }
    }


    multiply = function(mod) {
        mod.forEach((v,k) => {
            if (this.map.has(k)) 
                this.map.set(k, v * this.map.get(k));
        });
        return this;
    }


    // constructor(keys, probs) 
    // {
    //     this.random = seedrandom();

    //     this.keys   = keys;
    //     this.probs  = probs;
        
    //     this.max = 0;
        
    //     if (probs)
    //         this.probs.forEach(e => this.max += e);
    //     else
    //         this.keys.forEach(e => this.max += 1); //if probs are undefined, each has the same chance
    // }

    // roll = function()
    // {
    //     let roll = Math.floor(this.max * this.random());

    //     let prog = 0;
    //     let result = 0;
        
    //     if (!this.probs) return this.keys[roll];

    //     this.probs.forEach(step => {
    //         prog += step;
    //         if (roll < prog) return result;
    //         result++;
    //     });

    //     return this.keys[result];
    // }
}

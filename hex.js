console.log("... hex.js");

exports.Hex = class Hex 
{   
    static PLAINS    = "plains";
    static HILLS     = "hills";
    static MOUNTS    = "mounts";
    static SEA       = "sea";

    static DESERT = "desert";
    static GRASS  = "grass";
    static WOODS  = "woods";
    static BOGS   = "bogs";

    static NE = 1;
    static SE = 2;
    static S  = 3;
    static SW = 4;
    static NW = 5;
    static N  = 6;

    constructor(x,y) 
    {        
        let t = Hex.toCube([x,y]);
        this.x = t[0];
        this.y = t[1];
        this.z = t[2];

        this.road  = []; //edges (1-6)
        this.river = []; //corners (1-6)
        this.riverEdges = []; //edges (1-6)
        this.riverRoute = false;
        this.roadRoute  = false;
        this.bridges = [0,0]; // bridges from&to #edge 
        
        this.elevation = Hex.PLAINS;
        this.vegetation = Hex.GRASS;
    }

                  //north       northeast   southeast   south       southwest   northwest
    static dirs = [ [ 0,-1, 1], [ 1,-1, 0], [ 1, 0,-1], [ 0, 1,-1], [-1, 1, 0], [-1, 0, 1] ];

    hasRiver = function(dir) //dir = edge
    {
        return this.river.includes(dir);
    }

    hasRoad = function(dir) //dir = edge
    {
        return this.road.includes(dir);
    }

    // returns 2d coords of hex
    fromCube = function()
    {
        let xx = this.x;
        let yy = this.y + (xx - (xx&1)) / 2;
        
        return [xx,yy];
    }

    static fromCube = function(xyz)
    {
        let xx = xyz[0];
        let yy = xyz[1] + (xx - (xx&1)) / 2;
        
        return [xx,yy];
    }

    static toCube = function(xy)
    {
        var x = xy[0];
        var y = xy[1] - (x - (x&1)) / 2;

        return [x,y,-x-y];
    }

    static distance(from, to)
    {
        var d = [to[0] - from[0], 
                 to[1] - from[1], 
                 to[2] - from[2]];

        return Math.max(Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2]));
    }

    static trEdge(edge)
    {
        return edge + (3 * Math.pow(-1, Math.floor((edge-1)/3)));
    }


    // xy is in odd-q coords
    distance = function(xy)
    {
        let t = Hex.toCube(xy);

        return Math.max(Math.abs(this.x - t[0]), 
                        Math.abs(this.y - t[1]), 
                        Math.abs(this.z - t[2]));
    }

    static same = function(c1, c2)
    {
        return (c1[0] == c2[0]) && (c1[1] == c2[1]) && (c1[2] == c2[2]);
    }

    static vector = function(from, to)
    {
        let tto = (to instanceof Hex) ? [to.x, to.y, to.z] : [to[0], to[1], to[2]];
        let tfrom = (from instanceof Hex) ? [from.x, from.y, from.z] : [from[0], from[1], from[2]];

        return [tto[0] - tfrom[0], tto[1] - tfrom[1], tto[2] - tfrom[2]];
    }

    // given the entry vector, the result contains disallowed 
    // exit vectors,those that would mean a sharp turn.
    static sharpTurns = function(vec)
    {
        let x = vec[0]; 
        let y = vec[1]; 
        let z = vec[2];

        return [[y,z,x],[z,x,y],[-x,-y,-z]];
    }
        
    // returns neighbors of pos that can be entered without a sharp turn
    static allTurns = function(pos, vFrom)
    {
        let st = vFrom ? Hex.sharpTurns(vFrom) : null;

        let res = [];
        
        let turns = Hex.dirs;
        
        if (st) turns = turns.filter(d => !(Hex.same(st[0],d) || Hex.same(st[1],d) || Hex.same(st[2],d)));

        turns.forEach(dir => res.push([ pos[0]+dir[0], pos[1]+dir[1], pos[2]+dir[2] ]));

        return res;
    }

    neighbor = function(edge)
    {
        return this.neighbors()[edge % 6];
    }

    neighbors = function()
    {
        return [[this.x  , this.y-1, this.z+1], // n
                [this.x+1, this.y-1, this.z  ], // ne 
                [this.x+1, this.y  , this.z-1], // se
                [this.x  , this.y+1, this.z-1], // s
                [this.x-1, this.y+1, this.z  ], // sw
                [this.x-1, this.y  , this.z+1]];// nw
    }

    tileType = function()
    {
        if (this.elevation == Hex.MOUNTS)  return "mounts";
        if (this.elevation == Hex.HILLS)   return "hills";
        if (this.elevation == Hex.SEA)     return "sea";

        if (this.vegetation == Hex.WOODS)  return "woods";
        if (this.vegetation == Hex.BOGS)   return "bogs";
        if (this.vegetation == Hex.DESERT) return "desert";
        
        return "plains";
    }
}

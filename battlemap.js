console.log("... battlemap.js");

const {Hex} = require('./hex.js');
const {MapSymbols} = require('./mapsymbols.js');

const seedrandom = require('seedrandom');

const { createSVGWindow } = require('svgdom');
const { SVG, registerWindow } = require('@svgdotjs/svg.js');

const win = createSVGWindow();
const doc = win.document;

registerWindow(win, doc);

exports.Battlemap = class Battlemap 
{
    static CLOCK = 1;
    static COUNTERCLOCK = -1;

    static vectors = {"ne":1,"se":2,"s":3,"sw":4,"nw":5,"n":6};
    static vecq = {"ne":[1,-1,0],"se":[1,0,-1],"s":[0,1,-1],"sw":[-1,1,0],"nw":[-1,0,1],"n":[0,-1,1]};

    static keywords  = ["hills", "mounts", "woods", "bogs", "sea", "road", "river", "village", "fort", "city", "seed", "nocoords", "cubecoords"];

    //in cube coords
    static mmask = {"1" : function(xyz) { if (xyz[0] <  2 || xyz[0] >  4) return false;
                                          if (xyz[1] < -1 || xyz[1] >  0) return false;
                                          if (xyz[2] < -3 || xyz[2] > -1) return false; 
                                          return true;},
                    "2" : function(xyz) { if (xyz[0] <  2 || xyz[0] >  4) return false;
                                          if (xyz[1] < -1 || xyz[1] >  1) return false;
                                          if (xyz[2] < -5 || xyz[2] > -1) return false; 
                                          return true;},
                    "3" : function(xyz) { if (xyz[0] <  1 || xyz[0] >  3) return false;
                                          if (xyz[1] < -1 || xyz[1] >  3) return false;
                                          if (xyz[2] < -5 || xyz[2] > -1) return false; 
                                          return true;}};
    static cstart  = [2,-1,-1];
    static cfinish = {"1" : [4,-1,-3], "2" : [4,1,-5], "3" : [2,3,-5]}; // cube coords plus edge number (1-6)    
    static vstart  = [2,-2,0];                                           // entry vector of start hex
    static vfinish = {"1" : [5,-2,-3], "2" : [5,1,-6], "3" : [2,4,-6]}; // exit vectors of destination hexes

    // returns array of neighboring corners in vector [vec] direction
    static vcorners = function(vec)         { if (Hex.same(vec, Battlemap.vecq.ne)) return [1,2];  // returns corner points of a given vector edge
                                              if (Hex.same(vec, Battlemap.vecq.se)) return [2,3];
                                              if (Hex.same(vec, Battlemap.vecq.s)) return [3,4];
                                              if (Hex.same(vec, Battlemap.vecq.sw)) return [4,5];
                                              if (Hex.same(vec, Battlemap.vecq.nw)) return [5,6];
                                              if (Hex.same(vec, Battlemap.vecq.n)) return [6,1];};

    static vedges = function(crn)           { if (crn[1] > crn[0]) return vecq.values()[crn[1]-1];}
                                              
    // translate corner [crn] into corner of neighboring hex to which vector [vec] points to
    static trcorner = function(vec, crn)    { let idx = (Battlemap.vcorners(vec).indexOf(crn) + 1) % 2;
                                              return Battlemap.vcorners([-vec[0], -vec[1], -vec[2]])[idx];}

    rollStartCorner = function()            { return (this.roll(2) == 2) ? 1 : 6; }

    rollFinishCorner = function(fHex)       { let options = [6,1];
                                              if (Hex.same(fHex, Battlemap.cfinish[2])) options = [2,3,4];
                                              if (Hex.same(fHex, Battlemap.cfinish[3])) options = [3,4];
                                              return options[this.roll(options.length)-1];}

    static cornerStep = function(from, dir) { let res = from + dir;
                                              if (res > 6) res = res-6;
                                              if (res < 1) res = res+6;
                                              return res;}
    constructor(cl) 
    {
        this.hlp = null;
        this.helper = function(rad) {
            let r = rad | 40;
            if (this.hlp != null) return this.hlp;
            console.log("... creating helper");
            this.hlp = {"radius" : r,
                        "b"  : Math.round(Math.sin(Math.PI/3)*r),
                        "b2" : Math.round(Math.sin(Math.PI/3)*2*r),
                        "k"  : Math.round(Math.cos(Math.PI/3)*r),              //using offset for centrepoints to have hex 0|0 in view
                        "k2" : Math.round(Math.cos(Math.PI/3)*2*r),            //x-offset   y-offset
                        "c"  : (0.5 * (Math.round(Math.cos(Math.PI/3)*r) + r)),//x offset from centre to edge-centre
                        "d"  : (0.5 * Math.round(Math.sin(Math.PI/3)*r)),      //y offset from centre to edge-centre

                        "centrePt" : function(x,y) { let yy = (y == undefined) ? x[1] : y;
                                                     let xx = (y == undefined) ? x[0] : x;
                                                     return [xx * (this.radius + this.k) + this.radius, yy * (this.b2+1) + ((xx % 2) ? this.b : 0)+this.b]; },

                        "cornerPt" : function(c) { switch (c) { case 1: return [ this.k, -this.b];
                                                                case 2: return [ this.radius,  0];
                                                                case 3: return [ this.k,  this.b];
                                                                case 4: return [-this.k,  this.b];
                                                                case 5: return [-this.radius,0];
                                                                case 6: return [-this.k, -this.b]; } },
                        
                        "cornerCoords" : function(h,c) {    let hp = h.centrePt(Hex.fromCube(h));
                                                            let cp = h.cornerPt(c);
                                                            return [hp[0]+cp[0],hp[1]+cp[1]];},

                        "edgeCentre" : function(c) { switch (c) { case 1: return [ this.c, -this.d];
                                                                  case 2: return [ this.c,  this.d];
                                                                  case 3: return [ 0,       this.b];
                                                                  case 4: return [-this.c,  this.d];
                                                                  case 5: return [-this.c, -this.d];
                                                                  case 6: return [ 0,      -this.b]; } }};
            return this.hlp;                                                                
        };

        this.params = this.parseParams(cl);

        let sd = this.params.find(p => p.id == "seed");
        
        this.random = sd ? seedrandom(sd.id + sd.from.toString() + sd.to.toString()) : seedrandom();

        this.routes = {};

        this.map = [[null  /*0,0*/, new Hex(0,1), new Hex(0,2), new Hex(0,3), null  /*0,4*/],
                    [new Hex(1,0) , new Hex(1,1), new Hex(1,2), new Hex(1,3), null  /*1,4*/],
                    [new Hex(2,0) , new Hex(2,1), new Hex(2,2), new Hex(2,3), new Hex(2,4) ],
                    [new Hex(3,0) , new Hex(3,1), new Hex(3,2), new Hex(3,3), null  /*3,4*/],
                    [null  /*4,0*/, new Hex(4,1), new Hex(4,2), new Hex(4,3), null  /*4,4*/] ]; 

        this.fillMap();
    }

    fillMap = function(map) // 2d array of Hex (might be null)
    {
        this.params.filter(e => e.id == "river").forEach(i => this.placeRiver(i.from, i.to));
        this.params.filter(e => e.id == "road").forEach(i => this.placeRoad(i.from, i.to));

        this.params.filter(e => e.id == Hex.MOUNTS).forEach(i => this.placeTerrain(parseInt(i.from + i.to), Hex.MOUNTS, null     , this.mountainProbs));
        this.params.filter(e => e.id == Hex.HILLS ).forEach(i => this.placeTerrain(parseInt(i.from + i.to), Hex.HILLS , null     , this.hillProbs));
        this.params.filter(e => e.id == Hex.BOGS  ).forEach(i => this.placeTerrain(parseInt(i.from + i.to), null      , Hex.BOGS , this.bogsProbs));
        this.params.filter(e => e.id == Hex.WOODS ).forEach(i => this.placeTerrain(parseInt(i.from + i.to), null      , Hex.WOODS, this.woodsProbs));
    }

    getHex = function(x,y,z)
    {
        var pt1 = (arguments.length == 3) ? Hex.fromCube([x,y,z]) : null;

        if (!pt1 && arguments.length == 2) pt1 = [x,y];

        if (!pt1 && (x instanceof Array)) pt1 = x.length > 2 ? Hex.fromCube(x) : x;
       
        if (!pt1) return null;

        let res = null;

        if (pt1[0] > -1 && pt1[0] < this.map.length)
            if (pt1[1] > -1 && pt1[1] < this.map[pt1[0]].length)
                res = this.map[pt1[0]][pt1[1]];

        return res ? res : new Hex(pt1[0], pt1[1]);
    }

    parseParams = function(cl)
    {
        console.log(`parsing params: ${str}`);

        if (!str.trim()) return {res : 'none'};

        var pieces = str.split(/\s+/);

        var res = [];

        pieces.forEach(l => {

            var m = l.match(/(\D+)(\d)?(\d)?/);

            if (m && m[1] && Battlemap.keywords.includes(m[1].toLowerCase()))
            {
                res.push({"id": m[1], "from": m[2], "to" : m[3]});
            } 
            else console.log(`unknown param: ${l}`);
        });        

        return res;    
    }

    addHex = function(x,y)
    {
        let hx = new Hex(x,y);
        this.map[x][y] = hx
        return hx;
    }

    //             .........
    //            .        |.
    //           .         |b.     b=sin60*r
    //          .       ---|  .
    //           .       k   .     k=cos60*r
    //            .         .
    //             .........
    drawHex = function(svg, x, y)
    {
        let h = this.helper(); // usually k=20, b=35, r=40
    
        let xy = h.centrePt(x,y);

        let hex = this.map[x][y];

        var desc = `M ${xy[0]} ${xy[1]} mk -b lk b -k b -k2 0 -k -b k -b k2 0 z`.replace(/k2/g, h.k2.toString())
                                                                                .replace(/b/g, h.b.toString())
                                                                                .replace(/k/g, h.k.toString());                   

        let tile = MapSymbols.tiles[hex.tileType()];
        
        // let elevation = MapSymbols.tiles[hex.tileType()];
        // let vegetation = MapSymbols.tiles[hex.tileType()];

        let fill = tile.filling(svg);        

        svg.path(desc).fill(fill).stroke({ color: '#000000', width: 1});

        let drEle = MapSymbols.tiles.drawingOf(svg, hex.elevation);
        let drVeg = MapSymbols.tiles.drawingOf(svg, hex.vegetation);

        if (drEle.drawing) svg.use(drEle.drawing).center(xy[0]-drEle.width/2, xy[1]-drEle.height/2);
        if (drVeg.drawing) svg.use(drVeg.drawing).center(xy[0]-drVeg.width/2, xy[1]-drVeg.height/2);
    }

    drawSmallMapHexes = function(draw)
    {
        draw.clear();

        [      [0,1],[0,2],[0,3],
            [1,0],[1,1],[1,2],[1,3],
         [2,0],[2,1],[2,2],[2,3],[2,4],
            [3,0],[3,1],[3,2],[3,3],
               [4,1],[4,2],[4,3]
            
        ].forEach(xy => this.drawHex(draw, xy[0], xy[1]));

        return draw;
    }

    roll = function(sides)
    {
        return Math.floor(sides * this.random())+1;
    }

    validEdge = function(edge)
    {
        return ((edge > 0) && (edge < 7));
    }

    // determine edge distance (north to southeast is two, north to northwest is minus one)
    edgeDistance = function(from, to)
    {
        let res = Math.abs(to - from);
        
        return (res > 3) ? Math.abs(res - 6) : res;
    }

    // determine corner distance (northeast to southeast is two, northeast to northwest is minus one)
    cornerDistance = function(from, to)
    {
        let res = Math.abs(to - from);
        
        return (res > 3) ? Math.abs(res - 6) : res;
    }

    inCornerPath = function(sub, path)
    {
        let i1 = path.indexOf(sub[0]);
        let i2 = path.indexOf(sub[1]);

        return (i1>0 && i2>0 && Math.abs(i1-i2) < 2);
    }

    hexHasBridge = function(dir, hex) 
    {        
        if (hex && hex.road.includes(dir))
        {
            if (hex.riverEdges.includes(dir)) return true;

            // let ld = dir == 6 ? 1 : dir+1;
            // if (this.inCornerPath([dir,ld],hex.river)) return true;
            
            let nei = this.getHex(hex.neighbor(dir));
            //let trdir = Hex.trEdge(dir);
            //let ltd = trdir == 6 ? 1 : trdir+1;
            
            if (nei.riverEdges.includes(Hex.trEdge(dir))) return true;
            //if (this.inCornerPath([trdir,ltd],nei.river)) return true;
        }   
        return false;     
    }

    findPath = function(from, to, mask)
    {                     
        let pos = from;
        
        let cres = [pos];
        let excl = [];

        let move = null;

        while (!Hex.same(pos, to))
        {
            let dist = Hex.distance(pos, to);

            let sel = Hex.allTurns(pos, move)                                       // all neighbors reachable without sharp turn
                         .filter(mask)                                              // filter by mask                                        
                         .filter(h => excl.find(e => Hex.same(e,h)) == undefined)   // exclude deadlocks
                         .filter(h => cres.find(e => Hex.same(e,h)) == undefined)   // none may appear twice
                         .filter(h => Hex.distance(h,to) <= dist);                  // at least not farther away

            if (sel.length < 1) 
            {
                cres = cres.slice(0,-1);
                pos = cres[cres.length-1]; 
                move = cres.length > 1 ? Hex.vector(cres[cres.length-2],pos) : null;                
            }
            else
            {
                pos = sel[this.roll(sel.length)-1];                                // equal chance for all            
                cres.push(pos);    
            }
            move = cres.length < 2 ? null : Hex.vector(cres[cres.length-2],pos);        // store last entry vector    
        }

        return cres;
    }

    rotate = function(chexes, steps) // rotate around centre (which is 2,1,-3)
    {
        let pre = steps % 2 == 0 ? 1 : -1;
        let res = [];        
        chexes.forEach(h => {
            let h2 = [h[0]-2,h[1]-1,h[2]+3];                                    //substract rotation centre
                h2 = [pre*h2[(0+steps)%3],pre*h2[(1+steps)%3],pre*h2[(2+steps)%3]];   //rotate clockwise
            res.push([h2[0]+2,h2[1]+1,h2[2]-3]);                                  //re-add rotation centre
        });
        return res;
    }

    findHexPath = function(from, to)
    {
        let dist = this.edgeDistance(from, to);
        let start = Battlemap.cstart;
        let finish = Battlemap.cfinish[dist];

        let res = this.findPath(start, finish, Battlemap.mmask[dist]);

        return res;
    }

    midpoint = function(from, to)
    {
        return [0.0 + from[0] + (to[0]-from[0])/2, 0.0 + from[1] + (to[1]-from[1])/2];
    }

    pt2str = function(pt) {return `${pt[0]} ${pt[1]} `;}

    drawOnHex = function(path, draw)
    {   
        let h = this.helper();        
        let M = this.midpoint(h.centrePt(Hex.fromCube(path[0])), h.centrePt(Hex.fromCube(path[1])));

        let desc = `M ${M[0]} ${M[1]} S `;
        
        let last = null;

        for (var p = 1; p < path.length; p++)
        {   
            M = h.centrePt(Hex.fromCube(path[p]));                        

            let next = [M[0],M[1]];

            if (last) desc += this.pt2str(this.midpoint(last, next));
            
            desc += this.pt2str(next);

            last = next;            
        }        

        draw.path(desc).fill('none').stroke({ color: "#852", width: 7});
    }

    drawRoad = function(route, draw)
    {
        if (route) this.drawOnHex(route, draw);
    }

    calcAngle = function(tf)
    {
        // to, from 
        return (tf[1]-tf[0] > 3) ? tf[1]-1 : tf[0]-1;
    }

    placeRoad = function(from, to)
    {
        if (!this.validEdge(from) || !this.validEdge(to)) return null;

        let tf = from > to ? [to,from] : [from,to];

        let path = this.findHexPath(tf[0], tf[1]);

        path.unshift(Battlemap.vstart);                            // add entry hex from off-the-map
        path.push(Battlemap.vfinish[this.edgeDistance(tf[0], tf[1])]); // add exit hex from off-the-map  

        path = this.rotate(path, this.calcAngle(tf));

        this.routes["road"] = path;     // array if triple-coords
    
        let prev = null;
        path.forEach(h => {
            let hex = this.getHex(h[0], h[1], h[2]);
            hex.roadRoute = true;

            if (prev) {
                let vec = Hex.vector(prev, hex);
                hex.road[0] = Battlemap.vcorners([-vec[0], -vec[1], -vec[2]])[0];
                prev.road[1] = Battlemap.vcorners(vec)[0];
            } else {
                hex.road[0] = from;
            }
            
            prev = hex;
        });
        
        this.placeBridges(path);
    }

    placeRiver = function(from, to)
    {
        if (!this.validEdge(from) || !this.validEdge(to)) return null;

        let tf = from > to ? [to,from] : [from,to];
        let path = this.findHexPath(tf[0], tf[1]);

        path.unshift(Battlemap.vstart);                            // add entry hex from off-the-map
        path.push(Battlemap.vfinish[this.edgeDistance(tf[0], tf[1])]); // add exit hex from off-the-map
        
        path = this.rotate(path, this.calcAngle(tf));
        
        this.routes["river"] = this.findCornerPath(path);
        this.routes["river"].forEach(h => {
            let hex = this.getHex(h[0], h[1], h[2]);
            hex.river = h[3];
            hex.riverRoute = true;
            let crn1 = null;
            h[3].forEach(crn2 => {
                if (crn1 != null)
                {
                    let clockwise = [1,-5].includes(crn2 - crn1);

                    let edge = clockwise ? crn1 : crn2;
                    hex.riverEdges.push(edge);
                    let nc = hex.neighbor(edge);    

                    if (this.routes["river"].find(f => Hex.same([f[0],f[1],f[2]], nc)) === undefined)
                    {
                        let neighbor = this.getHex(nc);
                        let vec = Hex.vector(hex, neighbor);
                        
                        neighbor.river.push(Battlemap.trcorner(vec, crn1));
                        neighbor.river.push(Battlemap.trcorner(vec, crn2));                    
                        neighbor.riverEdges.push(Battlemap.trcorner(vec, clockwise ? crn2 : crn1));
                    }
                }
                crn1 = crn2;
            });
        });
    }

    placeBridges = function(path)
    {
        for (let coords of path)
        {
            let hex = this.getHex(coords);

            let from = hex.road[0];
            let to = hex.road[1];

            hex.bridges[0] = this.hexHasBridge(from) ? from : 0;
            hex.bridges[1] = this.hexHasBridge(to) ? to : 0;;
        }
    }

    localPath = function(from, to, turn) // corner path within a hex field
    {
        if (from == 0) return [to];

        let dist = to - from; // clockwise distance
        
        let delta = dist < 0 ? -1 : 1;        

        if (Math.abs(dist) == 3) delta = Math.pow(-1, this.roll(2)); // random direction

        if (Math.abs(dist) > 3) delta *= -1; // choose shorter direction
        
        if (Math.abs(dist) == 4 && this.roll(2) == 1) delta *= -1; // small chance (25%)for the longer path to win 

        if (turn != undefined) delta = turn; // if turn required, it overrides previous

        let res = [from];
        
        while (res[res.length-1] != to) res.push((res[res.length-1] + 5 + delta) % 6 + 1);
        
        return res;
    }

    needTurn = function(pre, hex) // checks wether edgepath would reverse in direction and take a common edge twice, 
    {                             // if return value isn't undefined it returns the required direction 
        if (pre)
        {
            let len = pre[3].length;

            if (len > 1)
            {
                let idx = Battlemap.vcorners(Hex.vector(pre, hex)).indexOf(pre[3][len-1]);

                let clockwise = [1,-5].includes(pre[3][len-1] - pre[3][len-2]);

                if ((idx == 1) && clockwise) return Battlemap.COUNTERCLOCK;
                if ((idx == 0) && !clockwise) return Battlemap.CLOCK;
                return undefined;
            }
        }
        return undefined;
    }

    findCornerPath = function(hexPath) //path is an array of cube coords
    {
        let corners = []; //array of cube coords + cornerpath e.g.: [2,1,-3,[3,4,5]] => centre hex, se to sw to w corners

        //list of corner paths (arrays of corners) per hex
        for (var i = 0; i < hexPath.length-1; i++)
        {
                let hex = hexPath[i];
                let pre = i > 0 ? corners[i-1] : null;

                var from = pre ? Battlemap.trcorner(Hex.vector(pre, hex), pre[3][pre[3].length-1]) : 0;                
                let alt  = Battlemap.vcorners(Hex.vector(hex, hexPath[i+1]));
                
                //let to   = this.cornerDistance(from, alt[0]) < this.cornerDistance(from, alt[1]) ? alt[0] : alt[1];
                let to   = alt[this.roll(2)-1];

                //corners.push([hex[0],hex[1],hex[2],this.localPath(from, to, )]);
                corners.push([hex[0],hex[1],hex[2],this.localPath(from, to, this.needTurn(pre, hex))]);
        }
        return corners;
    }

    riverString = function(corners)
    {
        let h = this.helper();

        let desc = "";
        let last = null;

        for (let i in corners)
        {
            let hx = corners[i];

            let hp = h.centrePt(Hex.fromCube(hx));

            for (let j in hx[3])
            {
                let cp = h.cornerPt(hx[3][j]);

                let next = [hp[0]+cp[0], hp[1]+cp[1]];
                
                if (j == 0)
                {
                    if (desc.length < 1)
                        desc = `M ${this.pt2str(next)} S `;
                }
                else
                {
                    desc += this.pt2str(last ? this.midpoint(last, next) : next);
                    desc += this.pt2str(next);
                }

                last = next;
            }
        }
        return desc;
    }


    drawRiver = function(corners, draw)
    {
        let str = this.riverString(corners);
        
        console.log("river command: " + str);

        draw.path(str).fill('none').stroke({ color: "#00f", width: 10});
    }

    drawRoadsAndRivers = function(draw)
    {
        this.drawRiver(this.routes["river"], draw);
        this.drawRoad(this.routes["road"], draw);
        this.drawBridges(draw);
    }

    drawSymbol = function(id, x, y, draw)
    {
        let bg = MapSymbols.getTile(id, draw);

        let h = this.helper();
        let mv = h.centrePt(x,y);

        draw.use(bg.id).center(mv[0]-bg.width/2, mv[1]-bg.height/2);
        
        return draw;
    }

    drawBridge = function(hex, edge, draw)
    {
        let h = this.helper(); // usually k=20, b=35, r=40
        let pt0 = h.centrePt(hex.fromCube());
        let pt1 = h.edgeCentre(edge);
        let pt2 = this.midpoint([0,0], pt1);
       
        let desc = `M ${this.pt2str(pt0)} m ${this.pt2str(pt2)} l ${this.pt2str(h.edgeCentre(edge))}`;

        draw.path(desc).fill("none").stroke({ color: '#555555', width: 11});
        draw.path(desc).fill("none").stroke({ color: '#999999', width: 8});                    
    }

    drawBridges = function(draw)
    {
        let road = this.routes["road"];

        if (road) road.forEach(hex => {
            
            let edges = new Set();
            
            edges.add(1).add(2).add(3);

            if (hex.x == 0) edges.add(4).add(5);
            if (hex.y == 3) edges.add(4);
            if (hex.y == -1) edges.add(6);
            if (hex.z == -1) edges.add(5).add(6);

            for (let edge of edges)
            {
                if (this.hexHasBridge(edge, this.getHex(hex))) this.drawBridge(this.getHex(hex), edge, draw);
            }
        });
    }

    drawCoords = function(draw)
    {
        this.map.forEach(col => col.forEach(hex =>{
            if (!hex) return;
            let xy = hex.fromCube();
            let h = this.helper();
            let mv = h.centrePt(xy[0],xy[1]);
            draw.text(`${xy[0]}|${xy[1]}`).move(mv[0],mv[1]+15).font({family: 'monospace', size: '6', anchor: 'middle', fill: '#000' })
        }));       
    }

    drawCubeCoords = function(draw)
    {
        this.map.forEach(col => col.forEach(hex =>{
            if (!hex) return;
            let xy = hex.fromCube();
            let h = this.helper();
            let mv = h.centrePt(xy[0],xy[1]);
            draw.text(`${hex.x}|${hex.y}|${hex.z}`).move(mv[0],mv[1]-54).font({family: 'monospace', size: '6', anchor: 'middle', fill: '#000' })
        }));       
    }

    drawMap = function()
    {
        const draw = SVG(doc.documentElement);

        //let draw = SVG(document.documentElement).size(331, 361);
        //let draw = SVG(); //.size(331, 361);

        this.drawSmallMapHexes(draw);
        
        if (!this.params.find(p => p.id == "nocoords")) 
            this.drawCoords(draw);

        if (this.params.find(p => p.id == "cubecoords")) 
            this.drawCubeCoords(draw);
        
        this.drawRoadsAndRivers(draw);                    

        return draw.svg(); 
    } 

    addElevation = function(type, inPiece, outPiece) 
    {
        console.log("addElevation, not yet implemented!");
    }

    addVegetation = function(type, inPiece, outPiece) 
    {
        console.log("addVegetation, not yet implemented!");
    }

    addConstruction = function(type, inPiece, outPiece) 
    {
        console.log("addConstruction, not yet implemented!");
    }

    startHex = function(edge)
    {
        switch (edge)
        {
            case 1: return [2,0];
            case 2: return [4,1];
            case 3: return [4,3];
            case 4: return [2,4];
            case 5: return [0,3];
            case 6: return [0,1];
        }
    }

    centreHex = function(edge)
    {
        switch (edge)
        {
            case 1: return [3,0];
            case 2: return [4,2];
            case 3: return [3,3];
            case 4: return [1,3];
            case 5: return [0,2];
            case 6: return [1,0];
        }
    }

    // returns delta coords from hex centre
    hexPointCoords = function(point)
    {
        switch (point)
        {
            case 1: return [ this.k, -this.b];
            case 2: return [ this.r,  0     ];
            case 3: return [ this.k,  this.b];
            case 4: return [-this.k,  this.b];
            case 5: return [-this.r,  0     ];
            case 6: return [-this.k, -this.b];
        }
    }

    // logHexes = function()
    // {
    //     let i = 0;
    //     this.map.forEach(v => {
    //         v.forEach(h => {
    //             if (h) {
    //                 let xy = h.fromCube();
    //                 console.log(`hex (#${i} = ${xy[0]}|${xy[1]}) terrain: ${h.terrain ? h.terrain.toString() : ' -'}`);
    //             }
    //         })
    //     });
    // }

    // placeTile = function(id, ff, tt)
    // {
    //     this.map[ff][tt].terrain = id;
    // }

    listCandidates = function(calcProb)
    {        
        let res = [0,[]];

        for (let col of this.map)
        {
            for (let hex of col)
            {
                if (hex)
                {
                    let prob = calcProb(hex);

                    if (prob > 0)
                    {
                        res[0] += prob;

                        res[1].push([prob, hex]);
                    }
                }
            }
        }
        return res;
    }

    rollEntry = function(die, probs)
    {
        let start = 0;
        let pos = this.roll(die);

        for (let prob of probs)
        {
            start += prob[0];
            
            if (start >= pos) return prob[1];
        }
    }

    mountainProbs = function(hex)
    {
        if (!hex) return 0;
        
        if (hex.elevation != Hex.PLAINS || hex.vegetation != Hex.GRASS) return 0;
        
        if (hex.riverRoute) return 0;

        let edge = 7;

        while (edge-- > 1)
        {
            let nh = Hex.fromCube(hex.neighbor(edge));

            if (nh.elevation == Hex.HILLS) return 3;

            if (nh.elevation == Hex.MOUNTS) return 4;
        }
        return 1;
    }

    hillProbs = function(hex)
    {
        if (!hex) return 0;

        if (hex.elevation != Hex.PLAINS) return 0;
        
        if (hex.riverRoute) return 0;

        let edge = 7;

        while (edge-- > 1)
        {
            let nh = Hex.fromCube(hex.neighbor(edge));

            if (nh.elevation == Hex.HILLS) return 2;

            if (nh.elevation == Hex.MOUNTAINS) return 4;
        }
        return 1;
    }

    bogsProbs = function(hex)
    {
        if (!hex) return 0;

        if (hex.vegetation != Hex.GRASS) return 0;

        if (hex.elevation != Hex.PLAINS) return 0;
        
        if (hex.riverRoute) return 4;

        let edge = 7;

        while (edge-- > 1)
        {
            let nh = Hex.fromCube(hex.neighbor(edge));

            if (nh.elevation == Hex.BOGS) return 3;
        }
        return 1;
    }

    woodsProbs = function(hex)
    {
        if (!hex) return 0;

        let res = 0;

        if (hex.vegetation != Hex.GRASS) return res;

        if (hex.elevation == Hex.PLAINS || hex.elevation == Hex.HILLS)
        {
            res = 1;

            let edge = 7;

            while (edge-- > 1)
            {
                let nh = Hex.fromCube(hex.neighbor(edge));
    
                if (nh.vegetation == Hex.WOODS) res += 2;
            }    
            return res;
        }

        return 0;
    }

    placeTerrain = function(ff, elevation, vegetation, probability)
    {
        while (ff-- > 0)
        {
            let probs = this.listCandidates(probability);
            
            if (probs[0] == 0) return; //no possible tile

            let hex = this.rollEntry(probs[0], probs[1]);

            if (elevation) hex.elevation = elevation;
            if (vegetation) hex.vegetation = vegetation;
        }
    }
}

exports.create = function(x,y) 
{
    console.log("creating battlemap!");

  return new Battlemap(x,y);
}

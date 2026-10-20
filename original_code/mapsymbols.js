console.log("... mapsymbols.js");

const Files = require('fs');
const { createWindow } = require('svgdom')

exports.MapSymbols = class MapSymbols 
{
    constructor()
    {
    }

    static tiles = {
        plains : {filename: null                  , color: "#99ee99", filling: function(draw) {return "#99ee99";}},
        mounts : {filename: "./images/berg7.svg"  , color: "#909090", filling: function(draw) {return MapSymbols.tiles.fillingOf(draw, 'mounts');}},
        hills  : {filename: "./images/huegel3.svg", color: "#b57724", filling: function(draw) {return MapSymbols.tiles.fillingOf(draw, 'hills');}},
        bogs   : {filename: "./images/bogs3.svg"  , color: "#a2a000", filling: function(draw) {return MapSymbols.tiles.fillingOf(draw, 'bogs');}},
        woods  : {filename: "./images/baum2.svg"  , color: "#0d5004", filling: function(draw) {return MapSymbols.tiles.fillingOf(draw, 'woods');}},
        grass  : {filename: null                  , color: "#99ee99", filling: function(draw) {return "#99ee99";}},

        drawingOf : function(draw, type) {
            
            let res = MapSymbols.tiles[type];

            if (res.drawing === undefined) 
            {
                res.drawing = null;
                    
                let file = res.filename;

                if (file != null)
                {
                    res.drawing = type;

                    res.svg = Files.readFileSync(file).toString();

                    let dd = draw.defs().svg(res.svg);
                    let bbox = dd.findOne(`#${type}`).bbox();
                    
                    res.width = bbox.width;
                    res.height = bbox.height;
                }
            }
            else if (draw.defs().findOne(`#${type}`) == null)
            {
                draw.defs().svg(res.svg);
            }
            return res;
        },

        fillingOf : function(draw, type) {
            
            let res = MapSymbols.tiles[type];

            //if (res.gradId == undefined) 
            if (draw.defs().findOne(`#${res.gradId}`) == null)
            {
                res.gradId = draw.gradient('radial', (add) => {
                    add.stop(0.01, res.color); 
                    add.stop(1.00, MapSymbols.tiles.grass.color);
                });
            }

            return MapSymbols.tiles[type].gradId;
        }
    }

    static getTile = function(id, draw)
    {
        let res = MapSymbols.tiles[id];

        if (res.id == undefined)
        {           
            res.grad = res.filling(draw);

            let file = MapSymbols.tiles[id].filename;

            if (file != null)
            {
                let def = draw.defs().svg(Files.readFileSync(file).toString());            
                let bbox = def.select(`#${id}`).bbox();

                res.width = bbox.width;
                res.height= bbox.height;
            }
            res.id = id;
        }
        return res;
    }
}
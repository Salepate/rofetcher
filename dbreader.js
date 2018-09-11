const fs = require('fs');
const mongodb = require('mongodb');
const auth = require('./auth.json');

(function dbReader(reader)
{
    let _InitCallback = null;
    let _itemDescs = {};
    let _itemCache = {};

    reader.getItem = function (itemID)
    {
        if ( itemID in _itemDescs)
        {
            itemDesc = _itemDescs[itemID];
            return itemDesc;
        }
        else
            return `unknown item index ${itemID}`;
    }

    reader.findItem = function(itemName, cb)
    {
        let res = reader.db.collection("items").find({ $text: { $search: `"${itemName}"`}}).project({ score: { $meta: "textScore" } }).sort({score: { $meta: "textScore"}});
        res.toArray((err, res)=>
        {
            if ( err )
                throw err;

            if ( cb != null )
                cb(res);
        });
    }

    reader.findItemByID = function(id, cb)
    {
        reader.db.collection("items").findOne( { "ID" : id}, (err, res)=>
        {
            if ( err )
                throw err;
            
            if ( res != null )
            {
                cb([res]);
            }
            else 
            {
                cb([]);
            }
        });
    }


    reader.parseDescription = function parseDescription(table)
    {
        let splitted = table.split('#');
        let res = {}

        let id = 0;
        let desc = "";

        let regex = /\^[0-9A-F]{6}\ */gi; // filter color codes

        for(i = 0; i < splitted.length; ++i)
        {
            if ( id == 0 )
            {
                id = parseInt(splitted[i]);
            }
            else
            {
                desc = splitted[i];
                res[id] = desc.replace(regex, '');
                id = 0;
            }
        }
        return res;
    }

    reader.transformName = function(name)
    {
        name = name.toLowerCase().replace(' ', '_');
        return name;
    }

    function initReader()
    {
        console.log('Reading item_db.txt');
        _itemDescs = reader.parseDescription(fs.readFileSync('assets/idnum2itemdesctable.txt', 'utf8'));

        let lineReader = require('readline').createInterface({
            input: require('fs').createReadStream('assets/item_db.txt')
        });

        let itemTable = []


        lineReader.on('close', ()=>
        {
            console.log('updating db with ' + itemTable.length + ' items');

            lineReader.close();
            let bulkOp = []

            reader.db.dropCollection("items");
            let items = reader.db.collection("items");
            items.createIndex( { DisplayName: 'text', Name: 'text' }, {background: false}, (err, evt)=>
            {
                if ( err )
                    throw err;
            });

            
            itemTable.forEach((item)=>
            {
                bulkOp.push({"insertOne": {"document" : item }});

                if ( bulkOp.length === 1000)
                {
                    items.bulkWrite(bulkOp);
                    bulkOp = [];
                }
            });

            if ( bulkOp.length > 0 )
            {
                items.bulkWrite(bulkOp);
            }

            console.log(`added ${itemTable.length} entries to items`);
            if ( _InitCallback != null )
                _InitCallback();
        });
        
        lineReader.on('line', function(line)
        {
            let itemData = line.split(',');
            let itemIndex = parseInt(itemData[0]);
            let itemName = `${itemData[1]}`;
            let displayName = `${itemData[2]}`.replace(/_/g, ' ');
            let slots = parseInt(itemData[10]);

            if ( slots > 0 )
                displayName += `[${slots}]`;

            let itemObj =
            {
                ID: itemIndex,
                Name: itemName.toLowerCase(),
                DisplayName: displayName,
            };

            
            if ( !itemObj.ID )
                return;

            _itemCache[itemIndex] = true;
            itemTable.push(itemObj);
        });
    }

    reader.isValidItem = function(itemID)
    {
        return _itemCache[itemID];
    }
    
    reader.initialize = function(settings, initCb)
    {
        reader.db = settings.db;
        _InitCallback = initCb;
        initReader();
    }

})(typeof exports === 'undefined'? this.dbReader = {} : exports);
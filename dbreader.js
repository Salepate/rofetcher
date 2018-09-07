const fs = require('fs');


(function dbReader(reader)
{
    _itemHashMap = {}
    _itemDB = {}
    _itemDescs = {}

    reader.getItem = function (itemID)
    {
        if ( itemID in _itemDB)
        {
            itemInfo = _itemDB[itemID];
            itemDesc = _itemDescs[itemID];
            return itemInfo[1].replace('_', ' ') + `(${itemID})\n${itemDesc}`;
        }
        else
            return `unknown item index ${itemID}`;
    }

    reader.findItem = function(itemName)
    {
        itemName = reader.transformName(itemName);

        if ( itemName in _itemHashMap )
        {
            return reader.getItem(_itemHashMap[itemName]);
        }
        else 
        {
            return `${itemName} was not found in database`;
        }
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
        name = name.toLowerCase().replace(" ", "_");
        return name;
    }

    function initReader(reader)
    {
        console.log('Reading item_db.txt');
        _itemDescs = reader.parseDescription(fs.readFileSync('assets/idnum2itemdesctable.txt', 'utf8'));

        let lineReader = require('readline').createInterface({
            input: require('fs').createReadStream('assets/item_db.txt')
        });
        
        lineReader.on('line', function(line)
        {
            let itemData = line.split(',');
            let itemIndex = parseInt(itemData[0]);
            let itemName = `${itemData[1]}`.toLowerCase();

            _itemDB[itemIndex] = itemData;
            _itemHashMap[reader.transformName(itemName)] = itemIndex;
        });
    }

    initReader(reader);    

})(typeof exports === 'undefined'? this.dbReader = {} : exports);
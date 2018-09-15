// deps
const fs = require('fs');
// data
let itemCache = [];
let itemDescriptions = {};

// internal
let _parseDescriptions = function(table)
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

// api
let hasItem = function(itemID)
{
    return itemID in itemCache;
}

let cacheItemDatabase = function(doneCallback, errorCallback)
{
    console.log('caching item_db.txt');

    let lineReader = require('readline').createInterface({
        input: require('fs').createReadStream('assets/item_db.txt')
    });

    itemDescriptions = _parseDescriptions(fs.readFileSync('assets/idnum2itemdesctable.txt', 'utf8'));
    console.log(`idnum2itemdesctable.txt: descriptions cached`);

    lineReader.on('line', (line)=>
    {
        let itemData = line.split(',');
        let itemIndex = parseInt(itemData[0]);
        let itemName = `${itemData[1]}`;
        let displayName = `${itemData[2]}`.replace(/_/g, ' ');
        let slots = parseInt(itemData[10]);

        if ( !itemIndex )
            return;

        if ( slots > 0 )
            displayName += `[${slots}]`;

        let itemObj =
        {
            ID: itemIndex,
            Name: itemName.toLowerCase(),
            DisplayName: displayName,
        };

        itemCache.push(itemObj);
    });

    lineReader.on('close', ()=>
    {
        console.log(`item_db.txt: ${itemCache.length} entries cached`);
        doneCallback();

    });

}

let getItemDescription = function (itemID)
{
    let desc = itemDescriptions[itemID];

    if (desc)
    {
        return desc;
    }
    else
    {
        return `missing description ${itemID}`;
    }
}

module.exports =
{
    itemCache,
    cacheItemDatabase,
    getItemDescription,
    hasItem
}


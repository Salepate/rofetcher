// deps
const fs = require('fs');
const mob_layout = require('../documents/mob_layout.json');
const item_layout = require('../documents/item_layout.json');
// data
let itemCache = [];
let mobCache = [];
let itemDescriptions = {};

// internal
let _parseDescriptions = function(table)
{
    let splitted = table.split('#');
    let res = {}

    let id = 0;
    let desc = "";

    let regex = /\^[0-9A-F]{6}/gi; // filter color codes

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
let formatDropRate = function(itemDropRate, serverDropRate)
{
    return `${Math.min(100, itemDropRate  * serverDropRate / 100)}%`;
}

let getItemCache = function()
{
    return itemCache;
}

let getMobCache = function()
{
    return mobCache;
}

let hasItem = function(itemID)
{
    return itemID in itemCache;
}

let cacheFile = function(fileName, layout, completeCallback, errorCallback)
{
    let res = [];

    let lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(`assets/${fileName}`)
    });

    let flagsProcesses =
    {
        int(v) { return parseInt(v); },
        // float(v) { return Math.floor(parseFloat(v) * 100) / 100; },
        float(v) { return parseFloat(v);},
        lower(v) { return `${v}`.toLowerCase(); },
        display(v) 
        {
             return `${v}`.replace(/\_/gi, ' '); 
        }
    }

    let processEntry = function(value, keys)
    {
        if ( value === null || value === '' )
            return null;

        keys.forEach(flag =>
        {
            value = flagsProcesses[flag](value);
        })

        return value;
    }


    lineReader.on('line', (line)=>
    {
        let entryData = line.split(',');

        let entry = {};
        
        if ( line.substring(0, 2) == '//')
            return;

        let skip = false;

        for(p in layout)
        {
            let index = parseInt(layout[p].id);
            let flags = layout[p].flags;
            let range = layout[p].range;
            let stride = layout[p].stride ? layout[p].stride : 1;
            let entryValue = null;
            let isRequired = layout[p].required;

            if ( !flags )
                flags = {};

            let keys = Object.keys(flags);

            if ( range > 0 )
            {
                entryValue = [];
                for(let i = 0; i < range; ++i)
                {
                    let value = processEntry(entryData[index + i * stride], keys);
                    if ( value )
                        entryValue.push(value);
                }

                if ( entryValue.length > 0 )
                {
                    entry[p] = entryValue;
                }
            }
            else 
            {
                entry[p] = processEntry(entryData[index], keys);
            }

            if (isRequired && entry[p] === null)
            {
                skip = true;
            }

        }

        if ( !skip )
        {
            res.push(entry);
        }
        
    });

    lineReader.on('close', ()=>
    {
        console.log(`${fileName}: ${res.length} entries cached`);
        completeCallback(res);
    });
}

let cacheItemDatabase = function(doneCallback, errorCallback)
{
    itemDescriptions = _parseDescriptions(fs.readFileSync('assets/idnum2itemdesctable.txt', 'utf8'));
    console.log(`idnum2itemdesctable.txt: descriptions cached`);

    cacheFile('item_db.txt', item_layout, (res) => 
    {
        itemCache = res;
        doneCallback();
    });
}

let cacheMobDatabase = function(doneCallback, errorCallback)
{
    cacheFile('mob_db.txt', mob_layout, (res) => 
    {
        mobCache = res;
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
    formatDropRate,
    getItemCache,
    getMobCache,
    cacheItemDatabase,
    cacheMobDatabase,
    getItemDescription,
    hasItem
}


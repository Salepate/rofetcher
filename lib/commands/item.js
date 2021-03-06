// deps
let content = require('../content-db.js');
let ragnarok = require('../ro-db.js');
let discordBot = require('../bot-discord.js')
// consts
const MaxItemPerQuery = 3;
const TopDroppers = 5;
const Discord = 
{
    block: '```'
}

// sort drop with highest ifrst
let sortDroppers = function(itemIndex, mobs)
{
    return mobs.sort( (l,r) =>
    {
        let leftIndex = l.drop_ids.findIndex( d => d == itemIndex);
        let rightIndex = r.drop_ids.findIndex( d => d == itemIndex);
        return r.drop_rates[rightIndex] - l.drop_rates[leftIndex];
    });
}

// !item
let item = function(ctx, args)
{
    let itemID = 0;
    let itemName = args[0];

    if ( args.length == 1)
    {
        itemID = parseInt(args[0]);
    }
    else 
    {
        itemName = args.join(' ');
    }

    let findItemCb = (result) =>
    {
        if ( result.length > 0 )
        {
            let response = [];
            let rates = discordBot.getRates(ctx.server.id);
            let queried = 0;

            for(let i = 0; i < result.length && i < MaxItemPerQuery; ++i)
            {
                let id = parseInt(result[i].id);
                let desc = `${result[i].display_name} (${id})\n${ragnarok.getItemDescription(id)}`;
                let last = (i == result.length - 1 || i == MaxItemPerQuery - 1);

                content.getDatabase().collection('mobs').find({"drop_ids": id}).toArray((err, res) =>
                {
                    let responseIndex = i;
                    
                    if ( res.length > 0 )
                    {
                        res = sortDroppers(id, res);

                        let wearers = [];
                        
                        for(let j = 0; j < res.length && j < TopDroppers; ++j)
                        {
                            let mob = res[j];
                            let dropIdx = mob.drop_ids.findIndex( d => d == id);
                            let dropRate = mob.drop_rates[dropIdx];
                            wearers.push(`${res[j].display_name} (${ragnarok.formatDropRate(dropRate, rates[2])})`);
                        }
                        
                        desc += `\nDropped by:\n${wearers.join(', ')}`;
                    }

                    response[responseIndex] = Discord.block + desc + Discord.block;
                    queried += 1;

                    if ( queried == result.length || queried == MaxItemPerQuery )
                    {
                        if  ( result.length > MaxItemPerQuery )
                        {
                            response.unshift(`too many results (${result.length}) - *only top ${MaxItemPerQuery} is displayed*\n`);
                        }            
            
                        ctx.response(response.join('\n'), false, false);
                    }
                });
            }
        }
        else 
        {
            ctx.response(`${itemName} not found`);
        }
    }               

    if ( itemID > 0 )
    {
        content.findItemByID(itemID, findItemCb);
    }
    else 
    {
        content.findItem(itemName, findItemCb);
    }
}

module.exports =
{
    callback: item,
    settings() 
    {
        let res =
        {
            args: 1,
            strict: false
        }

        return res;
    }
}
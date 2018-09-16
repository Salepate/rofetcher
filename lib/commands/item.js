let content = require('../content-db.js');
let ragnarok = require('../ro-db.js');

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

            for(let i = 0; i < result.length && i < 3; ++i)
            {
                let id = parseInt(result[i].id);
                let desc = `${result[i].display_name} (${id})\n${ragnarok.getItemDescription(id)}`;
                let last = (i == result.length - 1 || i == 2);

                let mobs = content.getDatabase().collection('mobs').find({"drop_ids": id}).toArray((err, res) =>
                {
                    if ( res.length > 0 )
                    {
                        let wearers = [];
                        for(let j = 0; j < res.length; ++j)
                        {
                            let mob = res[j];

                            let dropIdx = mob.drop_ids.findIndex( d => d == id);
                            let dropRate = mob.drop_rates[dropIdx] / 100;


                            wearers.push(`${res[j].display_name} (${dropRate}%)`);
                        }
                        
                        desc += `\nDrops:\n\n${wearers.join('\n')}`;
                    }

                    response.push(desc);

                    if ( last )
                    {
                        ctx.response(response.join('```\n```'), false, true);
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
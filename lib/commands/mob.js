// deps
const content = require('../content-db.js');
const discordBot = require('../bot-discord.js');
const ragnarok = require('../ro-db');

// consts
const MaxMobPerQuery = 3;

// !mob
let formatMob = function(mob, serverDropRate, itemTable)
{
    let mes = `${mob.display_name} (${mob.id})`;
    mes += ` Lv.${mob.level} - ${mob.hp}HP\n`;
    let drops = [];

    if ( mob.drop_ids )
    {
        for(let i = 0; i < mob.drop_ids.length; ++i)
        {
            let item = itemTable.find( (e) => e.id == mob.drop_ids[i] );
            let dropRate = mob.drop_rates[i];
            drops.push(`${item.display_name} (${ragnarok.formatDropRate(dropRate, serverDropRate)})`);
        }
    }

    if ( drops.length > 0 )
    {
        mes += "\nDrops :\n";
        mes += drops.join(', ');
    }

    return mes;
}

let mob = function(ctx, args)
{
    let search = args.join(' ');
    let rates = discordBot.getRates(ctx.server.id);
    
    
    content.findMob(search, (arr)=>
    {
        let queried = 0;

        if ( arr.length > 0 )
        {
            let response = [];

            for(let i = 0; i < arr.length && i < MaxMobPerQuery; ++i)
            {
                content.findItems(arr[i].drop_ids, (items) =>
                {
                    response.push(formatMob(arr[i], rates[2], items));
                    queried += 1;

                    if ( queried == arr.length || queried == MaxMobPerQuery)
                    {
                        ctx.response(response.join('```\n```'), false, true);
                    }
                });
                //response.push(formatMob(arr[i], rates[2]));
            }
        }

        else
        {
            ctx.response(`${search} unknown`);
        }
    });
}

module.exports =
{
    callback: mob,
}
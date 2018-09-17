// deps
const content = require('../content-db.js');
const discordBot = require('../bot-discord.js');

// consts
const MaxMobPerQuery = 3;

// !mob
let formatMob = function(mob, dropRateScaler)
{
    let mes = `${mob.display_name} (${mob.id})\n`;
    for(let i = 0; i < mob.drop_ids.length; ++i)
    {
        let dropId = mob.drop_ids[i];
        let dropRate = mob.drop_rates[i];
        mes += `${dropId} (${Math.min(100, dropRate  * dropRateScaler/ 100)}%) `;
    }

    return mes;
}

let mob = function(ctx, args)
{
    let search = args.join(' ');
    let rates = discordBot.getRates(ctx.server.id);
    content.findMob(search, (arr)=>
    {
        if ( arr.length > 0 )
        {
            let response = [];
            for(let i = 0; i < arr.length && i < MaxMobPerQuery; ++i)
            {
                response.push(formatMob(arr[i], rates[2]));
            }
            ctx.response(response.join('```\n```'), false, true);
        }

        else
        {
            ctx.response(`${search} unknown`);
        }
    });
}

module.exports =
{
    callback: mob
}
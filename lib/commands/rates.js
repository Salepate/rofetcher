// deps
const discordBot = require('../bot-discord.js');

// !rates

let rates = function(ctx, args)
{
    let serverID = ctx.server.id;

    if ( ctx.superuser > 0 && args.length > 0 )
    {
        let baseRate = parseFloat(args[0]);
        let jobRate = parseFloat(args[1]);
        let dropRate = parseFloat(args[2]);
    
        if ( baseRate > 0 && jobRate > 0 && dropRate > 0 )
        {
            discordBot.setRates(ctx.server.id, [baseRate,jobRate, dropRate]);
            ctx.response(`exp rates set to ${baseRate} / ${jobRate} / ${dropRate}`);
        }
        else 
        {
            ctx.response(`invalid syntax use !rates <base> <job> <drop>`);
        }
    }
    else 
    {
        let rates = discordBot.getRates(ctx.server.id);
        ctx.response(`server rates are ${rates[0]}/${rates[1]}/${rates[2]}`, false, true);
    }
}


module.exports =
{
    callback: rates
}
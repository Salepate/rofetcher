let discordBot = require('../bot-discord.js');

// !allow
let allow = function(ctx)
{
    discordBot.setChannelStatus(ctx.channel, true);
    ctx.response(`allowed channel <#${ctx.channel.id}>`, true);
}


// export
module.exports =
{
    callback: allow
}
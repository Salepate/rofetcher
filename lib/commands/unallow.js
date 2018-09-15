let discordBot = require('../bot-discord.js');

// !unallow
let unallow = function(ctx)
{
    discordBot.setChannelStatus(ctx.channel, false);
    ctx.response(`removed channel <#${ctx.channel.id}>`, true);
}


// export
module.exports =
{
    callback: unallow
}
// deps
const discordBot = require('../bot-discord.js');
//
let _activeChannels = {}

// !disguise
let disguise = function (ctx, args)
{
    let snowflake = args[0];
    let interval = parseInt(args[1]);
    let isValidInterval = interval >= 0;
    let count = parseInt(args[2]);
    let isValidCount = count > 0;

    if ( snowflake.match(/<#[0-9]*>/) && isValidInterval && isValidCount) 
    {
        let id = snowflake.substr(2, snowflake.length - 3);
        let stop = args.length > 1 && parseInt(args[1]) == 0;

        if ( stop )
        {
            _activeChannels[id] = false;
        }
        else 
        {
            if ( !_activeChannels[id] )
            {
                discordBot.addMessageListener(id, userAnswer);

                _activeChannels[id] = 
                {
                    eventActive: false,
                    interval: interval * 1000,
                    mobCount: count,
                }
                setTimeout(() => { disguiseEventCallback(id) }, _activeChannels[id].interval);
                ctx.response(`disguise activated for channel <#${id}>, interval set to ${interval} minutes, mob per event ${count}`, false, false);
            }
        }
    }
}


// callback
let disguiseEventCallback = function(channelID)
{
    discordBot.sendResponse(channelID, "Disguise Event has started!");

    if ( _activeChannels[channelID])
    {
        setTimeout(() => { disguiseEventCallback(channelID) }, _activeChannels[channelID].interval);
    }
}

// 
let userAnswer = function(user, message)
{
    console.log(message);
}

module.exports =
{
    callback: disguise

}
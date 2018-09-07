const Discord = require('discord.io');
const auth = require('./auth.json');
const botcommand = require('./botcommand.js');

const client = new Discord.Client({
    token: auth.token,
    autorun: true
});

client.on('ready', function()
{
    console.log('connected!');
});

// temp admin stuff
_allowedChannels = {}

client.on('message', function(user, userID, channelID, message, evt)
{
    sendResponse = false;
    sendPrivate = false;
    response = "";


    // todo: command permissions
    if ( message == '!allow' && userID == auth.admin)
    {
        console.log(`allowed channel ${channelID}`);
        _allowedChannels[channelID] = true;
        sendPrivate = true;
        sendResponse = true;
        response  = 'channel allowed';
    }

    if ( message.startsWith('!') && _allowedChannels[channelID])
    {
        args = message.split(' ');
        commandName = args[0].substring(1);

        if ( botcommand.isCommand(commandName))
        {
            if ( botcommand.isValidCommand(commandName, args.length - 1))
            {
                commandArgs = args.slice(1);
                response = '```\n' + botcommand.invokeCommand(commandName, commandArgs) + '```\n';
            }
            else 
            {
                console.log(args.length);
                response = `usage: !${commandName} ` + botcommand.getUsage(commandName);
            }
        }
    }

    if ( response != '')
    {
        client.sendMessage({
            to: sendPrivate ? userID : channelID,
            message: response
        });
    }
});

client.on('disconnect', function(errMsg, code)
{
    console.log(`disconnected ${errMsg} (${code})`);
});

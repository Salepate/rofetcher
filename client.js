const Discord = require('discord.io');
const auth = require('./auth.json');
const botcommand = require('./botcommand.js');

(function discordClient(client)
{
    let _proxy = null;

    client.onClientReady = function()
    {
        console.log("connected to discord");
    }
    
    client.onClientMessage = function(user, userID, channelID, message, evt)
    {
        sendResponse = false;
        sendPrivate = false;
        response = "";
    
        let messageCb = function(msg)
        {
            _proxy.sendMessage({
                to: channelID,
                message: msg
            });
        };
    
        if ( message.startsWith('!'))
        {
            args = message.split(' ');
            commandName = args[0].substring(1);
    
            if ( botcommand.isCommand(commandName))
            {
                if ( botcommand.isValidCommand(commandName, args.length - 1))
                {
                    commandArgs = args.slice(1);
                    
                    let commandResponse = null;
                    
                    if ( botcommand.isAsync(commandName) )
                    {
                        botcommand.invokeCommand(commandName, commandArgs, messageCb);
                    }
                    else
                        botcommand.invokeCommand(commandName, commandArgs) ;
    
                    if ( commandResponse != null )
                        response = '```\n' + commandResponse + '```\n';
                }
                else 
                {
                    response = `usage: !${commandName} ` + botcommand.getUsage(commandName);
                }
            }
        }
    
        if ( !(response === '') && response != null)
        {
            _proxy.sendMessage({
                to: sendPrivate ? userID : channelID,
                message: response
            });
        }
    }
    
    client.onClientDisconnect = function(errMsg, code)
    {
        console.log(`disconnected ${errMsg} (${code})`);
    }

    client.initialize = function()
    {
        let clientProxy = new Discord.Client({
            token: auth.token,
            autorun: true
        });

        _proxy = clientProxy;
    
        clientProxy.on('ready', client.onClientReady);
        clientProxy.on('message', client.onClientMessage);
        clientProxy.on('disconnected', client.onClientDisconnect);
    }
})(typeof exports === 'undefined'? this.discordClient = {} : exports);
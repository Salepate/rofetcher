// scripts
const Discord = require('discord.io');
const botcommand = require('./botcommand.js');
// data
const auth = require('./auth.json');
const settings = require('./settings.json');

(function discordClient(client)
{
    let _proxy = null;
    let _endCallback = null;
    let _settings = {};


    let isAdmin = function(roles)
    {
        for(let i = 0; i < roles.length; ++i)
            if ( (roles[i].permissions & 8) == 8 )
                return true;
        return false;
    }


    client.channels = [];

    client.onClientReady = function()
    {
        console.log("connected to discord");

        if ( _endCallback != null )
            _endCallback();
    }


    client.getUsers = function() { return _proxy.users; }

    
    client.onClientMessage = function(user, userID, channelID, message, evt)
    {
        if ( userID == _proxy.id ) // ignore self
            return;

        let sendResponse = false;
        let sendPrivate = false;
        let response = "";
        let channel = _proxy.channels[channelID];
        let server = _proxy.servers[channel.guild_id];
        let admin = server.owner_id == userID;

        let allowBot = settings.require_allow ? client.channels.includes(channelID) : true;

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
                let settings = botcommand.getCommandSettings(commandName);
                let canInvoke = admin || (settings.level == 0 && allowBot);
                sendPrivate = settings.send_private;

                if ( botcommand.isValidCommand(commandName, args.length - 1) && canInvoke)
                {
                    commandArgs = args.slice(1);
                    
                    let commandResponse = null;

                    botcommand.InvokerID = userID;
                    botcommand.ChannelID = channelID;
                    botcommand.Channel = channel;
                    botcommand.Server = server;
                    
                    if ( botcommand.isAsync(commandName) )
                        botcommand.invokeCommand(commandName, commandArgs, messageCb);
                    else
                        response = botcommand.invokeCommand(commandName, commandArgs) ;

                    botcommand.clearCache();
                                            
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

    client.allowChannel = function(channelID)
    {
        if ( !(channelID in client.channels))
        {
            console.log(`authorized channel ${channelID}`);
            client.channels.push(channelID);
            _settings.db.collection("channels").insertOne({id: channelID});
        }
    }

    client.removeChannel = function(channelID)
    {
        if ( !(channelID in client.channels))
        {
            for(let i = client.channels.length; i >= 0; --i)
                if ( client.channels[i] == channelID )
                    client.channels = client.channels.splice(i, i);

            _settings.db.collection("channels").deleteMany({id: channelID});
        }
    }    
    
    client.onClientDisconnect = function(errMsg, code)
    {
        console.log(`disconnected ${errMsg} (${code})`);
    }

    client.initialize = function(settings, cb)
    {
        let clientProxy = new Discord.Client({
            token: auth.token,
            autorun: true
        });

        _settings = settings;
        _proxy = clientProxy;
        _endCallback = cb;

        settings.db.collection("channels").find({}).toArray((err, res)=>
        {
            console.log(`${res.length} channels allowed`);
            res.forEach((elem)=>
            {
                client.channels.push(elem.id);
            });
        });
        
        botcommand.setClient(client);

        clientProxy.on('ready', client.onClientReady);
        clientProxy.on('message', client.onClientMessage);
        clientProxy.on('disconnected', client.onClientDisconnect);
    }
})(typeof exports === 'undefined'? this.discordClient = {} : exports);
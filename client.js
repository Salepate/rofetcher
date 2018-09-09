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


    client.channels = [];

    client.onClientReady = function()
    {
        console.log("connected to discord");

        if ( _endCallback != null )
            _endCallback();
    }
    
    client.onClientMessage = function(user, userID, channelID, message, evt)
    {
        let sendResponse = false;
        let sendPrivate = false;
        let response = "";
    
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

            
            if ( commandName === 'allow')
            {
                client.allowChannel(channelID);
                sendPrivate = true;
                sendResponse = true;

                let channel = _proxy.channels[channelID];
                response = `allowed channel #${channel.name}`;
            }
            else if ( commandName === 'unallow')
            {
                client.removeChannel(channelID);
                sendPrivate = true;
                sendResponse = true;
                let channel = _proxy.channels[channelID];
                response = `removed channel #${channel.name} from whitelist`;
            }

            if ( botcommand.isCommand(commandName) && allowBot)
            {
                if ( botcommand.isValidCommand(commandName, args.length - 1))
                {
                    commandArgs = args.slice(1);
                    
                    let commandResponse = null;
                    
                    if ( botcommand.isAsync(commandName) )
                    {
                        botcommand.invokeCommand(userID,commandName, commandArgs, messageCb);
                    }
                    else
                        response = botcommand.invokeCommand(userID, commandName, commandArgs) ;
    
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
        

        clientProxy.on('ready', client.onClientReady);
        clientProxy.on('message', client.onClientMessage);
        clientProxy.on('disconnected', client.onClientDisconnect);
    }
})(typeof exports === 'undefined'? this.discordClient = {} : exports);
const Discord = require('discord.io');
const content = require('./content-db.js');
const commands = require('./user-commands.js');
// data
let _proxy = null;
let _allowedChannels = {};

// internal
let onReady = function()
{
    console.log('connected to discord');
}

let onMessage = function(user, userID, channelID, message, evt)
{
    let channel = _proxy.channels[channelID];
    
    if ( _proxy.id == userID || channel == null) // ignore self & dm
    {
        return;
    }

    let server = _proxy.servers[channel.guild_id];

    let commandContext =
    {
        user: _proxy.users[userID],
        channel: channel,
        server: server,
        superuser: server.owner_id == userID ? 1 : 0,
        message: message,
        response: (msg, sendPrivate, sendBlock) => 
        {
            if ( sendBlock )
            {
                msg = '```' + msg + '```';
            }


            if (sendPrivate || _allowedChannels[channel.id])
            {
                _sendResponse(sendPrivate ? userID : channelID, msg);
            }
        }
    }

    commands.tryParseCommand(commandContext);
}

let onDisconnect = function(err, code)
{
    console.log(`bot disconnected: ${err}`);
}

let _sendResponse = function(recipientID, response)
{
    _proxy.sendMessage({
        to: recipientID,
        message: response
    });
}

let _bindDiscordEvents = function()
{
    _proxy.on('ready', onReady);
    _proxy.on('message', onMessage);
    _proxy.on('disconnected', onDisconnect);
}

// api
let getUsers = function()
{
    return _proxy.users;
}

let setChannelStatus = function(channel, allow)
{
    if ( allow && !_allowedChannels[channel.id])
    {
        content.updateChannelStatus(channel.id, allow);
    }

    _allowedChannels[channel.id] = allow;
}

let connect = function(doneCallback, errorCallback)
{
    console.log('connecting to discord');
    const auth = require('../documents/auth.json');

    _proxy = new Discord.Client({
        token: auth.token,
        autorun: true
    });

    // find allowed channels
    content.getDatabase().collection('channels').find({}).toArray((err, chans) =>
    {
        if ( err )
            errorCallback(err);

        chans.forEach(channel=>
        {
            _allowedChannels[channel.id] = true;
        })

        console.log(`${chans.length} channel(s) allowed`);
        _bindDiscordEvents();

        doneCallback();
    });
}

module.exports =
{
    connect,
    setChannelStatus,
    getUsers
}
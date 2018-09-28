// consts
const MinInterval = 3;
const BlackList = [ 
    1003,1006,1017,1021,1022,1027,1043,1075,1136,1137,1168,1171,1172,1173,1181,
    1187,1210,1217,1218,1222,1223,1224,1225,1226,1227,1228,1324,1325,1326,1327,
    1328,1329,1330,1331,1332,1333,1334,1335,1336,1337,1338,1339,1340,1341,1342,
    1343,1344,1345,1346,1347,1348,1349,1350,1351,1352,1353,1354,1355,1356,1357,
    1358,1359,1360,1361,1362,1363,1233,1284,1407,1411,1414,1495, 1496,1501];
// deps
const discordBot = require('../bot-discord.js');
const request = require('request').defaults({encoding: null});
const content = require('../content-db.js');
//
let _mobs = [];
let _activeChannels = {}

// !disguise
let disguise = function (ctx, args)
{
    let snowflake = args[0];
    let interval = Math.max(parseInt(args[1]), MinInterval);
    let isValidInterval = interval >= 0;

    if ( snowflake.match(/<#[0-9]*>/))
    {
        let id = snowflake.substr(2, snowflake.length - 3);
        let stop = args.length > 1 && (parseInt(args[1]) == 0 || args[1] === 'off');

        if ( stop )
        {
            _activeChannels[id] = false;
            ctx.response(`disguise turned off for channel <#${id}>`, true);
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
                    currentMob: false
                }
                ctx.response(`disguise activated for channel <#${id}>, interval set to ${interval} seconds`, false, false);
                setTimeout( () =>{ disguiseCacheNextMob(id) }, interval * 1000);
            }
        }
    }
}


let downloadImage = function(uri, callback)
{
    request.get(uri, (err, res, body)=>
    {
        if ( err )
        {
            throw err;
        }
        callback(res.body);
    });
}

//
let triggerTimeout = function(channelID, timeout)
{
    setTimeout(  () => { disguiseEventCallback(channelID) }, timeout);
}

let disguiseCacheNextMob = function(channelID)
{
    if ( _activeChannels[channelID].currentMob )
    {
        discordBot.sendResponse(channelID, `Timeout! Correct answer was ${_activeChannels[channelID].currentMob.display_name}`);
        _activeChannels[channelID].currentMob = false;
        triggerTimeout(channelID, 1000); // Reinvoke
        return;
    }
    else 
    {
        let ranID = Math.floor(Math.random() * _mobs.length);
        let mob = _mobs[ranID];
        let url = `http://file5.ratemyserver.net/mobs/${mob.id}.gif`;
    
        _activeChannels[channelID].currentMob = mob;
    
        downloadImage(url, (imgBuffer) =>
        {
            if ( _activeChannels[channelID] ) // might have been turned off
            {
                discordBot.sendFile(channelID, imgBuffer);
                triggerTimeout(channelID, _activeChannels[channelID].interval);
            }
        });
    }
}


let setup = function()
{
    let db = content.getDatabase();
    db.createCollection('disguise_scores');

    db.collection('mobs').find({ id: { $gt: 1000, $lt: 1875, $nin: BlackList}}).toArray((err, res)=>
    {
        if ( err )
            throw err;
    
        _mobs = res;
        console.log(`${_mobs.length} mobs registered for disguise`);
    });
}


// callback
let disguiseEventCallback = function(channelID)
{
    //discordBot.sendResponse(channelID, "Disguise Event has started!");

    if ( _activeChannels[channelID])
    {
        setTimeout(() => { disguiseCacheNextMob(channelID) }, _activeChannels[channelID].interval);
    }
}

// 
let userAnswer = function(channel, user, message)
{
    if ( _activeChannels[channel.id] && _activeChannels[channel.id].currentMob )
    {
        let mob = _activeChannels[channel.id].currentMob;
        if ( message.toLowerCase() == mob.display_name.toLowerCase())
        {
            discordBot.sendResponse(channel.id, `${user.username} won! (${mob.display_name})`);
            _activeChannels[channel.id].currentMob = false;
        }
    }
}

module.exports =
{
    callback: disguise,
    setup:setup,
    settings() { return {args: 2, strict:true }}
}
// deps
const CommandParams = require('../documents/commands.json');

// data
let _commands = {};


// internal

// api
let isCommand = function(word)
{
    return _commands[word] != null;
}

let isValidCommand = function(commandName, argCount, superuser)
{
    let strict = _commands[commandName].settings.strict;
    let args = _commands[commandName].settings.args;
    let cmdLevel = _commands[commandName].level;

    return (!strict && argCount >= args || argCount == args) && superuser >= cmdLevel;
}

let tryParseCommand = function(commandContext)
{
    let message = commandContext.message;

    if ( message[0] === '!' )
    {
        let commandArgs = message.split(' ');
        let commandName = commandArgs[0].substring(1);

        if ( isCommand(commandName) )
        {
            let args = commandArgs.slice(1);

            if ( isValidCommand(commandName, args.length, commandContext.superuser))
            {
                let cmdParams = CommandParams[commandName];
                let cmd = _commands[commandName];
                cmd.callback(commandContext, args);
            }
            else 
            {
                commandContext.response(`usage: !${commandName} ${_commands[commandName].use}`);
            }
        }
        else 
        {
            console.log(`command unknown : ${commandName} (${commandContext.user.username})`);
        }
    }
}

let loadCommands = function(doneCallback, errorCallback)
{
    let commandNames = Object.keys(CommandParams);
    commandNames.forEach((name)=>
    {
        let cmd = require(`./commands/${name}.js`);
        _commands[name] = 
        {
            callback: cmd.callback,
            description: CommandParams[name].description,
            use: CommandParams[name].use,
            level: CommandParams[name].level,
            settings: cmd['settings'] != null ? cmd.settings() : { args: 0, strict: false}
        }
    });

    console.log(`registered ${commandNames.length} user commands`);
    doneCallback();
}

let getCommands = function()
{
    return Object.keys(_commands);
}

let getUsage = function(commandName)
{
    if ( isCommand(commandName))
    {
        let prefix = _commands[commandName].level > 0 ? '[admin] ' : '';
        return prefix + _commands[commandName].description;
    }
}

// export
module.exports =
{
    isCommand,
    loadCommands,
    tryParseCommand,
    getCommands,
    getUsage
}
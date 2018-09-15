const userCommands = require('../user-commands.js');

// !help
function help(ctx, args)
{
    let msg = 'command list\n';
    let commands = userCommands.getCommands();
    let descs = [];

    commands.forEach(name=>
    {
        descs.push(`!${name} ${userCommands.getUsage(name)}`);
    });

    ctx.response(msg+descs.join('\n'), false, true);
}

module.exports =
{
    callback: help
}
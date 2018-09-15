const appSettings = require('../package.json');
const chain = require('./async-chain.js');
const content = require('./content-db.js');
const ro = require('./ro-db.js');
const client = require('./bot-discord.js');
const commands = require('./user-commands.js');



// api
let startBot = function()
{
    console.log(`ro-fetcher ${appSettings.version}`);
    chain.chainStep(ro.cacheItemDatabase);
    chain.chainStep(content.connect);
    chain.chainStep(content.checkItemDatabase);
    chain.chainStep(commands.loadCommands);
    chain.chainStep(client.connect);
    chain.execute();
}


module.exports = 
{
    startBot
}
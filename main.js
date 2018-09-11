const Discord = require('discord.io');
const auth = require('./auth.json');
const client = require('./client.js');
const clientdb = require('./clientdb.js');
const dbreader = require('./dbreader.js');
const chain = require('./chaincommand.js');
const package = require('./package.json');


chain.addCommand((_, cb) => { console.log(`: ro fetcher ${package.version} :`); cb(); });
chain.addCommand(clientdb.initialize);
chain.addCommand(dbreader.initialize);
chain.addCommand(client.initialize);

chain.execute((err)=>
{
    console.log('bot started successfully');
});

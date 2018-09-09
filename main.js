const Discord = require('discord.io');
const auth = require('./auth.json');
const client = require('./client.js');
const dbreader = require('./dbreader.js');


dbreader.initialize(onDatabaseReady);

function onDatabaseReady()
{
    client.initialize();
}

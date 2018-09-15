const mongodb = require('mongodb');
const ro = require('./ro-db.js');
const chain = require('./async-chain.js');

let database = {};

// api
let connect = function(doneCallback, errorCallback)
{
    console.log(`connecting to mongodb...`);
    const auth = require('../documents/auth.json');
    let url = `${auth.mongodb.host}`;
    let client = mongodb.MongoClient;

    client.connect(url, { useNewUrlParser: true}, (err, db)=>
    {
        if ( err )
            errorCallback(err);

        console.log('connection to mongodb successful');

        database = db.db(auth.mongodb.database);
        // create basic collections
        database.createCollection('channels');
        database.createCollection('wishitems');
        database.createCollection('items'); // ro db
        database.collection('items').createIndex({ DisplayName: 'text', Name: 'text'});
        doneCallback();
    });
}

let checkItemDatabase = function(doneCallback, errorCallback)
{
    database.collection('items').countDocuments(function(err, count)
    {
        if ( err )
            errorCallback(err);

        if ( count < ro.itemCache.length )
        {
            chain.insertStep(createItemDatabase);
        }
        
        doneCallback();
    });
}

let updateChannelStatus = function(channelID, allowed)
{
    if ( allowed )
    {
        database.collection("channels").insertOne({id: channelID});
    }
    else
    {
        database.collection("channels").deleteMany({id: channelID});
    }    
}

let createItemDatabase = function(doneCallback, errorCallback)
{
    console.log(`updating item database`);
    database.dropCollection('items');
    let itemDb = database.collection('items');
    itemDb.createIndex({DisplayName: "text", Name: "text"}, {background: false}, (err, evt)=>
    {
        if ( err )
            errorCallback(err);

        let bulkOps = [];

        for(let i = 0; i < ro.itemCache.length; ++i)
        {
            bulkOps.push({"insertOne": { "document": ro.itemCache[i]}});

            if ( bulkOps.length >= 1000 )
            {
                itemDb.bulkWrite(bulkOps);
                bulkOps = [];
            }
        }

        if ( bulkOps.length > 0 )
        {
            itemDb.bulkWrite(bulkOps);
        }

        console.log(`item database now up to date`);
        doneCallback();
    });
}

let findItem = function(itemName, cb)
{
    let res = database.collection("items").find({ $text: { $search: `"${itemName}"`}}).project({ score: { $meta: "textScore" } }).sort({score: { $meta: "textScore"}});
    res.toArray((err, res)=>
    {
        if ( err )
            throw err;

        if ( cb != null )
            cb(res);
    });
}

let findItemByID = function(id, cb)
{
    database.collection("items").findOne( { "ID" : id}, (err, res)=>
    {
        if ( err )
            throw err;
        
        if ( res != null )
        {
            cb([res]);
        }
        else 
        {
            cb([]);
        }
    });
}

module.exports =
{
    // methods
    getDatabase() { return database;},
    connect,
    checkItemDatabase,
    createItemDatabase,
    updateChannelStatus,
    findItem,
    findItemByID
}

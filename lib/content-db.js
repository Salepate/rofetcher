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
        database.createCollection('mobs');
        doneCallback();
    });
}

let checkItemDatabase = function(doneCallback, errorCallback)
{
    database.collection('items').countDocuments(function(err, count)
    {
        if ( err )
            errorCallback(err);


        if ( count < ro.getItemCache().length )
        {
            chain.insertStep(createItemDatabase);
        }
        
        doneCallback();
    });
}


let checkMobDatabase = function(doneCallback, errorCallback)
{
    database.collection('mobs').countDocuments(function(err, count)
    {
        if ( err )
            errorCallback(err);


        if ( count < ro.getMobCache().length )
        {
            chain.insertStep(createMobDatabase);
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
    itemDb.createIndex({ display_name: 'text', name: 'text'}, {background: false}, (err, evt)=>
    {
        if ( err )
            errorCallback(err);

        let bulkOps = [];

        let itemCache = ro.getItemCache();
        for(let i = 0; i < itemCache.length; ++i)
        {
            bulkOps.push({"insertOne": { "document": itemCache[i]}});

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

let createMobDatabase = function(doneCallback, errorCallback)
{
    console.log(`updating mob database`);
    database.dropCollection('mobs');
    let mobDatabase = database.collection('mobs');
    mobDatabase.createIndex({ display_name: 'text', name: 'text'}, {background: false}, (err, evt)=>
    {
        if ( err )
            errorCallback(err);

        let bulkOps = [];

        let mobCache = ro.getMobCache();
        for(let i = 0; i < mobCache.length; ++i)
        {
            bulkOps.push({"insertOne": { "document": mobCache[i]}});

            if ( bulkOps.length >= 1000 )
            {
                mobDatabase.bulkWrite(bulkOps);
                bulkOps = [];
            }
        }

        if ( bulkOps.length > 0 )
        {
            mobDatabase.bulkWrite(bulkOps);
        }

        console.log(`mob database now up to date`);
        doneCallback();
    });
}

let findMob = function(searchString, callback)
{
    let id = parseInt(searchString);
    let searchObj = null;
    let sortObj = null;
    let project = false;

    if ( id > 0 )
    {
        searchObj = { id: `${id}`.toString() };
    }
    else 
    {
        searchObj = { display_name: new RegExp(searchString, 'i')};
        // project = true;
        // sortObj = {score: { $meta: "textScore"}};
    }

    let res = database.collection('mobs').find(searchObj);

    if ( project )
    {
        res = res.project(sortObj).sort(sortObj);
    }

    res.toArray((err, res)=>
    {
        if ( err )
            throw err;

        if ( callback != null )
            callback(res);
    });
}

let findItem = function(itemName, cb)
{
    var re = new RegExp(itemName, 'i');
    let res = database.collection('items').find({display_name: re});
    //let res = database.collection("items").find({ $text: { $search: `"${itemName}"`}}).project({ score: { $meta: "textScore" } }).sort({score: { $meta: "textScore"}});
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
    database.collection('items').findOne( { id : id}, (err, res)=>
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

let findItems = function(itemsArray, cb)
{
    if ( itemsArray == null || itemsArray.length == 0 )
    {
        cb([]);
        return;
    }
        
    database.collection('items').find( { id: { $in:  itemsArray }}).toArray((err, res)=>
    {
        if ( err )
            throw err;
        cb(res);
    });
}

module.exports =
{
    // methods
    getDatabase() { return database;},
    connect,
    checkItemDatabase,
    createItemDatabase,
    createMobDatabase,
    checkMobDatabase,
    updateChannelStatus,
    findMob,
    findItem,
    findItemByID,
    findItems
}

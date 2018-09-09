(function clientdb(client)
{
    const mongodb = require('mongodb');
    const auth = require('./auth.json');
    client.db = null;

    let _createCollections = function()
    {

    }

    client.initialize = function(settings, endCb)
    {
        let mongoClient = mongodb.MongoClient;
        let url = `${auth.mongodb.host}`;
        
        mongoClient.connect(url, { useNewUrlParser: true}, function(err, db)
        {
            if (err) 
                throw err;

            console.log("connected to mongodb");
            client.db = db.db(auth.mongodb.database);
            client.db.createCollection("channels");

            if ( endCb != null )
                endCb({ db: client.db});
        });
    }

})(typeof exports === 'undefined'? this.clientdb = {} : exports);
// deps
const content = require('../content-db.js');
const discordBot = require('../bot-discord.js');
const ragnarok = require('../ro-db.js');

// !wish
function wish(ctx, args)
{
    let database = content.getDatabase();
    let uid = ctx.user.id; // small fix for async use
    let items = [];
    let response = [];

    for(let i = 1; i < args.length; ++i)
    {
        let idx = parseInt(args[i]);
        if ( ragnarok.hasItem(idx) )
            items.push(idx);

        else
            response.push(`invalid ${idx}`);
    }

    if ( args[0] === 'help')
    {
        ctx.response(`show [user]\nadd <item_id1> <item_id2> ...\nremove <item_id1> <item_id2> ...`);
    }
    if ( args[0] == 'add')
    {
        database.collection("wishitem").find({'userid': uid}).toArray(function(err, result)
        {
            result.forEach(function(item)
            {
                let amount = item.amount;
                for(let i = items.length; i >= 0; --i)
                {
                    if ( item.itemid == items[i] )
                    {
                        item.amount += 1;
                        items = items.splice(i,i);
                    }
                }    

                if ( amount != item.amount)
                {
                    console.log("updating existing item");
                    database.collection('wishitem').updateOne(
                        {'userid': uid, 'itemid': item.itemid}, 
                        {$set: { 'amount': item.amount}}
                    );
                }
            })

            // adding non existent items
            items.forEach((item)=>
            {
                database.collection('wishitem').insertOne({'userid': uid, 'itemid': item, 'amount': 1});
            });

            if ( response.length == 0 )
                ctx.response(`updating wish list`);
            else
                ctx.response(`updating wish list\n${response.join(' ')}`);
        });
    }
    if ( args[0] === 'remove')
    {
        let documents = [];
        items.forEach((item)=>
        {
            database.collection("wishitem").deleteOne({'userid': uid, 'itemid': item});
        });

        ctx.response('removing items from list');
    }
    if ( args[0] == 'show')
    {
        let users = discordBot.getUsers();
        let targetUser = uid;
        let targetUserName = ctx.server.members[uid].nick;

        if ( targetUserName == null )
            targetUserName = users[uid].username;


        if ( args.length > 1 )
        {
            let nick = args.slice(1).join(' ').toLowerCase();
            let found = false;

            Object.keys(ctx.server.members).forEach((uid)=>
            {
                let member = ctx.server.members[uid];
                let memberName = member.nick;
                if ( memberName == null )
                    memberName = users[uid].username;

                if ( memberName.toLowerCase() == nick )
                {
                    targetUser = uid;
                    targetUserName = memberName;
                    found = true;
                }
            });

            if ( !found )
            {
                ctx.response(`unknown user ${nick}`, false, true);
                return;
            }
        }

        database.collection("wishitem").find({ 'userid': targetUser}).toArray((err, wishlist)=>
        {
            let items = [];
            wishlist.forEach((item)=>
            {
                // items.push(`<${item.itemid} : ${item.amount}>`);
                items.push(item.itemid);
            });


            if ( items.length > 0 )
            {
                database.collection("items").find({"ID": { "$in" : items}}).toArray((err, res)=>
                {
                    let response = [];

                    for(let i = 0; i < res.length; ++i)
                    {
                        let itemDesc = res[i];

                        response.push(`${itemDesc.DisplayName} (${itemDesc.ID}) : ${wishlist[i].amount}`);
                    }

                    ctx.response(`${targetUserName} wish list :\n ${response.join('\n')}`, false, true);
                });
            }
            else 
            {
                ctx.response('<empty wish list>');
            }
        });
    }
}

module.exports =
{
    callback: wish,
    settings() 
    {
        let res =
        {
            args: 1,
            strict: false
        }

        return res;
    }
}
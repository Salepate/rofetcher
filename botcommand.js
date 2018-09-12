const assert = require('assert');
const dbreader = require("./dbreader.js");
const commands = require("./documents/commands.json");

(function botcommand(bot)
{
    _commands = {}

    bot.client = null;
    bot.InvokerID = null;
    bot.ChannelID = null;
    bot.Channel = null;
    bot.Server = null;
    //-----------------------------------------------------------
    // - User Commands
    //-----------------------------------------------------------

    // !allow
    function allow()
    {
            
        bot.client.allowChannel(bot.ChannelID);
        return `allowed channel #${bot.Channel.name}`;
    }

    // !unallow
    function unallow()
    {
        bot.client.removeChannel(bot.ChannelID);
        return `removed channel #${bot.Channel.name} from whitelist`;
    }

    // !odd
    function odd(args)
    {
        let dropRate = parseFloat(args[0]) / 100;
        let killCount = parseInt(args[1]);
        let failRate = 1.0 - dropRate;
        let chance = 1.0 - Math.pow(failRate, killCount);
        let printedRate = `${dropRate*100}`;
        printedRate = printedRate.substring(0, 5);
        chance = Math.floor(chance * 1000) / 10;


        let response = `Chance to drop at least once (${printedRate}%) with ${killCount} tries: ${chance}%`;
        return response;
    }

    // !luck
    function luck(args)
    {
        let dropRate = parseFloat(args[0]) / 100; 
        let failRate = 1 - dropRate;
        let odd = parseFloat(args[1]) / 100;
        let invertedOdd = 1 - odd;
        let trials = Math.round( Math.log(invertedOdd) / Math.log(failRate));

        return respone = `You need approximatively ${trials} tries to achieve ${odd*100}%`
            + ` chance of success with a droprate of ${dropRate*100}%`;
    }

    // !wish
    function wish(args, responseCallback)
    {
        let uid = bot.InvokerID; // small fix for async use
        let items = [];
        let response = [];

        for(let i = 1; i < args.length; ++i)
        {
            let idx = parseInt(args[i]);
            if ( dbreader.isValidItem(idx) )
                items.push(idx);

            else
                response.push(`invalid ${idx}`);
        }

        if ( args[0] === 'help')
        {
            responseCallback(`show\nadd <item_id1> <item_id2> ...\nremove <item_id1> <item_id2> ...`);
        }
        if ( args[0] == 'add')
        {
            dbreader.db.collection("wishitem").find({'userid': uid}).toArray(function(err, result)
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
                        dbreader.db.collection('wishitem').updateOne(
                            {'userid': uid, 'itemid': item.itemid}, 
                            {$set: { 'amount': item.amount}}
                        );
                    }
                })

                // adding non existent items
                items.forEach((item)=>
                {
                    console.log('adding new item');
                    dbreader.db.collection('wishitem').insertOne({'userid': uid, 'itemid': item, 'amount': 1});
                });

                if ( response.length == 0 )
                    responseCallback(`updating wish list`);
                else
                    responseCallback(`updating wish list\n${response.join(' ')}`);
            });
        }
        if ( args[0] === 'remove')
        {
            let documents = [];
            items.forEach((item)=>
            {
                dbreader.db.collection("wishitem").deleteOne({'userid': uid, 'itemid': item});
            });

            responseCallback('removing items from list');
        }
        if ( args[0] == 'show')
        {
            let users = bot.client.getUsers();
            let targetUser = uid;
            let targetUserName = bot.Server.members[uid].nick;

            if ( targetUserName == null )
                targetUserName = users[uid].username;


            if ( args.length > 1 )
            {
                let nick = args.slice(1).join(' ').toLowerCase();
                let found = false;

                Object.keys(bot.Server.members).forEach((uid)=>
                {
                    let member = bot.Server.members[uid];
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
                    responseCallback('```' + `unknown user ${nick}` + '```');
                    return;
                }
            }

            dbreader.db.collection("wishitem").find({ 'userid': targetUser}).toArray((err, wishlist)=>
            {
                let items = [];
                wishlist.forEach((item)=>
                {
                    // items.push(`<${item.itemid} : ${item.amount}>`);
                    items.push(item.itemid);
                });


                if ( items.length > 0 )
                {
                    dbreader.db.collection("items").find({"ID": { "$in" : items}}).toArray((err, res)=>
                    {
                        let response = [];
    
                        for(let i = 0; i < res.length; ++i)
                        {
                            let itemDesc = res[i];

                            response.push(`${itemDesc.DisplayName} (${itemDesc.ID}) : ${wishlist[i].amount}`);
                        }

                        responseCallback('```\n: ' + targetUserName + ' wish list :\n' + response.join('\n') + '\n```');
                    });
                }
                else 
                {
                    responseCallback('<empty wish list>');
                }
            });
        }
    }

    // !item
    function findItem(args, responseCallback)
    {
        let itemID = 0;
        let itemName = args[0];
 
        if ( args.length == 1)
        {
            itemID = parseInt(args[0]);
        }
        else 
        {
            itemName = args.join(' ');
        }

        let findItemCb = (result) =>
        {
            if ( result.length > 0 )
            {
                let response = [];

                for(let i = 0; i < result.length && i < 3; ++i)
                {
                    let id = result[i].ID;
                    let desc = `${result[i].DisplayName} (${id})\n${dbreader.getItem(id)}`;
                    response.push(desc);
                }

                responseCallback('```' + response.join('```\n```') + '```');
            }
            else 
            {
                responseCallback(`${itemName} not found`);
            }
        }               

        if ( itemID > 0 )
        {
            dbreader.findItemByID(itemID, findItemCb);
        }
        else 
        {
            dbreader.findItem(itemName, findItemCb);
        }
    }

    // !help
    function help()
    {
        let response = 'command list\n';

        for(let c in _commands)
        {
            response += `!${c} : ${bot.getUsage(c)}\n`;
        }

        return response;
    }

    function registerCommand(commandName, argCount, func, usage, async = false, strictArg = true)
    {
        assert.equal(commandName in _commands, false, "Command " + commandName + " already registered");

        _commands[commandName] = 
        {
            Args: argCount,
            Func: func,
            Use: usage,
            Strict: strictArg,
            Async: async
        }
    }


    registerCommand("allow", 0, allow, "// [admin] whitelist the channel (allow bot commands)");
    registerCommand("unallow", 0, unallow, "// [admin] remove channel from whitelist");
    registerCommand("item", 1, findItem, "<item name | item id> // look up for item in database and display description", true, false);
    registerCommand("odd", 2, odd, "<droprate> <killcount> // compute the odd for at least one success in n tries");
    registerCommand("luck", 2, luck, "<droprate> <odd> // compute the number of tries to achieve a certain success (<100%)");
    registerCommand("help", 0, help, "display available commands", false, false);
    registerCommand("wish", 1, wish, "<command> // manage wish list (use !wish help)", true, false);
    //-----------------------------------------------------------
    // - Public API
    //-----------------------------------------------------------
    bot.isCommand = function(commandName)
    {
        return commandName in _commands;
    }

    bot.isValidCommand = function(commandName, argCount)
    {
        let com = _commands[commandName];

        return bot.isCommand(commandName) && ( (!com.Strict && argCount >= com.Args) || com.Args == argCount);
    }

    bot.getUsage = function(commandName)
    {
        return _commands[commandName].Use;
    }

    bot.isAsync = function(commandName)
    {
        return _commands[commandName].Async;
    }

    bot.invokeCommand = function(commandName, args, asyncResponseCb)
    {
        let res = _commands[commandName].Func(args, asyncResponseCb);
        bot.InvokerID = null; // better not keep it cached
        return res;
    }

    bot.getCommandSettings = function(commandName)
    {
        return commands[commandName];
    }

    bot.clearCache = function()
    {
        bot.InvokerID = null;
        bot.ChannelID = null;
        bot.Channel = null;
        bot.Server = null;
    }

    bot.setClient = function(client)
    {
        bot.client = client;
    }

})(typeof exports == 'undefined'? this.botcommand = {} : exports);
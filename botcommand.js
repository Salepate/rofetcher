const assert = require('assert');
const dbreader = require("./dbreader.js");

(function botcommand(bot)
{
    _commands = {}

    //-----------------------------------------------------------
    // - User Commands
    //-----------------------------------------------------------

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


    registerCommand("item", 1, findItem, "<item name | item id> // look up for item in database and display description", true, false);
    registerCommand("odd", 2, odd, "<droprate> <killcount> // compute the odd for at least one success in n tries");
    registerCommand("luck", 2, luck, "<droprate> <odd> // compute the number of tries to achieve a certain success (<100%)");
    registerCommand("help", 0, help, "display available commands", false, false);

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
        return _commands[commandName].Func(args, asyncResponseCb);
    }

})(typeof exports == 'undefined'? this.botcommand = {} : exports);
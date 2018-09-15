let content = require('../content-db.js');
let ragnarok = require('../ro-db.js');

// !item
let item = function(ctx, args)
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
                let desc = `${result[i].DisplayName} (${id})\n${ragnarok.getItemDescription(id)}`;
                response.push(desc);
            }

            ctx.response(response.join('```\n```'), false, true);
        }
        else 
        {
            ctx.response(`${itemName} not found`);
        }
    }               

    if ( itemID > 0 )
    {
        content.findItemByID(itemID, findItemCb);
    }
    else 
    {
        content.findItem(itemName, findItemCb);
    }
}

module.exports =
{
    callback: item,
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
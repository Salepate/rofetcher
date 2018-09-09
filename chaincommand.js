(function chainCommand(chain)
{
    let _commands = [];
    let _endCallback = null;
    let _settings = null;

    let _commandCallback = function(newsettings)
    {
        for(p in newsettings )
        {
            if ( p in _settings )
            {
                console.log(`overriding ${p} with ${newsettings[p]}`);
            }
            _settings[p] = newsettings[p];
        }

        _cmdInvoke();
    }

    let _cmdInvoke = function()
    {
        if ( _commands.length > 0 )
        {
            let cmd = _commands[0];
            _commands = _commands.slice(1);
            cmd(_settings, _commandCallback);
        }
        else 
        {
            if ( _endCallback != null )
                _endCallback();
        }
    }

    chain.addCommand = function(callback)
    {
        _commands.push(callback);
    }

    chain.execute = function(endCallback, settings = {})
    {
        _settings = settings;
        _endCallback = endCallback;
        _cmdInvoke();
    }

})(typeof exports == 'undefined' ? this.chainCommand = {} : exports);
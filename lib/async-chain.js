// data
let _chain = [];
let _completeCb = null;
let _errorCb = null;

// internal
let _invokeStep = function()
{
    if ( _chain.length > 0 )
    {
        let step = _chain[0];
        _chain = _chain.slice(1);
        step(_onStepComplete, _onStepError);
    }
    else 
    {
        // terminate
        console.log('initialization successful');
        if ( _completeCb != null )
            _completeCb();
    }
}

let _onStepComplete = function()
{
    _invokeStep();
}

let _onStepError = function(err)
{
    console.log(`error: ${err}`);
    if ( _errorCb != null)
        _errorCb(err);
    else
        throw err;
}

// api
let chainStep = function( callback )
{
    _chain.push(callback);
}

let insertStep = function( callback) 
{
    _chain.unshift(callback);
}

let execute = function(completeCallback, errorCallback)
{
    _completeCb = completeCallback;
    _errorCb = errorCallback;

    if ( _chain.length > 0 )
    {
        _invokeStep();
    }
    else 
    {
        console.log('chain is empty, ignoring');
    }
}


module.exports =
{
    chainStep,
    insertStep,
    execute
}

// !luck
function luck(ctx, args)
{
    let dropRate = parseFloat(args[0]) / 100; 
    let failRate = 1 - dropRate;
    let odd = parseFloat(args[1]) / 100;
    let invertedOdd = 1 - odd;
    let trials = Math.round( Math.log(invertedOdd) / Math.log(failRate));

    ctx.response(`You need approximatively ${trials} tries to achieve ${odd*100}%`
        + ` chance of success with a droprate of ${dropRate*100}%`, false, false);
}

module.exports =
{
    callback: luck,
    settings() 
    {
        let res =
        {
            args: 2,
            strict: true
        }

        return res;
    }
}
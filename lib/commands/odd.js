// !odd
function odd(ctx, args)
{
    let dropRate = parseFloat(args[0]) / 100;
    let killCount = parseInt(args[1]);
    let failRate = 1.0 - dropRate;
    let chance = 1.0 - Math.pow(failRate, killCount);
    let printedRate = `${dropRate*100}`;
    printedRate = printedRate.substring(0, 5);
    chance = Math.floor(chance * 1000) / 10;
    ctx.response(`Chance to drop at least once (${printedRate}%) with ${killCount} tries: ${chance}%`, false, false);
}

module.exports =
{
    callback: odd,
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
export async function getUserInput(promptText)
{
    if(globalThis.window && window.prompt)
    {
        return window.prompt(promptText)
    }

    if(globalThis.process && process.stdin)
    {
        const readline = require("readline/promises")

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

        const answer = await rl.question(promptText)

        rl.close()
        
        return answer
    }
}

export async function showUserOutput(text)
{
    if(globalThis.window && window.alert)
    {
        return window.alert(text)
    }
    else
    {
        return console.log(text)
    }
}
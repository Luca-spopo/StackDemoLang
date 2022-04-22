export async function getUserInput(promptText)
{
    if(window?.prompt)
    {
        return window.prompt(promptText)
    }

    if(process?.stdin)
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
    return window.alert(text)
}
import readline from "readline"
import process from "process"

export async function getUserInput(promptText)
{
    if(globalThis.window && window.prompt)
    {
        return window.prompt(promptText)
    }

    if(globalThis.process && process.stdin)
    {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

        const answer = await new Promise(resolve => {
            rl.question(`${promptText}: `, resolve)
          })

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
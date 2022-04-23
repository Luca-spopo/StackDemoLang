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
            rl.question(`\x1b[1m${promptText}: `, resolve)
            process.stdout.write('\x1b[0m')
          })

        rl.close()
        
        return answer
    }
}

export async function showUserOutput(text)
{
    if(globalThis.window && window.alert)
    {
        window.alert(text)
    }
    else
    {
        process.stdout.write('\x1b[1m')
        console.log(text)
        process.stdout.write('\x1b[0m')
    }
}
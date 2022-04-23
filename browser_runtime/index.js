import antlr4 from 'antlr4';
import StackDemoLangLexer from './StackDemoLangLexer.js';
import StackDemoLangParser from './StackDemoLangParser.js';
import StackDemoLangTranspilingVisitor from './semantics.js';
import { ExecutionContext, HiddenCallStackFrame, Thread } from './interpreter.js';
import { showUserOutput } from './io.js';
import util from 'util'

async function runProgram(input)
{
    console.log("Parsing program...")
    let programLines = input.split("\n")
    for(let lineNumber in programLines)
    {
        console.log(`${parseInt(lineNumber)+1}:\t`, programLines[lineNumber])
    }
    const chars = new antlr4.InputStream(input);
    const lexer = new StackDemoLangLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new StackDemoLangParser(tokens);
    parser.buildParseTrees = true;
    const tree = parser.program();
    let program = tree.accept(new StackDemoLangTranspilingVisitor())
    console.log("Program's semantics were parsed as follows:")
    console.log(util.inspect(program, {showHidden: false, depth: null, colors: true}))

    let mainProcedure = program.procedures.find((procedure) => { return procedure.name.toLowerCase() == "main" })
    if(mainProcedure)
    {
        let executionContext = new ExecutionContext(8)
        executionContext.instructionPointer = mainProcedure.address
        executionContext.hiddenCallStack.push(new HiddenCallStackFrame(mainProcedure))
        let mainThread = new Thread(program, executionContext)
        while(true)
        {
            await mainThread.tick()
        }
    }
    else
    {
        showUserOutput("There was no main function, not running the program")
    }
}

await runProgram(`
define_procedure average_of_2
contract
{
    I promise to pop 3 elements (the numbers to average and the return address) and push 1 element (their average) on the stack
    I promise to preserve the value of all registers except: registers[0], registers[1]
}
body
{
    //Get the arguments (except the return address)
    registers[0] = stack.pop() (as number_to_average_1)
    registers[1] = stack.pop() (as number_to_average_2)

    //Add the two numbers:
        //Push the two numbers to the stack
        stack.push(registers[1]) (as number_to_add_1)
        stack.push(registers[0]) (as number_to_add_2)

        //Process the two numbers on top of the stack
        add

        //Get the added value from the top of the stack
        registers[0] = stack.pop() (as sum)

    //Divide them by 2
        //Push the divident and divisor
        stack.push(registers[0]) (as sum)
        stack.push(2) (as diviser)

        //Process the two numbers at the top of the stack
        divide

        //Get the divided value
        registers[0] = stack.pop() (as average)

    //Get the return address send by the caller procedure
    registers[1] = stack.pop() (as return_address)

    //Push the average to the stack, as promised by our contract
    stack.push(registers[0]) (as average)

    //Jump to the return address the caller requested us to return to
    jump to registers[1]
}

define_procedure main
body
{
    #LABEL: .loopStart

    input
    input

    registers[0] = stack.pop() (as number_to_average_1)
    registers[1] = stack.pop() (as number_to_average_2)

    //Average the numbers using a subroutine:
        //Prepare the return address the subroutine should come back to after it's done:
        stack.push(#.after_averaging_jump_here.lineNumber) (as address_to_return_to_after_procedure_call)

        //Prepare the arguments (the numbers to average) for the subroutine
        stack.push(registers[1]) (as number_to_add_1)
        stack.push(registers[0]) (as number_to_add_2)

        //Jump to the subroutine
        jump to #average_of_2.lineNumber
        #LABEL: .after_averaging_jump_here

        //Process the output of the subroutine, which it left for us on the stack
        registers[0] = stack.pop() (as average)

    //Print the output
    print registers[0] (as average)

    jump to #.loopStart.lineNumber
    //Or alternatively, jump to #main.lineNumber
}
`)

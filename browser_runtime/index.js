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
    console.log(input)
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
define_procedure main
contract
{
    I promise to pop 2 elements (the numbers to average) and push 1 element (their average) on the stack
    I promise to preserve the value of all registers except: registers[0], registers[1]
}
body
{
    input
    input

    registers[0] = stack.pop() (as number_to_average_1)
    registers[1] = stack.pop() (as number_to_average_2)

    stack.push(registers[1]) (as number_to_add_1)
    stack.push(registers[0]) (as number_to_add_2)
    add
    registers[0] = stack.pop() (as sum)

    stack.push(registers[0]) (as sum)
    stack.push(2) (as diviser)
    divide
    registers[0] = stack.pop() (as average)

    print registers[0] (as average)

    stack.push(registers[0]) (as average)
}
`)

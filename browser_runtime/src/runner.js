import antlr4 from 'antlr4';
import StackDemoLangLexer from './codegen/StackDemoLangLexer.js';
import StackDemoLangParser from './codegen/StackDemoLangParser.js';
import StackDemoLangTranspilingVisitor from './semantics.js';
import {
    ExecutionContext,
    HiddenCallStackFrame,
    VM
} from './interpreter.js';
import {
    showUserOutput
} from './io.js';
import inspect from 'browser-util-inspect'

export function loadVM(input) {
    console.log("Parsing program...")
    let programLines = input.split("\n")
    for (let lineNumber in programLines) {
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
    console.log(inspect(program, {
        showHidden: false,
        depth: null,
        colors: true
    }))

    let mainProcedure = program.procedures.find((procedure) => {
        return procedure.name.toLowerCase() == "main"
    })
    if (mainProcedure) {
        let executionContext = new ExecutionContext(8)
        executionContext.instructionPointer = mainProcedure.address
        executionContext.hiddenCallStack.push(new HiddenCallStackFrame(mainProcedure))
        let vm = new VM(program, executionContext)

        return vm
    } else {
        showUserOutput("There was no main function, not running the program")
    }
}
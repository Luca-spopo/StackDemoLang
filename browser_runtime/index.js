import antlr4 from 'antlr4';
import StackDemoLangLexer from './StackDemoLangLexer.js';
import StackDemoLangParser from './StackDemoLangParser.js';
import StackDemoLangListener from './StackDemoLangListener.js';

const input = `define_procedure average_of_2
contract {
    I promise to pop 2 elements (the numbers to average) and push 1 element (their average) on the stack
    I promise to preserve the value of all registers except: R0, R1
}
body {
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

    stack.push(registers[0]) (as average)
}
`;
const chars = new antlr4.InputStream(input);
const lexer = new StackDemoLangLexer(chars);
const tokens = new antlr4.CommonTokenStream(lexer);
const parser = new StackDemoLangParser(tokens);
parser.buildParseTrees = true;
const tree = parser.program();
console.log(tree);

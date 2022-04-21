grammar StackDemoLang;

program
    : procedure+
    ;

procedure
    : 'define_procedure' procedure_WORD contract body
    ;

procedure_WORD
    : WORD
    ;

contract
    : 'contract' BraceOpen contract_rule+ BraceClose
    ;

body
    : 'body' block
    ;

contract_rule
    : push_and_pop_stack_promise
    | push_only_stack_promise
    | pop_only_stack_promise
    | save_register_promise_except
    ;


push_and_pop_stack_promise
    : 'I promise to pop' WHOLE_NUMBER elements contract_description? 'and push' WHOLE_NUMBER elements contract_description? 'on the stack'
    ;

push_only_stack_promise
    : 'I promise to pop' 'no' elements 'and push' WHOLE_NUMBER elements contract_description? 'on the stack'
    ;

pop_only_stack_promise
    : 'I promise to pop' WHOLE_NUMBER elements contract_description? 'and push' 'no' elements 'on the stack'
    ;

save_register_promise_except
    : 'I promise to preserve the value of all registers except:' (register_arg COMMA?)* register_arg
    ;

contract_description
    : '(' WORD+ ')'
    ;

elements
    : 'element'
    | 'elements'
    ;

statement
    : compound_statement
    | simple_statement
    ;

compound_statement
    : if_statement
    ;

if_statement
    : 'if' '0' '==' register_arg block ('else' (block | if_statement))?
    ;

block
    : BraceOpen statement+ BraceClose
    ;

simple_statement
    : push_from_statement
    | push_statement
    | pop_to_statement
    | add_statement
    | subtract_statement
    | multiply_statement
    | divide_statement
    | input_statement
    | print_statement
    | jump_to_statement
    ;

push_from_statement
    : 'stack' DOT 'push' '(' register_arg ')' informal_label
    ;

push_statement
    : 'stack' DOT 'push' '(' WHOLE_NUMBER ')' informal_label
    ;

pop_to_statement
    : register_arg '=' 'stack' DOT 'pop()' informal_label
    ;

add_statement
    : 'add'
    ;

subtract_statement
    : 'subtract'
    ;

divide_statement
    : 'divide'
    ;

multiply_statement
    : 'multiply'
    ;

input_statement
    : 'input'
    ;

print_statement
    : 'print' register_arg
    ;

jump_to_statement
    : 'jump to' register_arg
    ;

register_arg
    : 'registers[' WHOLE_NUMBER ']'
    ;

informal_label
    : '(' 'as' WORD ')'
    ;

//LEXER

WHOLE_NUMBER: Digit+ ;

COMMA: ',' ;

DOT: '.' ;

LineComment
:   '//' ~[\r\n]*
    -> skip
;

BraceOpen: '{' ;

BraceClose: '}' ;

WORD
    : [a-zA-Z_][a-zA-Z_0-9]*
    ;

fragment
Digit
    : [0-9]
    ;

WS
    : [ \t\u000C\r\n]+ -> skip
    ;

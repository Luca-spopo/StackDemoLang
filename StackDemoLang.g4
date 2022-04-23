grammar StackDemoLang;

program
    : procedure+
    ;

procedure
    : 'define_procedure' procedure_name contract? body
    ;

procedure_name
    : WORD
    ;

contract
    : 'contract' BraceOpen contract_rule+ BraceClose
    ;

body
    : 'body' block
    ;

contract_rule
    : stack_promise
    | register_promise
    ;

stack_promise
    : push_and_pop_stack_promise
    | preserve_stack_promise
    ;

register_promise
    : save_register_promise_except
    | save_all_registers_promise
    ;

preserve_stack_promise
    : 'I promise to preserve the stack'
    ;

push_and_pop_stack_promise
    : 'I promise to pop' pop_contract_count elements contract_description? 'and push' push_contract_count elements contract_description? 'on the stack'
    ;

save_register_promise_except
    : 'I promise to preserve the value of all registers except:' (register_arg COMMA?)* register_arg
    ;

save_all_registers_promise
    : 'I promise to preserve the value of all registers'
    ;

contract_description
    : '(' (WORD | ',' | '|')+ ')'
    ;

pop_contract_count
    : WHOLE_NUMBER
    | 'no'
    ;

push_contract_count
    : WHOLE_NUMBER
    | 'no'
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

directive
    : statement
    | label_declaration
    ;

label_declaration
    : '#' 'LABEL:' DOT WORD
    ;

if_statement
    : 'if' ZERO '==' register_arg block ('else' (block | if_statement))?
    ;

block
    : BraceOpen directive+ BraceClose
    ;

simple_statement
    : push_from_statement
    | push_address_statement
    | push_statement
    | pop_to_statement
    | add_statement
    | subtract_statement
    | multiply_statement
    | divide_statement
    | input_statement
    | print_statement
    | jump_to_register_statement
    | jump_to_label_statement
    ;

push_from_statement
    : 'stack' DOT 'push' '(' register_arg ')' informal_label
    ;

push_address_statement
    : 'stack' DOT 'push' '(' labelled_address_arg ')' informal_label
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
    : 'print' register_arg informal_label
    ;

jump_to_register_statement
    : 'jump to' register_arg
    ;

jump_to_label_statement
    : 'jump to' labelled_address_arg
    ;

labelled_address_arg
    : label_jump_arg
    | proc_jump_arg
    ;

label_jump_arg
    : '#' DOT WORD DOT 'lineNumber'
    ;

proc_jump_arg
    : '#' procedure_name DOT 'lineNumber'
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
    : [a-zA-Z_0-9]+
    | 'no'
    | 'lineNumber'
    | 'add'
    | 'subtract'
    | 'multiply'
    | 'divide'
    | 'if'
    | 'else'
    | 'stack'
    | 'element'
    | 'elements'
    | 'inline'
    ;

fragment
Digit
    : [1-9]
    | ZERO
    ;

ZERO: '0' ;

WS
    : [ \t\u000C\r\n]+ -> skip
    ;

# StackDemoLang
A language to demonstrate the stack and its workings

# The language

The language grammar is defined in StackDemoLang.g4, for use with ANTLR4
https://github.com/antlr/antlr4

Example programs are provided in the examples folder

# Lexing and parsing

Lexer, parser, visitor/listener for the language can be generated by ANTLR

```shell
antlr4 -Dlanguage=JavaScript ./StackDemoLang.g4 -o browser_runtime
```
(This will generate a lexer and parser in javascript)

These generated files have dependencies on the common lexing and parsing runtime provided by ANTLR
This runtime for the parser can be downloaded from the ANTLR website, or from NPM

e.g. `wget http://www.antlr.org/download/antlr-javascript-runtime-4.10.1.zip`
or `npm i antlr4`

The package StackDemoLangRuntime already has antlr4 as a dependency

# Language runtime

The language runtime is a virtual machine written in javascript as well (in interpreter.js)

This virtual machine is modelled after a generic CPU processor, with registers and a stack.

It has some custom features to help visualization and aid conceptualization.

The virtual machine, as well as the language interpreter, can be run with nodeJS locally

It can also be run on a browser using webpack.

# Building

```shell
antlr4 -Dlanguage=JavaScript ./StackDemoLang.g4 -o browser_runtime
( cd browser_runtime ; npm install ; node . )
```

# Debugging

Easiest way to debug the grammar is using the antlr test rig
```shell
grun()
{
   java -Xmx500M -cp "/usr/local/lib/antlr-4.10.1-complete.jar:$CLASSPATH" org.antlr.v4.gui.TestRig "$@"
}
antlr4 ./StackDemoLang.g4 -o java && (cd java ; javac *.java ; grun StackDemoLang program -tokens -gui -tree ../examples/example_program.stackdemo)
```

The way to debug the semantic parser and interpreter, is to debug via nodeJS + chrome devTools
```shell
antlr4 -Dlanguage=JavaScript ./StackDemoLang.g4 -o browser_runtime
( cd browser_runtime ; node --inspect-brk . )
```

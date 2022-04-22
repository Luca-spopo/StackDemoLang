# StackDemoLang
A language to demonstrate the stack and its workings

# The language

The language grammar is defined in StackDemoLang.g4, for use with ANTLR4
https://github.com/antlr/antlr4

Example programs are provided in the examples folder

# Lexing and parsing

Lexer, parser, visitor/listener for the language can be generated by ANTLR

```
antlr4 -Dlanguage=JavaScript ./StackDemoLang.g4 -o browser_runtime
```
(This will generate a lexer and parser in javascript)

# Runtime

A runtime to leverage the generated lexer and parser code can be downloaded from the ANTLR website, or from NPM

e.g. `wget http://www.antlr.org/download/antlr-javascript-runtime-4.10.1.zip`
or `npm i antlr4`

The package StackDemoLangRuntime already has antlr4 as a dependency

The runtime is meant to be run with nodeJS locally
It can also be run on a browser using webpack.

# Building

```
antlr4 -Dlanguage=JavaScript ./StackDemoLang.g4 -o browser_runtime
( cd browser_runtime ; npm install ; node . )
```

# Debugging

Easiest way to debug the grammar is using the antlr test rig
```
grun()
{
   java -Xmx500M -cp "/usr/local/lib/antlr-4.10.1-complete.jar:$CLASSPATH" org.antlr.v4.gui.TestRig "$@"
}
antlr4 ./StackDemoLang.g4 -o java && (cd java ; javac *.java ; grun StackDemoLang program -tokens -gui -tree ../examples/example_program.stackdemo)
```

The way to debug the semantic parser and interpreter build on top of antlr, is to debug nodeJS
```
antlr4 -Dlanguage=JavaScript ./StackDemoLang.g4 -o browser_runtime
( cd browser_runtime ; node inspect . )
```

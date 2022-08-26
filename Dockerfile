FROM any0ne22/antlr4 AS ANTLR4
COPY StackDemoLang.g4 StackDemoLang.g4
RUN "java" "-Xmx500M" "-cp" "/usr/local/lib/antlr4-tool.jar" "org.antlr.v4.Tool" -Dlanguage=JavaScript ./StackDemoLang.g4 -o /browser_runtime/src/codegen

FROM node as NODEJS
COPY browser_runtime/ browser_runtime/
COPY --from=ANTLR4 /browser_runtime/src/codegen browser_runtime/src/codegen
WORKDIR browser_runtime
RUN npm install && npx webpack
ENTRY ["node", "."]
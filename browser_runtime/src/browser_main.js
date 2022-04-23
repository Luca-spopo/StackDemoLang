import { runProgram } from "./runner.js"

window.runProgramInCodeTextArea = () => {
    runProgram(document.getElementById("codeTextArea").value)
}

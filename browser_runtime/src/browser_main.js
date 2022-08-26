import {
    loadVM
} from "./runner.js"
import {
    ProgramVisualizer
} from "./visualization/default_visualizer.js"

window.runProgramInCodeTextArea = () => {
    let program = document.getElementById("codeTextArea").value
    document.getElementById("codeTextArea").remove()
    document.getElementById("runButton").remove()
    document.getElementById("program_canvas").style.display = "initial"
    setTimeout(() => {
        new ProgramVisualizer().runVM(loadVM(program))
    }, 1)
}
import {
    fabric
} from "fabric"

let instructionHeight = 20

const hash = function(str) {
    let h = 0;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h = (h * 50 + ch) % 100000
    }
    return h;
};

export class ProgramVisualizer {
    constructor() {
        this.canvas = null
        this.vm = null
        this.procedureObjects = {}
        this.instructionObjects = {}
    }

    updateInstructionPointer() {
        let vm = this.vm
        if (this.lastHighlightedInstruction) {
            this.lastHighlightedInstruction.item(1).set({
                "fill": `black`
            })
        }
        let instructionToExecute = vm.program.instructionAt(vm.executionContext.instructionPointer)
        let ins = this.instructionObjects[instructionToExecute.lineNumber]
        this.lastHighlightedInstruction = ins

        let executionContextColor = `hsl(${vm.executionContext.id % 360}, 30%, 70%)`

        ins.item(1).set({
            "fill": executionContextColor
        })

        //Create the execution context box(es)

        let executionContextObject = new fabric.Rect({
            left: 0,
            top: 0,
            rx: 18,
            ry: 18,
            fill: executionContextColor,
            width: 400,
            height: 330,
        })
        let executionContextArrow = new fabric.Path(`M ${executionContextObject.width+30} ${executionContextObject.height/2} l -30 -20 l 0 40 z`, {
            fill: executionContextColor
        })
        let registerStaticText = new fabric.Text("Registers", {
            top: 44,
            left: 45,
            fontSize: 16,
            fontWeight: 'bold'
        })
        let stackStaticText = new fabric.Text("Stack", {
            top: 44,
            left: 260,
            fontSize: 16,
            fontWeight: 'bold'
        })
        var registerLabels = []

        for (let register_index in vm.executionContext.registers) {
            let register = vm.executionContext.registers[register_index]
            registerLabels.push(new fabric.Text(`R${register_index}:`, {
                top: 74 + register_index * 25,
                left: 16,
                fontSize: 15,
                fontWeight: 'light'
            }))

            let registerValue = new fabric.Text(`${register.value} (${register.helpfulName})`, {
                top: 74 + register_index * 25,
                left: 30,
                fontSize: 12
            })
            if (register.responsibleProcedureInvocation) {
                registerValue.set({
                    textBackgroundColor: `hsl(${register.responsibleProcedureInvocation.invocationId % 360},20%,90%)`
                })
            }
            registerLabels.push(registerValue)
        }

        let stackbox = new fabric.Rect({
            left: 200,
            top: 73,
            fill: "white",
            opacity: 0.8,
            width: 165,
            height: 237,
        })
        let stackboxText1 = new fabric.Text("Towards 0x0000", {
            originX: 'center',
            originY: 'center',
            textAlign: 'center',
            fill: executionContextColor,
            top: 73 + 237 / 2 - 20,
            left: 200 + 165 / 2,
            fontSize: 12,
            fontWeight: 'italic'
        })
        let stackboxText2 = new fabric.Text("Towards higher memory\naddresses", {
            originX: 'center',
            originY: 'center',
            fill: executionContextColor,
            textAlign: 'center',
            top: 73 + 237 / 2 + 30,
            left: 200 + 165 / 2,
            fontSize: 12,
            fontWeight: 'italic'
        })
        let stackboxArrows = new fabric.Path(`
        M 0 0 m 0 10 l 0 -20
        M 0 0 m 0 10 l -5 -5
        M 0 0 m 0 10 l 5 -5
        M 0 0 m 0 -10 l 5 5
        M 0 0 m 0 -10 l -5 5
        `, {
            stroke: executionContextColor,
            originX: 'center',
            originY: 'center',
            left: stackbox.left + stackbox.width / 2,
            top: stackbox.top + stackbox.height / 2
        })

        //Draw stack values...

        for (let stack_index in vm.executionContext.stack) {
            let stackElement = vm.executionContext.stack[stack_index]
            let stackTextElement = new fabric.Text(`${stackElement.value} (${stackElement.helpfulName})`, {
                originX: "center",
                originY: "bottom",
                left: stackbox.left + stackbox.width / 2,
                top: stackbox.top + stackbox.height - stack_index * 20,
                fontSize: 12
            })
            if (stackElement.responsibleProcedureInvocation) {
                stackTextElement.set({
                    textBackgroundColor: `hsl(${stackElement.responsibleProcedureInvocation.invocationId % 360},20%,90%)`
                })
            }
            registerLabels.push(stackTextElement)
        }

        ////


        let instructionPosition = fabric.util.transformPoint({
            x: 0,
            y: ins.height / 2
        }, ins.calcTransformMatrix())

        if (this.executionContextGroup) {
            this.canvas.remove(this.executionContextGroup)
        }
        this.executionContextGroup = new fabric.Group([executionContextObject, executionContextArrow, registerStaticText, stackStaticText, stackbox, stackboxText1, stackboxText2, stackboxArrows, ...registerLabels], {
            originY: "center",
            left: 10,
            top: instructionPosition.y
        })

        this.canvas.add(this.executionContextGroup)
    }

    setupListeners() {
        //Enable panning
        this.canvas.on('mouse:wheel', function(opt) {
            var e = opt.e;
            var vpt = this.viewportTransform;
            vpt[5] -= e.deltaY;
            this.setViewportTransform(vpt)
            this.requestRenderAll();
        })

        //Enable playing next instruction
        this.canvas.on('mouse:down', async () => {
            this.updateInstructionPointer()
            this.canvas.requestRenderAll()
            setTimeout(async () => {
                await this.vm.tick()
            }, 100)
        })
    }

    setupStaticStuff() {
        var procedureOffset = 30
        let vm = this.vm
        for (let procedure_index in vm.program.procedures) {
            let procedure = vm.program.procedures[procedure_index]
            let procedureColor = (procedure_index * 80) % 360
            let baseRect = new fabric.Rect({
                left: 0,
                rx: 18,
                ry: 18,
                top: 0,
                fill: `hsl(${procedureColor}, 48%, 92%)`,
                width: 425,
                height: 52 + procedure.instructions.length * instructionHeight + 8,
            })

            let nameRect = new fabric.Rect({
                left: 0,
                top: 18,
                fill: 'rgba(196, 196, 196, 0.5)',
                width: 425,
                height: 30,
            })

            let nameText = new fabric.Text(procedure.name, {
                left: 50,
                top: 25,
                fontSize: 16,
                fontWeight: 'bold',
                // width: 425,
                // height: 20,
            })

            let lineGutter = new fabric.Rect({
                left: 0,
                top: 0,
                fill: 'rgba(196, 196, 196, 0.3)',
                width: 28,
                height: procedure.instructions.length * instructionHeight + 12,
            })

            var instructionsList = []

            for (let instruction_index in procedure.instructions) {
                let instruction = procedure.instructions[instruction_index]
                let lineNumberText = new fabric.Text(instruction.lineNumber.toString(), {
                    fontSize: 12,
                    top: 0,
                })

                let instructionText = new fabric.Text(instruction.text, {
                    fontSize: 12,
                    left: 30,
                    top: 0,
                })

                let singleInstructionGroup = new fabric.Group([lineNumberText, instructionText], {
                    top: instruction_index * instructionHeight + 8,
                    left: 5,
                })

                this.instructionObjects[instruction.lineNumber] = singleInstructionGroup

                instructionsList.push(singleInstructionGroup)
            }

            let instructionsGroup = new fabric.Group([lineGutter, ...instructionsList], {
                left: 22,
                top: 48
            })

            let procedureGroup = new fabric.Group([baseRect, nameRect, nameText, instructionsGroup], {
                left: 430,
                top: procedureOffset
            })

            this.procedureObjects[procedure.name] = procedureGroup

            this.canvas.add(procedureGroup)

            procedureOffset += 30 + procedureGroup.height
        }

        //Second pass, to set up arrows for jump instructions

        let temp = this.procedureObjects[Object.keys(this.procedureObjects)[0]]
        var JUMPLINE_X = temp.left + temp.width + 12

        for (let instruction of vm.program.instructions) {
            let jumpInfo = instruction.visualizationInfo.jump
            if (jumpInfo) {
                let sourceLineNumber = instruction.lineNumber
                var destLineNumber = parseInt(jumpInfo)
                let sourceInstructionObject = this.instructionObjects[sourceLineNumber]
                let sourcePosition = fabric.util.transformPoint({
                    x: sourceInstructionObject.width / 2 + 50,
                    y: sourceInstructionObject.height / 2
                }, sourceInstructionObject.calcTransformMatrix())
                if (destLineNumber) {
                    JUMPLINE_X += 10
                    destLineNumber = vm.program.instructionAt(destLineNumber).lineNumber
                    let destInstructionObject = this.instructionObjects[destLineNumber]
                    let destPosition = fabric.util.transformPoint({
                        x: destInstructionObject.width / 2 + 50,
                        y: -destInstructionObject.height / 2
                    }, destInstructionObject.calcTransformMatrix())

                    let path = new fabric.Path(`M ${sourcePosition.x} ${sourcePosition.y} L ${JUMPLINE_X} ${sourcePosition.y} L ${JUMPLINE_X} ${destPosition.y}  L ${destPosition.x} ${destPosition.y} l 5 5 m -5 -5 l 5 -5`)
                    path.set({
                        fill: "transparent",
                        stroke: "black",
                        opacity: 0.3
                    })
                    if (instruction.visualizationInfo.jump_is_conditional) {
                        path.set({
                            strokeDashArray: [5, 5]
                        })
                    }
                    this.canvas.add(path)
                } else if (typeof(jumpInfo) == "string" && jumpInfo.startsWith("R_")) {
                    let path = new fabric.Path(`M ${sourcePosition.x} ${sourcePosition.y} L ${temp.left + temp.width + 10} ${sourcePosition.y} l -5 -5 m 5 5 l -5 5`)
                    let questionMark = new fabric.Text("?", {
                        left: temp.left + temp.width + 10,
                        top: sourcePosition.y - 14,
                        fontSize: 14,
                        opacity: 0.3
                    })
                    path.set({
                        fill: "transparent",
                        stroke: "black",
                        opacity: 0.3
                    })
                    this.canvas.add(path)
                    this.canvas.add(questionMark)
                }
            }
        }
    }

    runVM(vm) {
        this.canvas = new fabric.Canvas('program_canvas')
        fabric.Object.prototype.selectable = false;
        fabric.Text.prototype.fontFamily = 'Helvetica'
        fabric.Text.prototype.fontSize = 16
        this.vm = vm
        this.setupListeners()
        this.setupStaticStuff()
    }
}
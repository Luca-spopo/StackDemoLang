import { fabric } from "fabric"

let instructionHeight = 20

const hash = function(str) {
    let h = 0;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h = (h*50 + ch)%100000
    }
    return h;
};

export class ProgramVisualizer
{
    constructor()
    {
        this.canvas = null
        this.vm = null
        this.procedureObjects = {}
        this.instructionObjects = {}
    }

    update() {

    }

    visualizeProgram(vm) {
        this.canvas = new fabric.Canvas('program_canvas')
        this.vm = vm

        //Enable panning
        this.canvas.on('mouse:wheel', function(opt) {
            var e = opt.e;
            var vpt = this.viewportTransform;
            vpt[5] -= e.deltaY;
            this.setViewportTransform(vpt)
            this.requestRenderAll();
        })

        var procedureOffset = 30
        for(let procedure_index in vm.program.procedures)
        {
            let procedure = vm.program.procedures[procedure_index]
            let procedureColor = (procedure_index*80)%360         
            let baseRect = new fabric.Rect({
                left: 0,
                rx: 18, ry: 18,
                top: 0,
                fill: 'hsl('+procedureColor+', 48%, 92%)',
                width: 425,
                height: 52+procedure.instructions.length*instructionHeight+8,
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
                fontFamily: 'Helvetica',
                // width: 425,
                // height: 20,
              })

              let lineGutter = new fabric.Rect({
                left: 0,
                top: 0,
                fill: 'rgba(196, 196, 196, 0.3)',
                width: 28,
                height: procedure.instructions.length*instructionHeight+12,
              })

            var instructionsList = []

            for(let instruction_index in procedure.instructions)
            {
                let instruction = procedure.instructions[instruction_index]
                let lineNumberText = new fabric.Text(instruction.lineNumber.toString(), {
                    fontSize: 12,
                    top: 0,
                    fontFamily: 'Helvetica',
                })
    
                let instructionText = new fabric.Text(instruction.text, {
                    fontSize: 12,
                    fontFamily: 'Helvetica',
                    left: 30,
                    top: 0,
                })

                let singleInstructionGroup = new fabric.Group([lineNumberText, instructionText], {
                    top: instruction_index*instructionHeight+8,
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
                left: 100,
                top: procedureOffset
            })

            this.procedureObjects[procedure.name] = procedureGroup
              
            this.canvas.add(procedureGroup)

            procedureOffset += 30 + procedureGroup.height
        }

        //Second pass, to set up arrows for jump instructions
        
        let temp = this.procedureObjects[Object.keys(this.procedureObjects)[0]]
        var JUMPLINE_X = temp.left + temp.width + 12

        for(let instruction of vm.program.instructions)
        {
            let jumpInfo = instruction.visualizationInfo.jump
            if (jumpInfo) {
                let sourceLineNumber = instruction.lineNumber
                var destLineNumber = parseInt(jumpInfo)
                let sourceInstructionObject = this.instructionObjects[sourceLineNumber]
                let sourcePosition = fabric.util.transformPoint({x: sourceInstructionObject.width/2  + 50, y: sourceInstructionObject.height/2}, sourceInstructionObject.calcTransformMatrix())
                if(destLineNumber)
                {
                    JUMPLINE_X += 10
                    destLineNumber = vm.program.instructionAt(destLineNumber).lineNumber
                    let destInstructionObject = this.instructionObjects[destLineNumber]
                    let destPosition = fabric.util.transformPoint({x: destInstructionObject.width/2 + 50, y: -destInstructionObject.height/2}, destInstructionObject.calcTransformMatrix())

                    let path = new fabric.Path(`M ${sourcePosition.x} ${sourcePosition.y} L ${JUMPLINE_X} ${sourcePosition.y} L ${JUMPLINE_X} ${destPosition.y}  L ${destPosition.x} ${destPosition.y} l 5 5 m -5 -5 l 5 -5`)
                    path.set({fill: "transparent", stroke: "black", opacity: 0.3})
                    this.canvas.add(path)
                }
                else if(typeof(jumpInfo) == "string" && jumpInfo.startsWith("R_")) {
                    let path = new fabric.Path(`M ${sourcePosition.x} ${sourcePosition.y} L ${temp.left + temp.width + 10} ${sourcePosition.y} l -5 -5 m 5 5 l -5 5`)
                    let questionMark = new fabric.Text("?", {left: temp.left + temp.width + 10, top: sourcePosition.y - 14, fontSize: 14, fontFamily: 'Helvetica', opacity: 0.3})
                    path.set({fill: "transparent", stroke: "black", opacity: 0.3})
                    this.canvas.add(path)
                    this.canvas.add(questionMark)
                }
            }
        }
    }
}
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
        this.procedures = {}
    }

    update() {

    }

    visualizeProgram(vm) {
        this.canvas = new fabric.Canvas('program_canvas')
        this.vm = vm

        var procedureOffset = 30
        for(let procedure_index in vm.program.procedures)
        {
            let procedure = vm.program.procedures[procedure_index]
            let procedureColor = hash(procedure.name)%360         
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
                console.log("LUCA: "+instruction_index)
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

            this.procedures[procedure.name] = procedureGroup
              
            this.canvas.add(procedureGroup)

            procedureOffset += 30 + procedureGroup.height
        }
    }
}
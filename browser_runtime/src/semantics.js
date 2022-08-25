import StackDemoLangParser from './codegen/StackDemoLangParser.js';
import { ThunkGenerators } from './interpreter.js';

class Instruction
{
    constructor(lineNumber, text, thunk, visualizationInfo)
    {
        this.lineNumber = lineNumber
        this.text = text
        this.thunk = thunk
        this.visualizationInfo = visualizationInfo
    }
}

class Program
{
    constructor()
    {
        this.procedures = []
        this.instructions = []
    }
    instructionAt(lineNumber)
    {
        var candidateInstruction = null
        for(let instruction of this.instructions)
        {
            if(instruction.lineNumber == lineNumber)
            {
                return instruction
            }
            if(instruction.lineNumber > lineNumber)
            {
                if(candidateInstruction == null || instruction.lineNumber < candidateInstruction.lineNumber)
                {
                    candidateInstruction = instruction
                }
            }
        }
        return candidateInstruction
    }
}

class Contract {}

class StackContract extends Contract {}
class RegisterContract extends Contract {}

class Procedure
{
    constructor(name, address)
    {
        this.instructions = []
        this.contracts = []
        this.name = name
        this.address = address
    }
}

StackDemoLangParser.Labelled_address_argContext.prototype.resolveAddress = function(programCtx, procedureCtx)
{
    let procJumpArgCtx = this.proc_jump_arg()
    if(procJumpArgCtx)
    {
        let targetProcName = procJumpArgCtx.procedure_name().getText()
        let targetProc = programCtx.procedure(null).find((procedureCtx) => {
            return procedureCtx.procedure_name().getText() == targetProcName
        })
        if(targetProc)
        {
            return targetProc.getAddress()
        }
        else
        {
            throw `Cannot resolve address of procedure with name ${targetProcName}`
        }
    }

    let labelJumpArgCtx = this.label_jump_arg()
    if(labelJumpArgCtx)
    {
        let targetLabelName = labelJumpArgCtx.WORD().getText()
        let targetLabel = procedureCtx.getAllLabelDeclarations().find((labelDeclarationCtx) => {
            return labelDeclarationCtx.WORD().getText() == targetLabelName
        })
        if(targetLabel)
        {
            return targetLabel.getAddress()
        }
        else
        {
            throw `Cannot resolve address of procedure with name ${targetLabel}`
        }
    }

    throw "Unsupported jump address arg"
}

StackDemoLangParser.ProcedureContext.prototype.getAddress = function()
{
    let directives = this.body().block().directive(null)
    for(let directiveCtx of directives)
    {
        let statementCtx = directiveCtx.statement()
        if(statementCtx)
        {
            return statementCtx.start.line
        }
    }
    return this.body().start.line
}

StackDemoLangParser.ProcedureContext.prototype.getAllLabelDeclarations = function()
{
    return this.body().block().directive(null).flatMap((directiveCtx) =>
    {
        return directiveCtx.label_declaration() ?? []
    })
}

StackDemoLangParser.Label_declarationContext.prototype.getAddress = function()
{
    return this.start.line
}

export default class StackDemoLangTranspilingVisitor
{
    visitChildren(ctx) {
        if (!ctx) {
            return;
        }

        if(ctx instanceof StackDemoLangParser.ProgramContext)
        {
            return this.visitProgram(ctx)
        }
    }

    visitProgram(ctx)
    {
        let program = new Program()
        for(let procedureCtx of ctx.procedure(null))
        {
            let [procedure, instructions] = this.visitProcedure(procedureCtx, ctx)
            program.procedures.push(procedure)
            program.instructions = program.instructions.concat(instructions)
        }
        return program
    }

    visitProcedure(ctx, programContext)
    {
        let name = ctx.procedure_name().getText()
        let contracts = this.visitProcedureContracts(ctx.contract())
        let instructions = this.visitProcedureBody(ctx.body(), programContext, ctx)
        let address = ctx.getAddress()
        let procedure = new Procedure(name, address)
        procedure.contracts = contracts
        procedure.instructions = instructions
        return [procedure, instructions]
    }

    visitProcedureContracts(ctx)
    {
        return ctx?.contract_rule(null).map(contract_rule_ctx => {
            let stackContractCtx = contract_rule_ctx.stack_promise()
            if(stackContractCtx != null)
            {
                let expectedPopCount = parseInt(stackContractCtx.getChild(0)?.pop_contract_count()?.WHOLE_NUMBER()?.getText() ?? "0")
                let expectedPushCount = parseInt(stackContractCtx.getChild(0)?.push_contract_count()?.WHOLE_NUMBER()?.getText() ?? "0")
                let stackContract = new StackContract()
                stackContract.expectedPopCount = expectedPopCount
                stackContract.expectedPushCount = expectedPushCount
                return stackContract
            }
            let registerContractCtx = contract_rule_ctx.register_promise()
            if(registerContractCtx != null)
            {
                let callerSavedRegisters;
                let exceptRegistersCtx = registerContractCtx.save_register_promise_except()
                let allRegistersCtx = registerContractCtx.save_all_registers_promise()
                if(exceptRegistersCtx)
                {
                    callerSavedRegisters = exceptRegistersCtx.register_arg(null).map((registerArgCtx) => {
                        return this.getRegisterIndexFromRegisterArg(registerArgCtx)
                    })    
                }
                else if(allRegistersCtx)
                {
                    callerSavedRegisters = []
                }
                else
                {
                    throw "Unknown register promise"
                }
                let registerContract = new RegisterContract()
                registerContract.callerSavedRegisters = callerSavedRegisters
                return registerContract
            }
        }) ?? []
    }

    visitProcedureBody(ctx, programContext, procedureContext)
    {
        let blockCtx = ctx.block()
        return this.produceInstructionsFromBlock(blockCtx, programContext, procedureContext)
    }

    getRegisterIndexFromRegisterArg(registerArgCtx)
    {
        return parseInt(registerArgCtx.WHOLE_NUMBER().getText())
    }

    produceInstructionsFromBlock(blockCtx, programContext, procedureContext)
    {
        return blockCtx.directive(null).flatMap((directiveCtx) => {
            let statementCtx = directiveCtx.statement()
            let labelDeclarationCtx = directiveCtx.label_declaration()
            if(statementCtx)
            {
                let simpleStatementCtx = statementCtx.simple_statement()
                if(simpleStatementCtx != null)
                {
                    return [this.produceInstructionFromSimpleStatement(simpleStatementCtx, programContext, procedureContext)]
                }
                else
                {
                    throw "Compound statements not supported yet by this parser"
                }
            }
            else if(labelDeclarationCtx)
            {
                //Nothing to do
                return []
            }
            else
            {
                throw "Unknown directive"
            }
        })
        .flat()
    }

    produceInstructionFromSimpleStatement(simpleStatementCtx, programContext, procedureContext)
    {
        var thunk = null
        var representativeText = simpleStatementCtx.start.getInputStream().getText(simpleStatementCtx.start.start, simpleStatementCtx.stop.stop)
        var visualizationInfo = {}

        {
            let ctx = simpleStatementCtx.push_statement()
            if(ctx != null)
            {
                let value = ctx.WHOLE_NUMBER()
                let helpfulName = ctx.informal_label().WORD().getText()
                thunk = ThunkGenerators.forPush(value, helpfulName)
            }
        }

        {
            let ctx = simpleStatementCtx.push_address_statement()
            if(ctx != null)
            {
                let labelArgCtx = ctx.labelled_address_arg()
                let helpfulName = ctx.informal_label().WORD().getText()
                let address = labelArgCtx.resolveAddress(programContext, procedureContext)
                thunk = ThunkGenerators.forPush(address, helpfulName)
                representativeText = `stack.push(${address}) (as ${helpfulName})`
            }
        }


        {
            let ctx = simpleStatementCtx.push_from_statement()
            if(ctx != null)
            {
                let registerArgCtx = ctx.register_arg()
                let registerIndex = this.getRegisterIndexFromRegisterArg(registerArgCtx)
                let helpfulName = ctx.informal_label().WORD().getText()
                thunk = ThunkGenerators.forPushFrom(registerIndex, helpfulName)
            }
        }

        {
            let ctx = simpleStatementCtx.pop_to_statement()
            if(ctx != null)
            {
                let registerArgCtx = ctx.register_arg()
                let registerIndex = this.getRegisterIndexFromRegisterArg(registerArgCtx)
                let helpfulName = ctx.informal_label().WORD().getText()
                thunk = ThunkGenerators.forPopTo(registerIndex, helpfulName)
            }
        }

        {
            let ctx = simpleStatementCtx.add_statement()
            if(ctx != null)
            {
                thunk = ThunkGenerators.forAdd()
            }
        }

        {
            let ctx = simpleStatementCtx.subtract_statement()
            if(ctx != null)
            {
                thunk = ThunkGenerators.forSubtract()
            }
        }

        {
            let ctx = simpleStatementCtx.multiply_statement()
            if(ctx != null)
            {
                thunk = ThunkGenerators.forMultiply()
            }
        }

        {
            let ctx = simpleStatementCtx.divide_statement()
            if(ctx != null)
            {
                thunk = ThunkGenerators.forDivide()
            }
        }

        {
            let ctx = simpleStatementCtx.input_statement()
            if(ctx != null)
            {
                thunk = ThunkGenerators.forInput()
            }
        }

        {
            let ctx = simpleStatementCtx.print_statement()
            if(ctx != null)
            {
                let registerArgCtx = ctx.register_arg()
                let registerIndex = this.getRegisterIndexFromRegisterArg(registerArgCtx)
                let helpfulName = ctx.informal_label().WORD().getText()
                thunk = ThunkGenerators.forPrint(registerIndex, helpfulName)
            }
        }

        {
            let ctx = simpleStatementCtx.jump_to_register_statement()
            if(ctx != null)
            {
                let registerArgCtx = ctx.register_arg()
                let registerIndex = this.getRegisterIndexFromRegisterArg(registerArgCtx)
                thunk = ThunkGenerators.forJumpToRegister(registerIndex)
                visualizationInfo = {"jump":"R_"+registerIndex}
            }
        }

        {
            let ctx = simpleStatementCtx.jump_to_label_statement()
            if(ctx != null)
            {
                let labelArgCtx = ctx.labelled_address_arg()
                let address = labelArgCtx.resolveAddress(programContext, procedureContext)
                thunk = ThunkGenerators.forJumpToAddress(address)
                representativeText = `jump to (${address}) //${labelArgCtx.getText()}`
                visualizationInfo = {"jump":address}
            }
        }

        return new Instruction(simpleStatementCtx.start.line, representativeText, thunk, visualizationInfo)
    }
}

import StackDemoLangListener from './StackDemoLangListener.js';
import StackDemoLangParser from './StackDemoLangParser.js';
import { ThunkGenerators } from './interpreter.js';
import util from 'util'

const DONT_CARE = {}

class Instruction
{
    constructor(lineNumber, text, thunk)
    {
        this.lineNumber = lineNumber
        this.text = text
        this.thunk = thunk
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
        for(instruction in this.instructions)
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
        this.contracts = []
        this.name = name
        this.address = address
    }
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
            let [procedure, instructions] = this.visitProcedure(procedureCtx)
            program.procedures.push(procedure)
            program.instructions = program.instructions.concat(instructions)
        }
        console.log("Program's semantics were parsed as follows:")
        console.log(util.inspect(program, {showHidden: false, depth: null, colors: true}))
        return program
    }

    visitProcedure(ctx)
    {
        let name = ctx.procedure_name().getText()
        let contracts = this.visitProcedureContracts(ctx.contract())
        let instructions = this.visitProcedureBody(ctx.body())
        let address = instructions.length > 0 ? instructions[0].lineNumber : ctx.body().start.line
        let procedure = new Procedure(name, address)
        procedure.contracts = contracts
        return [procedure, instructions]
    }

    visitProcedureContracts(ctx)
    {
        return ctx.contract_rule(null).map(contract_rule_ctx => {
            let stackContractCtx = contract_rule_ctx.stack_promise()
            if(stackContractCtx != null)
            {
                let expectedPopCount = parseInt(stackContractCtx.getChild(0)?.pop_contract_count()?.getText() ?? "0")
                let expectedPushCount = parseInt(stackContractCtx.getChild(0)?.push_contract_count()?.getText() ?? "0")
                let stackContract = new StackContract()
                stackContract.expectedPopCount = expectedPopCount
                stackContract.expectedPushCount = expectedPushCount
                return stackContract
            }
            let registerContractCtx = contract_rule_ctx.save_register_promise_except()
            if(registerContractCtx != null)
            {
                let except_registers = registerContractCtx.register_arg(null).map((registerArgCtx) => {
                    return this.getRegisterIndexFromRegisterArg(registerArgCtx)
                })
                let registerContract = new RegisterContract()
                registerContract.callerSavedRegisters = except_registers
                return registerContract
            }
        })
    }

    visitProcedureBody(ctx)
    {
        let blockCtx = ctx.block()
        return this.produceInstructionsFromBlock(blockCtx)
    }

    getRegisterIndexFromRegisterArg(registerArgCtx)
    {
        return parseInt(registerArgCtx.WHOLE_NUMBER().getText())
    }

    produceInstructionsFromBlock(blockCtx)
    {
        return blockCtx.statement(null).map((statementCtx) => {
            let simpleStatementCtx = statementCtx.simple_statement()
            if(simpleStatementCtx != null)
            {
                return this.produceInstructionFromSimpleStatement(simpleStatementCtx)
            }
            else
            {
                throw "Compound statements not supported yet by this parser"
            }
        })
        .flat()
    }

    produceInstructionFromSimpleStatement(simpleStatementCtx)
    {
        var thunk = null

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
            let ctx = simpleStatementCtx.jump_to_statement()
            if(ctx != null)
            {
                let registerArgCtx = ctx.register_arg()
                let registerIndex = this.getRegisterIndexFromRegisterArg(registerArgCtx)
                thunk = ThunkGenerators.forJumpTo(registerIndex)
            }
        }

        return new Instruction(simpleStatementCtx.start.line, simpleStatementCtx.start.getInputStream().getText(simpleStatementCtx.start.start, simpleStatementCtx.stop.stop), thunk)
    }
}

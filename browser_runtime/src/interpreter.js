import { showUserOutput, getUserInput, dimOutput, resetOutputFormat } from "./io.js"

const DONT_CARE = {}

export class ExecutionContextState
{
    constructor(instructionPointer, registers, stack, hiddenCallStack)
    {
        self.instructionPointer = instructionPointer
        self.registers = registers.slice(0)
        self.stack = stack.slice(0)
        self.hiddenCallStack = hiddenCallStack.slice(0)
    }
}

export class ExecutionContext
{
    constructor(registerCount)
    {
        this.registers = []
        for(let i=0; i<registerCount; i++)
        {
            this.registers.push(new RegisterElement(Math.floor(Math.random() * 65025), "junk_value"))
        }
        this.registerCount = registerCount
        this.stack = []
        this.hiddenCallStack = []
        this.previousStates = []
        this.instructionPointer = 0
        this.id = Math.floor(Math.random()*999)
    }

    saveState()
    {
        self.previousStates.push(new ExecutionContextState(self.instructionPointer, self.registers, self.stack, self.hiddenCallStack))
    }

    startUndefinedBehavior(reason)
    {
        //TODO: Make UI have warnings about UB, along with the reason
    }
}

export class HiddenCallStackFrame
{
    constructor(procedure)
    {
        this.procedure = procedure
        this.invocationId = Math.floor(Math.random()*999)
    }
}

class DataElement
{
    constructor(value, helpfulName, responsibleProcedureInvocation)
    {
        this.value = value
        this.helpfulName = helpfulName
        this.responsibleProcedureInvocation = responsibleProcedureInvocation
    }
}

class StackElement extends DataElement {}
class RegisterElement extends DataElement {}

class Invariant {}

class StackInvariant extends Invariant
{
    constructor(expectedStackPrefix, expectedStackCount)
    {
        assert(expectedStackCount >= expectedStackPrefix.length)
        this.expectedStackPrefix = expectedStackPrefix
        this.expectedStackCount = expectedStackCount
    }
    check(execution_context)
    {
        if(execution_context.stack.length != this.expectedStackCount)
        {
            return false
        }

        for(element_index = 0 ; element_index < this.expectedStackPrefix.length ; element_index++)
        {
            if(execution_context.stack[element_index] != this.expectedStackPrefix[element_index])
            {
                return false
            }
        }

        return true
    }
}

class RegisterInvariant extends Invariant
{
    constructor(expectedRegisters)
    {
        this.expectedRegisters = expectedRegisters
    }
    check(execution_context)
    {
        for(element_index = 0 ; element_index < this.expectedRegisters.length ; element_index++)
        {
            if(this.expectedRegisters[element_index] != DONT_CARE) {
                if(execution_context.registers[element_index] != this.expectedRegisters[element_index])
                {
                    return false
                }
            }
        }

        return true
    }
}


const _latestInvocation = function(executionContext)
{
    return executionContext.hiddenCallStack.at(-1)
}

const _addThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(lhs + rhs, "add_operation_result", _latestInvocation(executionContext)))
}

const _subtractThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(lhs - rhs, "add_operation_result", _latestInvocation(executionContext)))
}

const _multiplyThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(lhs * rhs, "add_operation_result", _latestInvocation(executionContext)))
}

const _divideThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(parseInt(lhs / rhs), "add_operation_result", _latestInvocation(executionContext)))
}

const _inputThunk = async function(executionContext)
{
    var inputInteger = NaN
    while(isNaN(inputInteger) || inputInteger < 0) {
        inputInteger = parseInt(await getUserInput("Please enter a whole number"))
    }
    executionContext.stack.push(new StackElement(inputInteger, "user_input", _latestInvocation(executionContext)))
}

export class ThunkGenerators
{
    static forPopTo(registerIndex, helpfulName)
    {
        return async function(executionContext)
        {
            let stackElement = executionContext.stack.pop()
            if(stackElement)
            {
                executionContext.registers[registerIndex] = new RegisterElement(stackElement.value, helpfulName, _latestInvocation(executionContext))
            }
            else
            {
                executionContext.startUndefinedBehavior("Reached the bottom of the stack")
                executionContext.registers[registerIndex] = new RegisterElement(Math.floor(Math.random() * 65025), helpfulName, _latestInvocation(executionContext))
            }
        }
    }

    static forPushFrom(registerIndex, helpfulName)
    {
        return async function(executionContext)
        {
            executionContext.stack.push(new StackElement(executionContext.registers[registerIndex].value, helpfulName, _latestInvocation(executionContext)))
        }
    }

    static forPush(value, helpfulName)
    {
        return async function(executionContext)
        {
            executionContext.stack.push(new StackElement(parseInt(value), helpfulName, _latestInvocation(executionContext)))
        }
    }

    static forAdd()
    {
        return _addThunk
    }

    static forSubtract()
    {
        return _subtractThunk
    }

    static forMultiply()
    {
        return _multiplyThunk
    }

    static forDivide()
    {
        return _divideThunk
    }

    static forInput()
    {
        return _inputThunk
    }

    static forPrint(registerIndex, helpfulName)
    {
        return async function(executionContext)
        {
            let registerElement = executionContext.registers[registerIndex]
            await showUserOutput(`Program Output: ${helpfulName} is ${registerElement.value}`)
        }
    }

    static forJumpToRegister(registerIndex)
    {
        return async function(executionContext)
        {
            executionContext.instructionPointer = executionContext.registers[registerIndex].value
        }
    }

    static forJumpToAddress(address)
    {
        return async function(executionContext)
        {
            executionContext.instructionPointer = address
        }
    }
}

export class Core
{
    constructor(program, executionContext)
    {
        this.program = program
        this.executionContext = executionContext
    }
    async tick()
    {
        let instruction = this.program.instructionAt(this.executionContext.instructionPointer)
        if(instruction)
        {
            this.executionContext.instructionPointer = instruction.lineNumber + 1
            console.log(`\n>> Executing instruction ${instruction.lineNumber}: ${instruction.text}`)
            await instruction.thunk(this.executionContext)    
            dimOutput()
            console.log(`stack:`)
            if(this.executionContext.stack.length > 0)
            {
                console.log(`${this.executionContext.stack.map((element) => `${element.value} (${element.helpfulName})\n`).join("")}`)
            }
            else
            {
                console.log("<Stack is empty>\n")
            }
            console.log(`registers:`)
            let registers = this.executionContext.registers
            for(let registerIndex in registers)
            {
                let element = registers[registerIndex]
                console.log(`R${registerIndex} : ${element.value} (${element.helpfulName})`)
            }
            resetOutputFormat()
        }
        else
        {
            this.executionContext.startUndefinedBehavior("Instruction pointer went outside the program bounds")
        }
    }
}

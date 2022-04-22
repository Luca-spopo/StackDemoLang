class ExecutionContext
{
    constructor()
    {
        this.registers = []
        this.stack = []
        this.hiddenCallStack = []
        this.instructionPointer = 0
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
        assert(expectedStackCount >= expectedStackPrefix.count)
        this.expectedStackPrefix = expectedStackPrefix
        this.expectedStackCount = expectedStackCount
    }
    check(execution_context)
    {
        if(execution_context.stack.count != this.expectedStackCount)
        {
            return false
        }

        for(element_index = 0 ; element_index < this.expectedStackPrefix.count ; element_index++)
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
        for(element_index = 0 ; element_index < this.expectedRegisters.count ; element_index++)
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


const _latestProcedure = function(executionContext)
{
    return executionContext.hiddenCallStack.at(-1).procedure
}

const _addThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(lhs + rhs, "add_operation_result", _latestProcedure(executionContext)))
}

const _subtractThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(lhs - rhs, "add_operation_result", _latestProcedure(executionContext)))
}

const _multiplyThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(lhs * rhs, "add_operation_result", _latestProcedure(executionContext)))
}

const _divideThunk = async function(executionContext)
{
    let rhs = executionContext.stack.pop().value
    let lhs = executionContext.stack.pop().value
    executionContext.stack.push(new StackElement(lhs / rhs, "add_operation_result", _latestProcedure(executionContext)))
}

const _inputThunk = async function(executionContext)
{
    var inputInteger = NaN
    while(inputInteger == NaN) {
        inputInteger = parseInt(await getUserInput("Please enter a whole number"))
    }
    executionContext.stack.push(new StackElement(inputInteger, "user_input", _latestProcedure(executionContext)))
}

export class ThunkGenerators
{
    static forPopTo(registerIndex, helpfulName)
    {
        return async function(executionContext)
        {
            let stackElement = executionContext.stack.pop()
            executionContext.registers[registerIndex] = new RegisterElement(stackElement.value, helpfulName, _latestProcedure(executionContext))
        }
    }

    static forPushFrom(registerIndex, helpfulName)
    {
        return async function(executionContext)
        {
            executionContext.stack.push(new StackElement(executionContext.registers[registerIndex], helpfulName, _latestProcedure(executionContext)))
        }
    }

    static forPush(value, helpfulName)
    {
        return async function(executionContext)
        {
            executionContext.stack.push(new StackElement(parseInt(value), helpfulName, _latestProcedure(executionContext)))
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
            let stackElement = executionContext.registers[registerIndex]
            await showUserOutput(`Program Output: ${helpfulName} is ${stackElement.value}`)
        }
    }

    static forJumpTo(registerIndex)
    {
        return async function(executionContext)
        {
            executionContext.instructionPointer = executionContext.registers[registerIndex]
        }
    }
}
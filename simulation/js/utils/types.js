// js/utils/types.js

// Instruction types
const INSTRUCTION_TYPES = {
    LOAD: "LD",
    STORE: "SD",
    INTEGER_ALU: "DADD",
    INTEGER_SUB: "DSUB",
    FP_ADD: "ADDD",
    FP_SUB: "SUBD",
    FP_MULT: "MULTD",
    FP_DIV: "DIVD",
    AND: "AND",
    OR: "OR",
    XOR: "XOR"
};

// Functional unit types
const FUNCTIONAL_UNITS = {
    INTEGER: "Integer",
    FP_ADDER: "FP Adder",
    FP_MULTIPLIER: "FP Multiplier",
    FP_DIVIDER: "FP Divider"
};

// Instruction status stages
const INSTRUCTION_STAGES = {
    ISSUE: "Issue",
    READ_OPERANDS: "Read Operands",
    EXECUTION_COMPLETE: "Execution Complete",
    WRITE_RESULT: "Write Result"
};

// Default execution cycles for each instruction type
const DEFAULT_EXECUTION_CYCLES = {
    [INSTRUCTION_TYPES.LOAD]: 1,
    [INSTRUCTION_TYPES.STORE]: 1,
    [INSTRUCTION_TYPES.INTEGER_ALU]: 1,
    [INSTRUCTION_TYPES.INTEGER_SUB]: 1,
    [INSTRUCTION_TYPES.FP_ADD]: 2,
    [INSTRUCTION_TYPES.FP_SUB]: 2,
    [INSTRUCTION_TYPES.FP_MULT]: 10,
    [INSTRUCTION_TYPES.FP_DIV]: 40,
    [INSTRUCTION_TYPES.AND]: 1,
    [INSTRUCTION_TYPES.OR]: 1,
    [INSTRUCTION_TYPES.XOR]: 1
};

// Mapping between instruction types and functional units
const INSTRUCTION_TO_FUNCTIONAL_UNIT = {
    [INSTRUCTION_TYPES.LOAD]: FUNCTIONAL_UNITS.INTEGER,
    [INSTRUCTION_TYPES.STORE]: FUNCTIONAL_UNITS.INTEGER,
    [INSTRUCTION_TYPES.INTEGER_ALU]: FUNCTIONAL_UNITS.INTEGER,
    [INSTRUCTION_TYPES.INTEGER_SUB]: FUNCTIONAL_UNITS.INTEGER,
    [INSTRUCTION_TYPES.FP_ADD]: FUNCTIONAL_UNITS.FP_ADDER,
    [INSTRUCTION_TYPES.FP_SUB]: FUNCTIONAL_UNITS.FP_ADDER,
    [INSTRUCTION_TYPES.FP_MULT]: FUNCTIONAL_UNITS.FP_MULTIPLIER,
    [INSTRUCTION_TYPES.FP_DIV]: FUNCTIONAL_UNITS.FP_DIVIDER,
    [INSTRUCTION_TYPES.AND]: FUNCTIONAL_UNITS.INTEGER,
    [INSTRUCTION_TYPES.OR]: FUNCTIONAL_UNITS.INTEGER,
    [INSTRUCTION_TYPES.XOR]: FUNCTIONAL_UNITS.INTEGER
};

// Generate FP registers F0-F31
const FP_REGISTERS = Array.from({ length: 32 }, (_, i) => `F${i}`);

// Generate integer registers R0-R31
const INT_REGISTERS = Array.from({ length: 32 }, (_, i) => `R${i}`);

// Initialize default functional units
const DEFAULT_FUNCTIONAL_UNITS = [
    {
        name: FUNCTIONAL_UNITS.INTEGER,
        busy: false,
        op: null,
        fi: null,
        fj: null,
        fk: null,
        qj: null,
        qk: null,
        rj: true,
        rk: true,
        cyclesRemaining: 0
    },
    {
        name: FUNCTIONAL_UNITS.FP_ADDER,
        busy: false,
        op: null,
        fi: null,
        fj: null,
        fk: null,
        qj: null,
        qk: null,
        rj: true,
        rk: true,
        cyclesRemaining: 0
    },
    {
        name: FUNCTIONAL_UNITS.FP_MULTIPLIER,
        busy: false,
        op: null,
        fi: null,
        fj: null,
        fk: null,
        qj: null,
        qk: null,
        rj: true,
        rk: true,
        cyclesRemaining: 0
    },
    {
        name: FUNCTIONAL_UNITS.FP_DIVIDER,
        busy: false,
        op: null,
        fi: null,
        fj: null,
        fk: null,
        qj: null,
        qk: null,
        rj: true,
        rk: true,
        cyclesRemaining: 0
    }
];

// Initialize default register result status
function createDefaultRegisterStatus() {
    const status = {};
    
    // Initialize all FP registers with null (no functional unit will write to them initially)
    FP_REGISTERS.forEach(register => {
        status[register] = null;
    });
    
    // Initialize all integer registers with null as well
    INT_REGISTERS.forEach(register => {
        status[register] = null;
    });
    
    return status;
}

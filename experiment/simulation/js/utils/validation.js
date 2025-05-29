// js/utils/validation.js

class ScoreboardValidator {
    constructor(scoreboard) {
        this.scoreboard = scoreboard;
    }

    // Validate if an instruction can be issued
    canIssue(instructionIndex) {
        const instruction = this.scoreboard.instructions[instructionIndex];
        
        // Check if simulation is started
        if (!this.scoreboard.simulationStarted) {
            return {
                valid: false,
                message: "Simulation must be started to perform actions."
            };
        }
        
        // Check if instruction already issued
        if (instruction.status[INSTRUCTION_STAGES.ISSUE] !== null) {
            return {
                valid: false,
                message: "Instruction has already been issued."
            };
        }
        
        // Check if there's a previous instruction that hasn't been issued yet (in-order issue)
        for (let i = 0; i < instructionIndex; i++) {
            if (this.scoreboard.instructions[i].status[INSTRUCTION_STAGES.ISSUE] === null) {
                return {
                    valid: false,
                    message: `Cannot issue out of order. Previous instruction at position ${i+1} must be issued first.`
                };
            }
        }
        
        // Check for available functional unit (structural hazard)
        const availableFU = this.scoreboard.getAvailableFunctionalUnit(instruction.type);
        if (!availableFU) {
            return {
                valid: false,
                message: `No available ${INSTRUCTION_TO_FUNCTIONAL_UNIT[instruction.type]} functional unit (structural hazard).`
            };
        }
        
        // Check for WAW hazard
        if (instruction.dest && this.scoreboard.isRegisterBeingWritten(instruction.dest)) {
            return {
                valid: false,
                message: `Register ${instruction.dest} is already scheduled to be written (WAW hazard).`
            };
        }
        
        return { valid: true };
    }

    // Validate if operands can be read for an instruction
    canReadOperands(instructionIndex) {
        const instruction = this.scoreboard.instructions[instructionIndex];
        
        // Check if simulation is started
        if (!this.scoreboard.simulationStarted) {
            return {
                valid: false,
                message: "Simulation must be started to perform actions."
            };
        }
        
        // Check if instruction has been issued
        if (instruction.status[INSTRUCTION_STAGES.ISSUE] === null) {
            return {
                valid: false,
                message: "Instruction must be issued before reading operands."
            };
        }
        
        // Check if operands are already read
        if (instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] !== null) {
            return {
                valid: false,
                message: `Operands have already been read in cycle ${instruction.status[INSTRUCTION_STAGES.READ_OPERANDS]}.`
            };
        }
        
        // Check if this action should be performed in the current cycle
        if (instruction.status[INSTRUCTION_STAGES.ISSUE] >= this.scoreboard.currentCycle) {
            return {
                valid: false,
                message: `Cannot read operands in the same cycle as issuing. Must wait until cycle ${instruction.status[INSTRUCTION_STAGES.ISSUE] + 1}.`
            };
        }
        
        // Find the functional unit for this instruction
        const fu = this.scoreboard.functionalUnits.find(unit => 
            unit.busy && unit.op === instruction.type && unit.fi === instruction.dest
        );
        
        if (!fu) {
            return {
                valid: false,
                message: "No functional unit assigned to this instruction."
            };
        }
        
        // Check if source operands are ready (RAW hazard)
        if (fu.qj !== null) {
            // Find the instruction producing this register
            const producerFU = this.scoreboard.functionalUnits.find(u => u.name === fu.qj);
            const producerInstr = producerFU ? this.scoreboard.getInstructionByFunctionalUnit(producerFU) : null;
            const producerIdx = producerInstr ? this.scoreboard.instructions.indexOf(producerInstr) : -1;
            
            return {
                valid: false,
                message: `Register ${fu.fj} is not ready yet. It is being produced by instruction ${producerIdx + 1} (${producerInstr ? producerInstr.type : 'unknown'}) in functional unit ${fu.qj}. This is a RAW hazard.`
            };
        }
        
        if (fu.qk !== null) {
            // Find the instruction producing this register
            const producerFU = this.scoreboard.functionalUnits.find(u => u.name === fu.qk);
            const producerInstr = producerFU ? this.scoreboard.getInstructionByFunctionalUnit(producerFU) : null;
            const producerIdx = producerInstr ? this.scoreboard.instructions.indexOf(producerInstr) : -1;
            
            return {
                valid: false,
                message: `Register ${fu.fk} is not ready yet. It is being produced by instruction ${producerIdx + 1} (${producerInstr ? producerInstr.type : 'unknown'}) in functional unit ${fu.qk}. This is a RAW hazard.`
            };
        }
        
        return { valid: true };
    }

    // Validate if execution can be marked as complete
    canCompleteExecution(instructionIndex) {
        const instruction = this.scoreboard.instructions[instructionIndex];
        
        // Check if simulation is started
        if (!this.scoreboard.simulationStarted) {
            return {
                valid: false,
                message: "Simulation must be started to perform actions."
            };
        }
        
        // Check if operands have been read
        if (instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] === null) {
            return {
                valid: false,
                message: "Operands must be read before execution can complete."
            };
        }
        
        // Check if execution is already marked as complete
        if (instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] !== null) {
            return {
                valid: false,
                message: "Execution has already been marked as complete."
            };
        }
        
        // Check if this action should be performed in the current cycle
        if (!this.scoreboard.pendingActions.has(`exec-${instructionIndex}`)) {
            return {
                valid: false,
                message: "This instruction cannot complete execution in the current cycle."
            };
        }
        
        // Find the functional unit for this instruction
        const fu = this.scoreboard.functionalUnits.find(unit => 
            unit.busy && unit.op === instruction.type && unit.fi === instruction.dest
        );
        
        if (!fu) {
            return {
                valid: false,
                message: "No functional unit assigned to this instruction."
            };
        }
        
        // Check if execution cycles are complete
        if (fu.cyclesRemaining > 0) {
            return {
                valid: false,
                message: `Execution not complete. ${fu.cyclesRemaining} cycles remaining.`
            };
        }
        
        return { valid: true };
    }

    // Validate if result can be written
    canWriteResult(instructionIndex) {
        const instruction = this.scoreboard.instructions[instructionIndex];
        
        // Check if simulation is started
        if (!this.scoreboard.simulationStarted) {
            return {
                valid: false,
                message: "Simulation must be started to perform actions."
            };
        }
        
        // Check if execution has completed
        if (instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] === null) {
            return {
                valid: false,
                message: "Execution must complete before writing the result."
            };
        }
        
        // Check if result is already written
        if (instruction.status[INSTRUCTION_STAGES.WRITE_RESULT] !== null) {
            return {
                valid: false,
                message: "Result has already been written."
            };
        }
        
        // Find the functional unit for this instruction
        const fu = this.scoreboard.functionalUnits.find(unit => 
            unit.busy && unit.op === instruction.type && unit.fi === instruction.dest
        );
        
        if (!fu) {
            return {
                valid: false,
                message: "No functional unit assigned to this instruction."
            };
        }
        
        // Check for WAR hazards
        for (const unit of this.scoreboard.functionalUnits) {
            if (unit.busy && unit !== fu) {
                // Check if this instruction's destination is a source for another instruction
                // that has not read its operands yet
                if (unit.fj === fu.fi && unit.rj === true) {
                    // Get the instruction that needs this operand
                    const warInstruction = this.scoreboard.getInstructionByFunctionalUnit(unit);
                    const warIndex = warInstruction ? this.scoreboard.instructions.indexOf(warInstruction) : -1;
                    
                    return {
                        valid: false,
                        message: `Cannot write result due to WAR hazard. Register ${fu.fi} is needed as operand 1 by instruction ${warIndex+1} (${warInstruction ? warInstruction.type : 'unknown'}) which hasn't read its operands yet.`
                    };
                }
                
                if (unit.fk === fu.fi && unit.rk === true) {
                    // Get the instruction that needs this operand
                    const warInstruction = this.scoreboard.getInstructionByFunctionalUnit(unit);
                    const warIndex = warInstruction ? this.scoreboard.instructions.indexOf(warInstruction) : -1;
                    
                    return {
                        valid: false,
                        message: `Cannot write result due to WAR hazard. Register ${fu.fi} is needed as operand 2 by instruction ${warIndex+1} (${warInstruction ? warInstruction.type : 'unknown'}) which hasn't read its operands yet.`
                    };
                }
            }
        }

        // Check if this action should be performed in the current cycle
        if (!this.scoreboard.pendingActions.has(`write-${instructionIndex}`)) {
            return {
                valid: false,
                message: "This instruction cannot write its result in the current cycle."
            };
        }
        
        
        return { valid: true };
    }

    // Get next valid actions for a given instruction
    getNextValidActions(instructionIndex) {
        if (!this.scoreboard.simulationStarted) {
            return [];
        }
        
        const instruction = this.scoreboard.instructions[instructionIndex];
        const validActions = [];
        
        // Check each stage in order
        if (instruction.status[INSTRUCTION_STAGES.ISSUE] === null && 
            this.scoreboard.pendingActions.has(`issue-${instructionIndex}`)) {
            const issueResult = this.canIssue(instructionIndex);
            if (issueResult.valid) {
                validActions.push(INSTRUCTION_STAGES.ISSUE);
            }
        } else if (instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] === null && 
                 this.scoreboard.pendingActions.has(`read-${instructionIndex}`)) {
            const readResult = this.canReadOperands(instructionIndex);
            if (readResult.valid) {
                validActions.push(INSTRUCTION_STAGES.READ_OPERANDS);
            }
        } else if (instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] === null && 
                 this.scoreboard.pendingActions.has(`exec-${instructionIndex}`)) {
            const execResult = this.canCompleteExecution(instructionIndex);
            if (execResult.valid) {
                validActions.push(INSTRUCTION_STAGES.EXECUTION_COMPLETE);
            }
        } else if (instruction.status[INSTRUCTION_STAGES.WRITE_RESULT] === null && 
                 this.scoreboard.pendingActions.has(`write-${instructionIndex}`)) {
            const writeResult = this.canWriteResult(instructionIndex);
            if (writeResult.valid) {
                validActions.push(INSTRUCTION_STAGES.WRITE_RESULT);
            }
        }
        
        return validActions;
    }
    
    // Check if all required actions for the current cycle have been performed
    canAdvanceCycle() {
        if (!this.scoreboard.simulationStarted) {
            return {
                valid: false,
                message: "Simulation must be started to advance cycles."
            };
        }
        
        if (this.scoreboard.pendingActions.size > 0) {
            return {
                valid: false,
                message: `There are ${this.scoreboard.pendingActions.size} pending actions that must be completed before advancing to the next cycle.`
            };
        }
        
        return { valid: true };
    }
}

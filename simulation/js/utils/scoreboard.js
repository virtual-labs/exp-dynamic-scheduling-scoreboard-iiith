// js/utils/scoreboard.js

class Scoreboard {
    constructor() {
        this.currentCycle = 0;
        this.instructions = [];
        this.functionalUnits = JSON.parse(JSON.stringify(DEFAULT_FUNCTIONAL_UNITS));
        this.registerStatus = createDefaultRegisterStatus();
        this.executionCycles = { ...DEFAULT_EXECUTION_CYCLES };
        this.simulationStarted = false;
        this.pendingActions = new Set(); // Track actions that must be performed in this cycle
    }

    // Reset the scoreboard to initial state
    reset() {
        this.currentCycle = 0;
        this.instructions = [];
        this.functionalUnits = JSON.parse(JSON.stringify(DEFAULT_FUNCTIONAL_UNITS));
        this.registerStatus = createDefaultRegisterStatus();
        this.simulationStarted = false;
        this.pendingActions = new Set();
    }

    // Start the simulation - lock in instructions and prevent editing
    startSimulation() {
        this.simulationStarted = true;
        this.currentCycle = 1; // Start at cycle 1
        
        // Initialize pending actions for cycle 1
        this.updatePendingActions();
    }

    // Stop the simulation - allow editing again
    stopSimulation() {
        this.simulationStarted = false;
        this.currentCycle = 0;
        this.pendingActions.clear();
        
        // Reset all instruction statuses
        this.instructions.forEach(instruction => {
            instruction.status = {
                [INSTRUCTION_STAGES.ISSUE]: null,
                [INSTRUCTION_STAGES.READ_OPERANDS]: null,
                [INSTRUCTION_STAGES.EXECUTION_COMPLETE]: null,
                [INSTRUCTION_STAGES.WRITE_RESULT]: null
            };
        });
        
        // Reset functional units and register status
        this.functionalUnits = JSON.parse(JSON.stringify(DEFAULT_FUNCTIONAL_UNITS));
        this.registerStatus = createDefaultRegisterStatus();
    }
    
    // Add a new instruction to the scoreboard
    addInstruction(instruction) {
        if (this.simulationStarted) {
            throw new Error("Cannot add instructions while simulation is running");
        }
        
        // Create a new instruction with empty status
        const newInstruction = {
            ...instruction,
            status: {
                [INSTRUCTION_STAGES.ISSUE]: null,
                [INSTRUCTION_STAGES.READ_OPERANDS]: null,
                [INSTRUCTION_STAGES.EXECUTION_COMPLETE]: null,
                [INSTRUCTION_STAGES.WRITE_RESULT]: null
            }
        };
        this.instructions.push(newInstruction);
        return this.instructions.length - 1; // Return the index of the new instruction
    }
    
    // Update instruction order
    reorderInstructions(fromIndex, toIndex) {
        if (this.simulationStarted) {
            throw new Error("Cannot reorder instructions while simulation is running");
        }
        
        const [instruction] = this.instructions.splice(fromIndex, 1);
        this.instructions.splice(toIndex, 0, instruction);
    }
    
    // Remove an instruction
    removeInstruction(index) {
        if (this.simulationStarted) {
            throw new Error("Cannot remove instructions while simulation is running");
        }
        
        this.instructions.splice(index, 1);
    }

    // Get an available functional unit for the given instruction type
    getAvailableFunctionalUnit(instructionType) {
        const requiredUnitType = INSTRUCTION_TO_FUNCTIONAL_UNIT[instructionType];
        return this.functionalUnits.find(unit => 
            unit.name === requiredUnitType && !unit.busy
        );
    }

    // Check if a register is being written by any active functional unit
    isRegisterBeingWritten(register) {
        return this.registerStatus[register] !== null;
    }

    // Update the instruction status to issue
    issueInstruction(instructionIndex) {
        const instruction = this.instructions[instructionIndex];
        
        // Remove this action from pending actions
        this.pendingActions.delete(`issue-${instructionIndex}`);
        
        // Update instruction status
        instruction.status[INSTRUCTION_STAGES.ISSUE] = this.currentCycle;
        
        // Get the appropriate functional unit
        const fuIndex = this.functionalUnits.findIndex(fu => 
            fu.name === INSTRUCTION_TO_FUNCTIONAL_UNIT[instruction.type] && !fu.busy
        );
        
        if (fuIndex === -1) {
            throw new Error("No available functional unit for instruction");
        }
        
        const fu = this.functionalUnits[fuIndex];
        
        // Update functional unit status
        fu.busy = true;
        fu.op = instruction.type;
        fu.fi = instruction.dest;
        fu.fj = instruction.src1;
        fu.fk = instruction.src2;
        
        // Update Qj, Qk based on register status
        fu.qj = instruction.src1 ? this.registerStatus[instruction.src1] : null;
        fu.qk = instruction.src2 ? this.registerStatus[instruction.src2] : null;
        
        // Update Rj, Rk flags
        fu.rj = instruction.src1 ? (this.registerStatus[instruction.src1] === null) : true;
        fu.rk = instruction.src2 ? (this.registerStatus[instruction.src2] === null) : true;
        
        // Set cycles remaining for execution
        fu.cyclesRemaining = this.executionCycles[instruction.type];
        
        // Update register result status for destination register
        if (instruction.dest) {
            this.registerStatus[instruction.dest] = fu.name;
        }
        
        return true;
    }

    // Update the instruction status to read operands
    readOperands(instructionIndex) {
        const instruction = this.instructions[instructionIndex];
        
        // Remove this action from pending actions
        this.pendingActions.delete(`read-${instructionIndex}`);
        
        // Find the functional unit for this instruction
        const fu = this.functionalUnits.find(unit => 
            unit.busy && unit.op === instruction.type && unit.fi === instruction.dest
        );
        
        if (!fu) {
            throw new Error("Functional unit not found for instruction");
        }
        
        // Check if operands are ready
        if (!fu.rj || !fu.rk) {
            return false;
        }
        
        // Update instruction status
        instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] = this.currentCycle;
        
        // Update functional unit status
        fu.rj = false; // Mark as read
        fu.rk = false; // Mark as read
        
        return true;
    }

    // Update the instruction status to execution complete
    completeExecution(instructionIndex) {
        const instruction = this.instructions[instructionIndex];
        
        // Remove this action from pending actions
        this.pendingActions.delete(`exec-${instructionIndex}`);
        
        // Find the functional unit for this instruction
        const fu = this.functionalUnits.find(unit => 
            unit.busy && unit.op === instruction.type && unit.fi === instruction.dest
        );
        
        if (!fu) {
            throw new Error("Functional unit not found for instruction");
        }
        
        // Check if execution cycles are complete
        if (fu.cyclesRemaining > 0) {
            return false;
        }
        
        // Update instruction status
        instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] = this.currentCycle;
        
        return true;
    }

    // Update the instruction status to write result
    writeResult(instructionIndex) {
        const instruction = this.instructions[instructionIndex];
        
        // Remove this action from pending actions
        this.pendingActions.delete(`write-${instructionIndex}`);
        
        // Find the functional unit for this instruction
        const fu = this.functionalUnits.find(unit => 
            unit.busy && unit.op === instruction.type && unit.fi === instruction.dest
        );
        
        if (!fu) {
            throw new Error("Functional unit not found for instruction");
        }
        
        // Check for WAR hazards specifically and in detail
        for (const unit of this.functionalUnits) {
            if (unit.busy && unit !== fu) {
                // Check if this instruction's destination is a source for another instruction
                // that has not read its operands yet
                if ((unit.fj === fu.fi && unit.rj === true) || 
                    (unit.fk === fu.fi && unit.rk === true)) {
                    // Log WAR hazard for debugging
                    console.log(`WAR hazard detected: ${fu.fi} is needed by another unit`);
                    return false; // WAR hazard
                }
            }
        }
        
        // Update instruction status
        instruction.status[INSTRUCTION_STAGES.WRITE_RESULT] = this.currentCycle;
        
        // Clear the functional unit
        fu.busy = false;
        fu.op = null;
        fu.fi = null;
        fu.fj = null;
        fu.fk = null;
        fu.qj = null;
        fu.qk = null;
        fu.rj = true;
        fu.rk = true;
        fu.cyclesRemaining = 0;
        
        // Clear the register status entry for this destination
        if (instruction.dest) {
            this.registerStatus[instruction.dest] = null;
        }
        
        // Update Qj and Qk for all functional units that were waiting for this unit
        for (const unit of this.functionalUnits) {
            if (unit.busy) {
                if (unit.qj === fu.name) {
                    unit.qj = null;
                    unit.rj = true;
                }
                if (unit.qk === fu.name) {
                    unit.qk = null;
                    unit.rk = true;
                }
            }
        }
        
        return true;
    }

    // Advance to the next cycle
    advanceCycle() {
        // Check if there are any pending actions for the current cycle
        if (this.pendingActions.size > 0) {
            return {
                success: false,
                message: "Cannot advance to next cycle. There are pending actions that must be completed first."
            };
        }
        
        this.currentCycle++;
        
        // Decrement remaining execution cycles for all active functional units
        for (const fu of this.functionalUnits) {
            if (fu.busy && fu.cyclesRemaining > 0 && 
                this.getInstructionByFunctionalUnit(fu)?.status[INSTRUCTION_STAGES.READ_OPERANDS] !== null) {
                fu.cyclesRemaining--;
            }
        }
        
        // Update pending actions for the new cycle
        this.updatePendingActions();
        
        return {
            success: true,
            message: `Advanced to cycle ${this.currentCycle}`
        };
    }
    
    // Update the set of actions that must be performed in the current cycle
    updatePendingActions() {
        this.pendingActions.clear();
        
        // Check if any instruction was issued in this cycle
        const issuedThisCycle = this.instructions.some(instr => 
            instr.status[INSTRUCTION_STAGES.ISSUE] === this.currentCycle
        );
        
        // For issue actions, ensure in-order issue and only one issue per cycle
        if (!issuedThisCycle) {
            // Find the first non-issued instruction
            for (let i = 0; i < this.instructions.length; i++) {
                const instruction = this.instructions[i];
                
                if (instruction.status[INSTRUCTION_STAGES.ISSUE] === null) {
                    // Check if all previous instructions have been issued
                    let allPreviousIssued = true;
                    for (let j = 0; j < i; j++) {
                        if (this.instructions[j].status[INSTRUCTION_STAGES.ISSUE] === null) {
                            allPreviousIssued = false;
                            break;
                        }
                    }
                    
                    if (allPreviousIssued) {
                        // Check if this instruction can be issued (no structural or WAW hazards)
                        const availableFU = this.getAvailableFunctionalUnit(instruction.type);
                        const noWAWHazard = !instruction.dest || !this.isRegisterBeingWritten(instruction.dest);
                        
                        if (availableFU && noWAWHazard) {
                            this.pendingActions.add(`issue-${i}`);
                            break; // Only add one issue action
                        }
                    }
                    
                    break; // Stop after finding first non-issued instruction
                }
            }
        }
        
        // Handle other action types
        for (let i = 0; i < this.instructions.length; i++) {
            const instruction = this.instructions[i];
            
            // Skip instructions that haven't been issued yet
            if (instruction.status[INSTRUCTION_STAGES.ISSUE] === null) {
                continue;
            }
            
            // Check for Read Operands
            if (instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] === null && 
                instruction.status[INSTRUCTION_STAGES.ISSUE] < this.currentCycle) {
                
                const fu = this.getFunctionalUnitForInstruction(i);
                if (fu && fu.rj && fu.rk) {
                    this.pendingActions.add(`read-${i}`);
                }
            }
            
            // Check for Execution Complete
            if (instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] === null && 
                instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] !== null && 
                instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] < this.currentCycle) {
                
                const fu = this.getFunctionalUnitForInstruction(i);
                if (fu && fu.cyclesRemaining === 0) {
                    this.pendingActions.add(`exec-${i}`);
                }
            }
            
            // Check for Write Result
            if (instruction.status[INSTRUCTION_STAGES.WRITE_RESULT] === null && 
                instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] !== null && 
                instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] < this.currentCycle) {
                
                const fu = this.getFunctionalUnitForInstruction(i);
                if (fu) {
                    let hasWARHazard = false;
                    
                    for (const unit of this.functionalUnits) {
                        if (unit.busy && unit !== fu) {
                            if ((unit.fj === fu.fi && unit.rj === true) || 
                                (unit.fk === fu.fi && unit.rk === true)) {
                                hasWARHazard = true;
                                break;
                            }
                        }
                    }
                    
                    if (!hasWARHazard) {
                        this.pendingActions.add(`write-${i}`);
                    }
                }
            }
        }
    }

    // Check if an action should be performed in the current cycle
    shouldActionBePerformedInCurrentCycle(instructionIndex, action) {
        const instruction = this.instructions[instructionIndex];
        
        switch (action) {
            case INSTRUCTION_STAGES.ISSUE:
                // Can issue immediately when simulation starts or after previous instructions
                return true;
                    
            case INSTRUCTION_STAGES.READ_OPERANDS:
                // Read operands must happen at least one cycle after issue
                return instruction.status[INSTRUCTION_STAGES.ISSUE] !== null && 
                       instruction.status[INSTRUCTION_STAGES.ISSUE] < this.currentCycle;
                    
            case INSTRUCTION_STAGES.EXECUTION_COMPLETE:
                // Execution completes after the specified cycles
                const fu = this.getFunctionalUnitForInstruction(instructionIndex);
                return fu && fu.cyclesRemaining === 0 && 
                       instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] !== null && 
                       instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] < this.currentCycle;
                    
            case INSTRUCTION_STAGES.WRITE_RESULT:
                // Write result must happen at least one cycle after execution complete
                return instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] !== null && 
                       instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] < this.currentCycle;
                    
            default:
                return false;
        }
    } 

    // Get valid actions for an instruction
    getValidActionsForInstruction(instructionIndex) {
        const instruction = this.instructions[instructionIndex];
        const validActions = [];
        
        // Check each stage in order
        if (instruction.status[INSTRUCTION_STAGES.ISSUE] === null) {
            // Check if there is an available functional unit and no WAW hazard
            const fu = this.getAvailableFunctionalUnit(instruction.type);
            
            // Check if all previous instructions have been issued (in-order issue)
            let allPreviousIssued = true;
            for (let i = 0; i < instructionIndex; i++) {
                if (this.instructions[i].status[INSTRUCTION_STAGES.ISSUE] === null) {
                    allPreviousIssued = false;
                    break;
                }
            }
            
            if (allPreviousIssued && fu && (!instruction.dest || !this.isRegisterBeingWritten(instruction.dest))) {
                validActions.push(INSTRUCTION_STAGES.ISSUE);
            }
        } else if (instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] === null) {
            // Check if it's been at least one cycle since issue
            if (instruction.status[INSTRUCTION_STAGES.ISSUE] < this.currentCycle) {
                // Check if all source operands are available
                const fu = this.getFunctionalUnitForInstruction(instructionIndex);
                if (fu && fu.rj && fu.rk) {
                    validActions.push(INSTRUCTION_STAGES.READ_OPERANDS);
                }
            }
        } else if (instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] === null) {
            // Check if execution has completed
            const fu = this.getFunctionalUnitForInstruction(instructionIndex);
            if (fu && fu.cyclesRemaining === 0 && 
                instruction.status[INSTRUCTION_STAGES.READ_OPERANDS] < this.currentCycle) {
                validActions.push(INSTRUCTION_STAGES.EXECUTION_COMPLETE);
            }
        } else if (instruction.status[INSTRUCTION_STAGES.WRITE_RESULT] === null) {
            // Check if it's been at least one cycle since execution completed
            if (instruction.status[INSTRUCTION_STAGES.EXECUTION_COMPLETE] < this.currentCycle) {
                // Check for WAR hazards
                const fu = this.getFunctionalUnitForInstruction(instructionIndex);
                if (fu) {
                    let hasWARHazard = false;
                    
                    for (const unit of this.functionalUnits) {
                        if (unit.busy && unit !== fu) {
                            if ((unit.fj === fu.fi && unit.rj === true) || 
                                (unit.fk === fu.fi && unit.rk === true)) {
                                hasWARHazard = true;
                                break;
                            }
                        }
                    }
                    
                    if (!hasWARHazard) {
                        validActions.push(INSTRUCTION_STAGES.WRITE_RESULT);
                    }
                }
            }
        }
        
        return validActions;
    }

    // Helper method to get instruction by functional unit
    getInstructionByFunctionalUnit(fu) {
        return this.instructions.find(instr => 
            instr.dest === fu.fi && 
            instr.type === fu.op
        );
    }
    
    // Helper method to get functional unit for instruction
    getFunctionalUnitForInstruction(instructionIndex) {
        const instruction = this.instructions[instructionIndex];
        return this.functionalUnits.find(unit => 
            unit.busy && unit.op === instruction.type && unit.fi === instruction.dest
        );
    }
}

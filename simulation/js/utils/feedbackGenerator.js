// js/utils/feedbackGenerator.js

class FeedbackGenerator {
    constructor(scoreboard, validator) {
        this.scoreboard = scoreboard;
        this.validator = validator;
    }

    // Generate feedback for the current state
    generateCurrentStateFeedback() {
        const feedback = {
            message: "",
            type: "info" // info, error, success
        };
        
        // Basic information about the current cycle
        feedback.message = `Currently at cycle ${this.scoreboard.currentCycle}. `;
        
        // Check for possible actions
        const possibleActions = this.getPossibleActions();
        if (possibleActions.length > 0) {
            feedback.message += "Possible actions: " + possibleActions.join(", ");
            feedback.type = "info";
        } else {
            feedback.message += "No valid actions available. Consider advancing to the next cycle.";
            feedback.type = "info";
        }
        
        return feedback;
    }

    // Generate feedback for a specific instruction and stage
    generateActionFeedback(instructionIndex, stage) {
        const instruction = this.scoreboard.instructions[instructionIndex];
        const formattedInstruction = this.formatInstruction(instruction);
        
        switch (stage) {
            case INSTRUCTION_STAGES.ISSUE:
                return {
                    message: `Successfully issued ${formattedInstruction} in cycle ${this.scoreboard.currentCycle}.`,
                    type: "success"
                };
            case INSTRUCTION_STAGES.READ_OPERANDS:
                return {
                    message: `Successfully read operands for ${formattedInstruction} in cycle ${this.scoreboard.currentCycle}.`,
                    type: "success"
                };
            case INSTRUCTION_STAGES.EXECUTION_COMPLETE:
                return {
                    message: `Execution completed for ${formattedInstruction} in cycle ${this.scoreboard.currentCycle}.`,
                    type: "success"
                };
            case INSTRUCTION_STAGES.WRITE_RESULT:
                return {
                    message: `Result written for ${formattedInstruction} in cycle ${this.scoreboard.currentCycle}.`,
                    type: "success"
                };
            default:
                return {
                    message: `Successfully updated ${instruction.type} instruction to ${stage} at cycle ${this.scoreboard.currentCycle}.`,
                    type: "success"
                };
        }
    }

    // Helper method to format instruction for display in messages
    formatInstruction(instruction) {
        if (instruction.type === INSTRUCTION_TYPES.LOAD) {
            return `${instruction.type} ${instruction.dest}, ${instruction.offset}(${instruction.src1})`;
        } else if (instruction.type === INSTRUCTION_TYPES.STORE) {
            return `${instruction.type} ${instruction.src2}, ${instruction.offset}(${instruction.src1})`;
        } else {
            // ALU instructions
            return `${instruction.type} ${instruction.dest}, ${instruction.src1}, ${instruction.src2 || ''}`;
        }
    }

    // Get list of all possible actions
    getPossibleActions() {
        const actions = [];
        
        for (let i = 0; i < this.scoreboard.instructions.length; i++) {
            const validActions = this.validator.getNextValidActions(i);
            for (const action of validActions) {
                actions.push(`${this.scoreboard.instructions[i].type} - ${action}`);
            }
        }
        
        return actions;
    }

    // Generate a hint for the user
    generateHint() {
        // Check for instructions that can advance to the next stage
        for (let i = 0; i < this.scoreboard.instructions.length; i++) {
            const instruction = this.scoreboard.instructions[i];
            const validActions = this.validator.getNextValidActions(i);
            
            if (validActions.length > 0) {
                return {
                    message: `Hint: You can advance the ${instruction.type} instruction to the ${validActions[0]} stage.`,
                    type: "info"
                };
            }
        }
        
        // Check for functional units with cycles remaining
        const busyUnits = this.scoreboard.functionalUnits.filter(fu => fu.busy && fu.cyclesRemaining > 0);
        if (busyUnits.length > 0) {
            return {
                message: "Hint: There are instructions still executing. Advance to the next cycle to decrease remaining execution cycles.",
                type: "info"
            };
        }
        
        // If no specific actions, suggest adding more instructions or advancing cycle
        if (this.scoreboard.instructions.length === 0) {
            return {
                message: "Hint: Add some instructions to get started.",
                type: "info"
            };
        } else {
            return {
                message: "Hint: Consider advancing to the next cycle or checking for WAR/WAW hazards that might be blocking progress.",
                type: "info"
            };
        }
    }
}

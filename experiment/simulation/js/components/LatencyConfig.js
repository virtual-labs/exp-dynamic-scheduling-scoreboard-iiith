// js/components/LatencyConfig.js

class LatencyConfig {
    constructor(containerId, scoreboard, onLatencyChange) {
        this.containerId = containerId;
        this.scoreboard = scoreboard;
        this.onLatencyChange = onLatencyChange;
    }

    render(readOnly = false) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Group instruction types by category
        const categories = {
            'Memory Operations': [
                { type: INSTRUCTION_TYPES.LOAD, label: 'Load (LD)' },
                { type: INSTRUCTION_TYPES.STORE, label: 'Store (SD)' }
            ],
            'Integer Operations': [
                { type: INSTRUCTION_TYPES.INTEGER_ALU, label: 'Integer Add (DADD)' },
                { type: INSTRUCTION_TYPES.INTEGER_SUB, label: 'Integer Sub (DSUB)' }
            ],
            'Floating-Point Operations': [
                { type: INSTRUCTION_TYPES.FP_ADD, label: 'FP Add (ADDD)' },
                { type: INSTRUCTION_TYPES.FP_SUB, label: 'FP Sub (SUBD)' },
                { type: INSTRUCTION_TYPES.FP_MULT, label: 'FP Multiply (MULTD)' },
                { type: INSTRUCTION_TYPES.FP_DIV, label: 'FP Divide (DIVD)' }
            ],
            'Logical Operations': [
                { type: INSTRUCTION_TYPES.AND, label: 'AND' },
                { type: INSTRUCTION_TYPES.OR, label: 'OR' },
                { type: INSTRUCTION_TYPES.XOR, label: 'XOR' }
            ]
        };

        let html = '<div class="latency-config-container">';

        // Create a grid layout for the categories
        html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';

        for (const [categoryName, instructions] of Object.entries(categories)) {
            html += `
                <div class="latency-category">
                    <h3 class="text-md font-semibold mb-3 text-gray-700 border-b pb-2">${categoryName}</h3>
                    <div class="space-y-2">
            `;

            for (const { type, label } of instructions) {
                const currentLatency = this.scoreboard.executionCycles[type];
                html += `
                    <div class="latency-item flex items-center justify-between">
                        <label for="latency-${type}" class="text-sm font-medium text-gray-700 flex-1">
                            ${label}
                        </label>
                        <div class="flex items-center gap-2">
                            <input
                                type="number"
                                id="latency-${type}"
                                class="latency-input w-20 px-2 py-1 border border-gray-300 rounded text-center ${readOnly ? 'latency-input-readonly' : ''}"
                                value="${currentLatency}"
                                min="1"
                                max="100"
                                data-instruction-type="${type}"
                                ${readOnly ? 'readonly' : ''}
                            />
                            <span class="text-xs text-gray-500">cycles</span>
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        html += '</div>'; // Close grid

        // Add info message based on mode
        if (readOnly) {
            html += `
                <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p class="text-sm text-yellow-800">
                        <strong>ℹ️ Read-Only Mode:</strong> Latencies cannot be changed during simulation.
                        To modify latencies, stop the simulation and return to edit mode.
                    </p>
                </div>
            `;
        } else {
            html += `
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p class="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Configure the execution latencies for each instruction type.
                        These values determine how many cycles each operation takes to execute.
                    </p>
                </div>
            `;
        }

        html += '</div>'; // Close container

        container.innerHTML = html;

        // Add event listeners to all inputs only if not read-only
        if (!readOnly) {
            this.attachEventListeners();
        }
    }

    attachEventListeners() {
        const inputs = document.querySelectorAll('.latency-input');
        
        inputs.forEach(input => {
            // Handle input change
            input.addEventListener('change', (e) => {
                const instructionType = e.target.dataset.instructionType;
                const newLatency = parseInt(e.target.value);

                // Validate input
                if (isNaN(newLatency) || newLatency < 1 || newLatency > 100) {
                    e.target.value = this.scoreboard.executionCycles[instructionType];
                    this.onLatencyChange({
                        success: false,
                        message: 'Latency must be between 1 and 100 cycles.',
                        type: instructionType
                    });
                    return;
                }

                // Update the scoreboard
                const result = this.scoreboard.updateLatency(instructionType, newLatency);
                
                // Notify parent component
                this.onLatencyChange({
                    success: result.success,
                    message: result.message,
                    type: instructionType,
                    oldLatency: result.oldLatency,
                    newLatency: newLatency
                });

                // If update failed, revert the input value
                if (!result.success) {
                    e.target.value = this.scoreboard.executionCycles[instructionType];
                }
            });

            // Prevent invalid input during typing
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value < 1) {
                    e.target.value = 1;
                } else if (value > 100) {
                    e.target.value = 100;
                }
            });

            // Select all text on focus for easy editing
            input.addEventListener('focus', (e) => {
                e.target.select();
            });
        });
    }

    // Update the display when latencies change externally
    updateDisplay() {
        const inputs = document.querySelectorAll('.latency-input');
        inputs.forEach(input => {
            const instructionType = input.dataset.instructionType;
            input.value = this.scoreboard.executionCycles[instructionType];
        });
    }
}


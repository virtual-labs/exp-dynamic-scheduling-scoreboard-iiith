### Brief Theory

Scoreboarding is a dynamic scheduling technique introduced in the CDC 6600 supercomputer to enable out-of-order execution of instructions while preserving program correctness. It allows instructions to proceed through the pipeline stages independently, provided that their data and structural dependencies are met.

In a pipelined processor, hazards such as data hazards (RAW, WAR, WAW) and structural hazards can cause stalls that reduce instruction throughput. Scoreboarding helps mitigate these stalls by keeping track of the status of each functional unit and the availability of operands using a centralized control mechanism known as the **scoreboard**.

Each instruction goes through the following key phases in scoreboarding:
1. **Issue**: The instruction is issued if the required functional unit is available and no WAW hazard exists.
2. **Read Operands**: The instruction waits until all source operands are ready and there is no RAW hazard.
3. **Execute**: The instruction is executed once the operands are available and the functional unit is ready.
4. **Write Result**: The instruction writes its result if no WAR hazard exists with other instructions.

The scoreboard tracks:
- The busy status of each functional unit.
- The destination register and source operands for each instruction.
- Whether an operand is ready or not.
- Dependencies between instructions.

By managing these dependencies dynamically, the processor can continue issuing instructions that are not stalled, thereby improving instruction-level parallelism and overall CPU performance. However, scoreboarding does not eliminate false dependencies (like WAR and WAW) as effectively as techniques like register renaming.

This experiment helps visualize how the scoreboard coordinates instruction execution, detects and resolves hazards, and maintains correct program execution in an out-of-order environment.

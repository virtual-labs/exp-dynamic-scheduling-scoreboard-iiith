### Step 1: Build Your Instruction Sequence

Begin by constructing a sequence of instructions that will demonstrate scoreboarding concepts. The simulator supports the following instruction types:

#### Available Instructions

- **Memory Operations**:

  - `LD` (Load): Loads data from memory into a register
  - `SD` (Store): Stores data from a register to memory
  - Base address register must be an integer register (R0-R31)
  - Destination/source can be either integer (R0-R31) or floating-point (F0-F31) registers

- **Integer ALU Operations** (use only R0-R31):

  - `DADD`: Integer addition
  - `DSUB`: Integer subtraction
  - `AND`: Bitwise AND
  - `OR`: Bitwise OR
  - `XOR`: Bitwise XOR

- **Floating-Point Operations** (use only F0-F31):
  - `ADDD`: Double-precision floating-point addition
  - `SUBD`: Double-precision floating-point subtraction
  - `MULTD`: Double-precision floating-point multiplication
  - `DIVD`: Double-precision floating-point division

#### Building Your Sequence

1. Select an instruction type from the dropdown menu
2. Choose appropriate registers based on the instruction type:
   - Integer instructions: Only R0-R31 available
   - FP instructions: Only F0-F31 available
   - Memory instructions: Can access both register files (with grouped dropdowns)
3. For memory operations, specify the base register (R0-R31 only) and offset value
4. Click "Add Instruction" to add it to your sequence
5. Reorder instructions using the ↑/↓ buttons if needed
6. Remove unwanted instructions using the ✕ button

**Tip**: Try creating sequences with potential RAW, WAR, and WAW hazards to see how scoreboarding manages them!

### Step 2: Configure Execution Latencies

Before starting the simulation, configure the execution latencies (number of cycles) for each instruction type. This allows you to experiment with different processor configurations:

- **Memory Operations**: LD and SD (default: 1 cycle)
- **Integer Operations**: DADD, DSUB, AND, OR, XOR (default: 1 cycle)
- **Floating-Point Operations**:
  - ADDD/SUBD (default: 2 cycles)
  - MULTD (default: 10 cycles)
  - DIVD (default: 40 cycles)

Valid range: 1-100 cycles per instruction type.

**Note**: Latencies cannot be modified once the simulation has started. You must stop and reset to change them.

### Step 3: Start the Simulation

Once your instruction sequence is ready and latencies are configured, click the **"Start Simulation"** button (enabled only when at least one instruction is added). The interface will transition to simulation mode and display the following components:

#### Simulation Interface Components

1. **Instruction Status Table**
   Tracks the progress of each instruction through the four pipeline stages. Each cell shows the cycle number when that stage completed, or is clickable if the stage is ready to execute.

2. **Functional Unit Status Table**
   Displays the state of all functional units:

   - **Integer**: Handles integer ALU operations (DADD, DSUB, AND, OR, XOR) and memory operations (LD, SD)
   - **FP Adder**: Handles ADDD and SUBD operations
   - **FP Multiplier**: Handles MULTD operations
   - **FP Divider**: Handles DIVD operations

   For each unit, you can see:

   - **Busy**: Whether the unit is currently occupied
   - **Op**: The operation being performed
   - **Fi**: Destination register
   - **Fj, Fk**: Source registers
   - **Qj, Qk**: Functional units producing the source operands (if not ready)
   - **Rj, Rk**: Readiness flags for source operands
   - **Cycles**: Remaining execution cycles

3. **Register Result Status Table**
   Shows which functional unit, if any, will write to each register (both integer R0-R31 and floating-point F0-F31). This is used to detect WAW and RAW hazards.

4. **Execution Latency Configuration** (Read-Only)
   Displays the configured latencies for reference during simulation. To change these, you must stop the simulation and return to edit mode.

### Step 4: Advance Instructions Through Pipeline Stages

The core of the learning experience involves manually advancing instructions through the pipeline stages by clicking on cells in the **Instruction Status Table**. Instructions must progress through these stages in order:

#### Stage 1: Issue

**What happens**:

- Checks for an available functional unit (structural hazard check)
- Checks for WAW hazard: ensures no other active instruction will write to the same destination register
- Marks the functional unit as busy
- Updates the Register Result Status to indicate this functional unit will write to the destination
- Sets up operand tracking (Qj, Qk, Rj, Rk flags)

**Constraints**:

- Instructions must issue **in program order** (cannot issue instruction N+1 until instruction N has issued)
- Requires an available functional unit of the appropriate type
- No WAW hazard: no other instruction should be writing to the same destination register

**Color coding**: Yellow = ready to issue, Gray = blocked by previous instruction, Red = structural hazard or WAW hazard

#### Stage 2: Read Operands

**What happens**:

- Waits for source operands to become available
- Checks the Rj and Rk flags in the functional unit status
- Once both operands are ready, marks this stage as complete and begins execution

**Constraints**:

- Cannot occur in the same cycle as Issue (must wait at least one cycle)
- Both source operands must be ready (Rj = true AND Rk = true)
- This is where RAW (Read After Write) hazards are resolved

**Color coding**: Yellow = ready to read, Gray = waiting for operands (RAW hazard)

#### Stage 3: Execution Complete

**What happens**:

- Marks the execution as finished after the configured number of cycles have elapsed
- The functional unit's cycle counter decrements each cycle automatically
- When the counter reaches 0, this stage becomes available

**Constraints**:

- Must wait for the full execution latency to elapse
- Cannot complete execution in the same cycle as reading operands
- The functional unit must have cyclesRemaining = 0

**Color coding**: Yellow = execution finished (ready to mark complete), Gray = still executing

#### Stage 4: Write Result

**What happens**:

- Checks for WAR (Write After Read) hazards: ensures no instruction is still reading the old value
- Writes the result to the destination register
- Notifies all waiting functional units that this operand is now available (updates their Rj/Rk flags)
- Clears the Register Result Status for this register
- Frees the functional unit for use by other instructions

**Constraints**:

- Execution must be complete
- No WAR hazard: no instruction should be waiting to read operands that use this register

**Color coding**: Yellow = ready to write, Gray = execution not complete, Red = WAR hazard

#### Pending Actions

Actions that should be performed in the current cycle are highlighted in **yellow** in the Instruction Status Table. You must complete all pending actions before advancing to the next cycle using the **"Next Cycle"** button.

### Step 5: Use Hints and Learn from Feedback

The simulator provides several mechanisms to help you learn:

#### Hint System

Click the **"Hint"** button at any time to receive suggestions about:

- Which actions should be performed in the current cycle
- Why certain actions are blocked
- What conditions need to be met to proceed

#### Error Messages

If you attempt an invalid action, the simulator will:

- Block the action from executing
- Display a detailed error message explaining why it was blocked
- Provide information about what needs to happen first

Common error scenarios:

- Trying to issue out of order
- Attempting to read operands before they're ready (RAW hazard)
- Trying to complete execution before enough cycles have elapsed
- Attempting to write results when a WAR hazard exists
- Structural hazards (no available functional unit)
- WAW hazards (another instruction writing to same register)

#### Visual Feedback

- **Green cells**: Stage completed
- **Yellow cells**: Action ready to perform (pending)
- **Gray cells**: Not yet ready (waiting for dependencies)
- **Red cells**: Blocked (structural hazard, WAW hazard, or WAR hazard)

### Step 6: Observe Scoreboarding in Action

As you advance through the simulation, pay special attention to how scoreboarding manages hazards:

#### RAW (Read After Write) Hazards

When an instruction needs to read a register that a previous instruction will write:

- The dependent instruction waits in the "Read Operands" stage
- The Qj or Qk field shows which functional unit is producing the needed value
- Rj or Rk is set to false (not ready)
- Once the producing instruction writes its result, the flags are updated
- The dependent instruction can then proceed

#### WAW (Write After Write) Hazards

When two instructions write to the same register:

- The second instruction cannot issue until the first completes
- The Register Result Status prevents multiple writers to the same register
- This ensures results are written in the correct order

#### WAR (Write After Read) Hazards

When an instruction wants to write a register that earlier instructions are still reading:

- The writing instruction must wait in the "Write Result" stage
- It can only write after all readers have completed their "Read Operands" stage
- This preserves the correct data flow

#### Out-of-Order Execution

Observe how instructions can complete out of program order:

- Instructions with no dependencies can execute in parallel
- Long-latency operations (like DIVD) don't block independent instructions
- The scoreboard tracks all dependencies to maintain correctness

### Step 7: Complete the Simulation

Continue advancing instructions through all stages until every instruction has completed the **Write Result** stage.

#### Analysis Questions

After completing the simulation, analyze the results:

1. **Performance**: How many cycles did it take to complete all instructions? How does this compare to sequential execution?

2. **Parallelism**: Which instructions executed in parallel? What enabled this parallelism?

3. **Hazard Management**: Identify instances of RAW, WAW, and WAR hazards. How did scoreboarding resolve them?

4. **Resource Utilization**: Were there cycles where functional units were idle? Why?

5. **Critical Path**: Which instruction(s) took the longest? Did they create a bottleneck?

#### Experiment Variations

Try these variations to deepen your understanding:

- **Change latencies**: Make FP operations much slower and observe the impact on parallelism
- **Add more instructions**: Create longer sequences with more dependencies
- **Create hazards intentionally**: Build sequences with RAW, WAW, and WAR hazards
- **Vary instruction mix**: Try all integer operations, all FP operations, or mixed sequences
- **Test structural hazards**: Add more instructions than available functional units
- **Dependency chains**: Create long chains of dependent instructions and observe the impact

Use the **"Stop Simulation"** button to return to edit mode and modify your sequence, or **"Reset"** to start over completely.

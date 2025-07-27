### Experiment Procedure

1. **Select Instruction Sequence**  
   Begin by choosing a sequence of instructions using the provided input panel. You may either use one of the predefined examples or enter a custom instruction set to simulate.

2. **Start the Simulation**  
   Once the instruction sequence is selected, start the simulation. The interface will display three key tables:
   - **Instruction Status Table**: Shows the progress of each instruction through the pipeline stages.
   - **Functional Unit Status Table**: Indicates the state and occupancy of each functional unit, including operand readiness.
   - **Register Status Table**: Displays which functional unit, if any, is writing to each register.

3. **Advance Instructions Manually**  
   During the simulation, students must manually advance instructions through the four scoreboarding stages by clicking the appropriate cells in the **Instruction Status Table**:
   - **Issue**
   - **Read Operands**
   - **Execution Complete**
   - **Write Result**

   The student must analyze the current scoreboard state to determine if an instruction is eligible to move to the next stage. This encourages active reasoning about dependencies and hazards.

4. **Feedback and Hints**  
   If a student clicks on a stage prematurely—e.g., trying to read operands before they are available or write results when a WAR hazard exists—the simulator will block the action and display a hint explaining the reason. This helps reinforce the rules of scoreboarding through guided learning.

5. **Observe and Analyze**  
   Continue interacting with the simulation, observing how data hazards are tracked and resolved dynamically. Watch how the functional and register status tables evolve as instructions progress.

6. **Complete the Simulation**  
   Proceed until all instructions have successfully completed the "Write Result" stage. Reflect on how scoreboarding enabled out-of-order execution while maintaining program correctness.

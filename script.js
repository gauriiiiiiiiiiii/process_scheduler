        // --- Utility Functions ---

        /**
         * Displays a custom alert message to the user.
         * @param {string} message - The message to display.
         * @param {'info'|'success'|'error'} type - The type of alert (influences icon and color).
         * @param {number} duration - How long the alert should be visible in milliseconds.
         */
        const showAlert = (message, type = 'info', duration = 3000) => {
            const alertBox = document.getElementById('custom-alert');
            const alertMessage = document.getElementById('alert-message');
            const alertIcon = alertBox.querySelector('i');

            alertMessage.textContent = message;
            alertBox.className = 'show'; // Reset classes and add 'show'
            alertBox.classList.add(type); // Add type class for potential styling

            // Update icon and background color based on alert type
            if (type === 'error') {
                alertIcon.className = 'fas fa-exclamation-circle';
                alertBox.style.backgroundColor = '#d9534f'; /* Bootstrap danger color */
            } else if (type === 'success') {
                alertIcon.className = 'fas fa-check-circle';
                alertBox.style.backgroundColor = '#5cb85c'; /* Bootstrap success color */
            } else {
                alertIcon.className = 'fas fa-info-circle';
                alertBox.style.backgroundColor = 'var(--primary-color)'; /* Default info color */
            }

            // Hide the alert after a specified duration
            setTimeout(() => {
                alertBox.classList.remove('show');
            }, duration);
        };

        /**
         * Generates a random dark color for process identification in the Gantt chart.
         * @returns {string} A CSS RGB color string.
         */
        const generateRandomColor = () => {
            const r = Math.floor(Math.random() * 150) + 50; // Keep values lower for darker shades
            const g = Math.floor(Math.random() * 150) + 50;
            const b = Math.floor(Math.random() * 150) + 50;
            return `rgb(${r},${g},${b})`;
        };

        // --- UI Elements and Event Listeners ---
        const numProcessesInput = document.getElementById('numProcesses');
        const processInputsContainer = document.getElementById('processInputs');
        const algorithmSelect = document.getElementById('algorithmSelect');
        const quantumGroup = document.getElementById('quantumGroup');
        const quantumInput = document.getElementById('quantum');
        const simulateBtn = document.getElementById('simulateBtn');
        const resetBtn = document.getElementById('resetBtn');
        const ganttChartDiv = document.getElementById('ganttChart');
        const ganttTimeAxisDiv = document.getElementById('ganttTimeAxis');
        const avgWaitingTimeSpan = document.getElementById('avgWaitingTime');
        const avgTurnaroundTimeSpan = document.getElementById('avgTurnaroundTime');
        const avgResponseTimeSpan = document.getElementById('avgResponseTime');
        // const ganttMetricsContainer = document.getElementById('ganttMetricsContainer'); // No longer needed as a separate container

        let processColors = {}; // Stores a unique color for each process ID

        // Attach event listeners to UI elements
        numProcessesInput.addEventListener('change', generateProcessInputs);
        algorithmSelect.addEventListener('change', toggleAlgorithmSpecificInputs);
        simulateBtn.addEventListener('click', simulateScheduling);
        resetBtn.addEventListener('click', resetSimulator);

        // Initial UI setup when the page loads
        generateProcessInputs(); // Generate default process inputs
        toggleAlgorithmSpecificInputs(); // Set initial visibility for quantum/priority fields

        /**
         * Dynamically generates input fields for process details based on the number of processes.
         */
        function generateProcessInputs() {
            const numProcesses = parseInt(numProcessesInput.value);
            // Validate number of processes
            if (isNaN(numProcesses) || numProcesses < 1 || numProcesses > 15) {
                showAlert('Number of processes must be between 1 and 15.', 'error');
                numProcessesInput.value = Math.max(1, Math.min(15, numProcesses || 3)); // Reset to a valid default
                return;
            }

            processInputsContainer.innerHTML = ''; // Clear existing inputs
            processColors = {}; // Reset process colors for new set of processes

            for (let i = 1; i <= numProcesses; i++) {
                const processCard = document.createElement('div');
                processCard.classList.add('process-card');
                processCard.innerHTML = `
                    <h3>P${i}</h3>
                    <div class="form-group">
                        <label for="p${i}-arrival">Arrival:</label>
                        <input type="number" id="p${i}-arrival" class="arrival-time" value="${(i - 1) * 2}" min="0">
                    </div>
                    <div class="form-group">
                        <label for="p${i}-burst">Burst:</label>
                        <input type="number" id="p${i}-burst" class="burst-time" value="${Math.floor(Math.random() * 10) + 3}" min="1">
                    </div>
                    <div class="form-group priority-group" style="display: none;">
                        <label for="p${i}-priority">Priority:</label>
                        <input type="number" id="p${i}-priority" class="priority" value="${Math.floor(Math.random() * 10) + 1}" min="0">
                    </div>
                `;
                processInputsContainer.appendChild(processCard);
                processColors[`P${i}`] = generateRandomColor(); // Assign a random color to each process
            }
            toggleAlgorithmSpecificInputs(); // Re-apply visibility rules after generating inputs
        }

        /**
         * Toggles the visibility of the Time Quantum and Priority input fields
         * based on the currently selected scheduling algorithm.
         */
        function toggleAlgorithmSpecificInputs() {
            const selectedAlgorithm = algorithmSelect.value;
            const priorityGroups = document.querySelectorAll('.priority-group');

            // Show/hide Quantum input for RR and MLFQ
            if (selectedAlgorithm === 'RR' || selectedAlgorithm === 'MLFQ') {
                quantumGroup.style.display = 'flex';
            } else {
                quantumGroup.style.display = 'none';
            }

            // Show/hide Priority input for Priority-based and HRRN algorithms
            if (selectedAlgorithm.includes('Priority') || selectedAlgorithm === 'HRRN') {
                priorityGroups.forEach(group => group.style.display = 'flex');
            } else {
                priorityGroups.forEach(group => group.style.display = 'none');
            }
        }

        /**
         * Gathers process data from the input fields.
         * @returns {Array<Object>|null} An array of process objects, or null if validation fails.
         */
        function getProcessData() {
            const numProcesses = parseInt(numProcessesInput.value);
            const processes = [];
            for (let i = 1; i <= numProcesses; i++) {
                const arrivalTime = parseInt(document.getElementById(`p${i}-arrival`).value);
                const burstTime = parseInt(document.getElementById(`p${i}-burst`).value);
                const priorityInput = document.getElementById(`p${i}-priority`);
                const priority = priorityInput ? parseInt(priorityInput.value) : 0; // Default priority if not visible

                // Input validation
                if (isNaN(arrivalTime) || isNaN(burstTime) || burstTime <= 0 || (priorityInput && isNaN(priority))) {
                    showAlert(`Please enter valid numbers for P${i}. Burst time must be positive.`, 'error');
                    return null;
                }

                processes.push({
                    id: `P${i}`,
                    arrivalTime: arrivalTime,
                    burstTime: burstTime,
                    priority: priority,
                    remainingBurstTime: burstTime, // Used by preemptive algorithms
                    completionTime: 0,
                    waitingTime: 0,
                    turnaroundTime: 0,
                    responseTime: -1, // -1 indicates not yet set, will be first CPU allocation time - arrival time
                    firstAllocationTime: -1 // Track the very first time CPU is allocated to this process
                });
            }
            return processes;
        }

        /**
         * Resets the simulator to its initial state.
         */
        function resetSimulator() {
            numProcessesInput.value = 3;
            algorithmSelect.value = 'FCFS';
            quantumInput.value = 2;
            generateProcessInputs(); // Regenerate default process inputs
            toggleAlgorithmSpecificInputs(); // Reset visibility
            ganttChartDiv.innerHTML = ''; // Clear Gantt chart
            ganttTimeAxisDiv.innerHTML = ''; // Clear time axis
            avgWaitingTimeSpan.textContent = '0.00 ms';
            avgTurnaroundTimeSpan.textContent = '0.00 ms';
            avgResponseTimeSpan.textContent = '0.00 ms';
            showAlert('Simulator reset!', 'info');
        }

        /**
         * Initiates the CPU scheduling simulation based on user inputs.
         */
        function simulateScheduling() {
            const processes = getProcessData();
            if (!processes) {
                return; // Validation failed, error already shown
            }

            const algorithm = algorithmSelect.value;
            const quantum = parseInt(quantumInput.value);

            // Validate quantum for RR/MLFQ
            if ((algorithm === 'RR' || algorithm === 'MLFQ') && (isNaN(quantum) || quantum <= 0)) {
                showAlert('Please enter a valid positive time quantum for Round Robin/MLFQ.', 'error');
                return;
            }

            let simulationResult = {
                ganttChart: [],
                completedProcesses: []
            };

            // Create a deep copy of processes to avoid modifying original input data
            // This is crucial as algorithms will modify `remainingBurstTime` etc.
            let processesForSim = JSON.parse(JSON.stringify(processes));

            try {
                // Call the appropriate simulation function based on selected algorithm
                switch (algorithm) {
                    case 'FCFS':
                        simulationResult = simulateFCFS(processesForSim);
                        break;
                    case 'SJF_non_preemptive':
                        simulationResult = simulateSJFNonPreemptive(processesForSim);
                        break;
                    case 'SRTF':
                        simulationResult = simulateSRTF(processesForSim);
                        break;
                    case 'Priority_non_preemptive':
                        simulationResult = simulatePriorityNonPreemptive(processesForSim);
                        break;
                    case 'Priority_preemptive':
                        simulationResult = simulatePriorityPreemptive(processesForSim);
                        break;
                    case 'RR':
                        simulationResult = simulateRR(processesForSim, quantum);
                        break;
                    case 'LJF_non_preemptive':
                        simulationResult = simulateLJFNonPreemptive(processesForSim);
                        break;
                    case 'LRTF':
                        simulationResult = simulateLRTF(processesForSim);
                        break;
                    case 'HRRN':
                        simulationResult = simulateHRRN(processesForSim);
                        break;
                    case 'MLFQ':
                        simulationResult = simulateMLFQ(processesForSim, quantum);
                        break;
                    default:
                        showAlert('Selected algorithm not implemented.', 'error');
                        return;
                }
            } catch (e) {
                showAlert(`Simulation error: ${e.message}`, 'error', 5000);
                console.error("Simulation error:", e);
                return;
            }

            // Display results
            displayGanttChart(simulationResult.ganttChart);
            calculateAndDisplayMetrics(simulationResult.completedProcesses);
            showAlert('Simulation completed successfully!', 'success');
        }

        // --- Core Scheduling Algorithms Implementations ---

        /**
         * Helper function to sort processes by arrival time.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {Array<Object>} Sorted array of process objects.
         */
        function sortByArrivalTime(processes) {
            return processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        }

        /**
         * Calculates and updates the completion time, turnaround time, waiting time,
         * and response time for a given process.
         * @param {Object} process - The process object to update.
         * @param {number} currentTime - The current simulation time when the process completes.
         */
        function calculateMetricsForProcess(process, currentTime) {
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
            // Response time is set only once when the process first gets CPU
            // If firstAllocationTime was not set by the algorithm, set it now (shouldn't happen for active processes)
            if (process.firstAllocationTime === -1) {
                process.firstAllocationTime = process.arrivalTime; // Fallback if no allocation time recorded
            }
            process.responseTime = process.firstAllocationTime - process.arrivalTime;
        }

        /**
         * FCFS (First-Come, First-Served) Scheduling Algorithm.
         * Processes are executed in the order they arrive.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateFCFS(processes) {
            processes = sortByArrivalTime(processes); // Sort by arrival time
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];

            for (const process of processes) {
                // CPU waits if current time is less than process arrival time
                const startTime = Math.max(currentTime, process.arrivalTime);
                if (process.firstAllocationTime === -1) {
                    process.firstAllocationTime = startTime; // Record first allocation time
                }

                const endTime = startTime + process.burstTime;
                ganttChart.push({ id: process.id, start: startTime, end: endTime });
                currentTime = endTime; // Update current time to process completion time
                calculateMetricsForProcess(process, currentTime);
                completedProcesses.push(process);
            }
            return { ganttChart, completedProcesses };
        }

        /**
         * SJF (Shortest Job First) Non-Preemptive Scheduling Algorithm.
         * Selects the process with the smallest burst time among arrived processes.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateSJFNonPreemptive(processes) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            const n = processes.length;
            let completedCount = 0;

            const arrivedQueue = []; // Processes that have arrived and are ready

            while (completedCount < n) {
                // Add newly arrived processes to arrivedQueue
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && !arrivedQueue.includes(p) && !completedProcesses.includes(p)) {
                        arrivedQueue.push(p);
                    }
                }

                // Filter out processes that are already completed from the runnable set
                const runnableProcesses = arrivedQueue.filter(p => !completedProcesses.includes(p));

                if (runnableProcesses.length === 0) {
                    // No process ready to run, CPU is idle. Advance time to the next arrival.
                    let nextArrivalTime = Infinity;
                    for (const p of processes) {
                        if (!completedProcesses.includes(p) && p.arrivalTime > currentTime) {
                            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                        }
                    }
                    if (nextArrivalTime === Infinity) { // All processes completed or no more to arrive
                        break;
                    }
                    // Add idle time to Gantt chart if current time is less than the next arrival
                    if (currentTime < nextArrivalTime) {
                         if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                            ganttChart[ganttChart.length - 1].end = nextArrivalTime;
                        } else {
                            ganttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
                        }
                        currentTime = nextArrivalTime;
                    }
                    continue; // Re-evaluate queue after time jump
                }

                // Sort by burst time (shortest first), then by arrival time for tie-breaking
                runnableProcesses.sort((a, b) => {
                    if (a.burstTime === b.burstTime) {
                        return a.arrivalTime - b.arrivalTime;
                    }
                    return a.burstTime - b.burstTime;
                });

                const selectedProcess = runnableProcesses[0]; // Select the shortest job

                const startTime = currentTime;
                if (selectedProcess.firstAllocationTime === -1) {
                    selectedProcess.firstAllocationTime = startTime;
                }

                currentTime += selectedProcess.burstTime; // Execute the process to completion

                ganttChart.push({ id: selectedProcess.id, start: startTime, end: currentTime });
                calculateMetricsForProcess(selectedProcess, currentTime);
                completedProcesses.push(selectedProcess);
                completedCount++;

                // Remove from arrivedQueue to prevent re-selection (though filter above also handles it)
                const index = arrivedQueue.indexOf(selectedProcess);
                if (index > -1) {
                    arrivedQueue.splice(index, 1);
                }
            }
            // Sort completed processes by their original ID for consistent display of metrics
            return { ganttChart, completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }

        /**
         * SRTF (Shortest Remaining Time First) Preemptive SJF Scheduling Algorithm.
         * Selects the process with the smallest remaining burst time. Can preempt running process.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateSRTF(processes) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            let readyQueue = []; // Processes ready to run, sorted by remaining burst time
            let runningProcess = null;
            const n = processes.length;
            let completedCount = 0;

            // Sort processes initially by arrival time for easier iteration of new arrivals
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

            while (completedCount < n) {
                // Add newly arrived processes to ready queue
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && !readyQueue.includes(p) && p.remainingBurstTime > 0) {
                        readyQueue.push(p);
                    }
                }

                // Filter out processes that have completed (remainingBurstTime is 0)
                readyQueue = readyQueue.filter(p => p.remainingBurstTime > 0);

                // Sort ready queue by remaining burst time (SJF logic)
                readyQueue.sort((a, b) => {
                    if (a.remainingBurstTime === b.remainingBurstTime) {
                        return a.arrivalTime - b.arrivalTime; // Tie-breaking by arrival time
                    }
                    return a.remainingBurstTime - b.remainingBurstTime;
                });

                let nextProcessToRun = readyQueue.length > 0 ? readyQueue[0] : null;

                // Handle process completion
                if (runningProcess && runningProcess.remainingBurstTime === 0) {
                    calculateMetricsForProcess(runningProcess, currentTime);
                    completedProcesses.push(runningProcess);
                    completedCount++;
                    runningProcess = null; // No longer running
                }

                // Preemption logic: If a new process arrives or becomes ready with shorter remaining time
                if (runningProcess && nextProcessToRun && nextProcessToRun.id !== runningProcess.id && nextProcessToRun.remainingBurstTime < runningProcess.remainingBurstTime) {
                    // Preempt the current running process
                    // Update the end time of the current segment in Gantt chart
                    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === runningProcess.id) {
                        ganttChart[ganttChart.length - 1].end = currentTime;
                    }
                    runningProcess = null; // Mark as preempted
                }

                // If no process is running, select the next one
                if (!runningProcess && nextProcessToRun) {
                    runningProcess = nextProcessToRun;
                    // Record the start of a new segment in Gantt chart
                    if (runningProcess.firstAllocationTime === -1) {
                        runningProcess.firstAllocationTime = currentTime;
                    }
                    ganttChart.push({ id: runningProcess.id, start: currentTime, end: currentTime }); // End will be updated per tick
                } else if (!runningProcess && !nextProcessToRun) {
                    // CPU Idle: No processes are ready or have arrived yet
                    let nextEventTime = Infinity; // Time of the next process arrival
                    for (const p of processes) {
                        if (p.remainingBurstTime > 0 && p.arrivalTime > currentTime) {
                            nextEventTime = Math.min(nextEventTime, p.arrivalTime);
                        }
                    }

                    if (nextEventTime === Infinity) { // No more processes to arrive or run
                        break; // End simulation
                    }

                    // Add idle time to Gantt chart
                    if (currentTime < nextEventTime) {
                        if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                            ganttChart[ganttChart.length - 1].end = nextEventTime;
                        } else {
                            ganttChart.push({ id: 'Idle', start: currentTime, end: nextEventTime });
                        }
                        currentTime = nextEventTime; // Jump time to next arrival
                        continue; // Re-evaluate after time jump
                    }
                }

                // Execute the running process for 1ms
                if (runningProcess) {
                    runningProcess.remainingBurstTime--;
                    // Update the end time of the current segment in Gantt chart
                    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === runningProcess.id) {
                        ganttChart[ganttChart.length - 1].end = currentTime + 1;
                    }
                }

                currentTime++; // Advance simulation time by 1ms
            }

            // Ensure the last running process's metrics are calculated if it completed at the end of the loop
            if (runningProcess && runningProcess.remainingBurstTime === 0 && !completedProcesses.includes(runningProcess)) {
                 calculateMetricsForProcess(runningProcess, currentTime);
                 completedProcesses.push(runningProcess);
            }

            // Merge consecutive segments of the same process for cleaner Gantt chart
            return { ganttChart: mergeGanttSegments(ganttChart), completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }


        /**
         * Priority Non-Preemptive Scheduling Algorithm.
         * Selects the process with the highest priority (lowest number) among arrived processes.
         * Once started, a process runs to completion.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulatePriorityNonPreemptive(processes) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            const n = processes.length;
            let completedCount = 0;

            const arrivedQueue = [];

            while (completedCount < n) {
                // Add newly arrived processes to arrivedQueue
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && !arrivedQueue.includes(p) && !completedProcesses.includes(p)) {
                        arrivedQueue.push(p);
                    }
                }

                const runnableProcesses = arrivedQueue.filter(p => !completedProcesses.includes(p));

                if (runnableProcesses.length === 0) {
                    // CPU Idle. Advance time to the next arrival.
                    let nextArrivalTime = Infinity;
                    for (const p of processes) {
                        if (!completedProcesses.includes(p) && p.arrivalTime > currentTime) {
                            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                        }
                    }
                    if (nextArrivalTime === Infinity) break; // All processes completed or no more to arrive
                    if (currentTime < nextArrivalTime) {
                        if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                           ganttChart[ganttChart.length - 1].end = nextArrivalTime;
                       } else {
                           ganttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
                       }
                       currentTime = nextArrivalTime;
                   }
                    continue; // Re-evaluate queue after time jump
                }

                // Sort by priority (lower number = higher priority), then by arrival time for tie-breaking
                runnableProcesses.sort((a, b) => {
                    if (a.priority === b.priority) {
                        return a.arrivalTime - b.arrivalTime;
                    }
                    return a.priority - b.priority;
                });

                const selectedProcess = runnableProcesses[0]; // Select the highest priority job

                const startTime = currentTime;
                if (selectedProcess.firstAllocationTime === -1) {
                    selectedProcess.firstAllocationTime = startTime;
                }

                currentTime += selectedProcess.burstTime; // Execute the process to completion

                ganttChart.push({ id: selectedProcess.id, start: startTime, end: currentTime });
                calculateMetricsForProcess(selectedProcess, currentTime);
                completedProcesses.push(selectedProcess);
                completedCount++;

                // Remove from arrivedQueue
                const index = arrivedQueue.indexOf(selectedProcess);
                if (index > -1) {
                    arrivedQueue.splice(index, 1);
                }
            }
            return { ganttChart, completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }

        /**
         * Priority Preemptive Scheduling Algorithm.
         * Selects the process with the highest priority (lowest number). Can preempt running process.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulatePriorityPreemptive(processes) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            let readyQueue = [];
            let runningProcess = null;
            const n = processes.length;
            let completedCount = 0;

            processes.sort((a, b) => a.arrivalTime - b.arrivalTime); // Sort by arrival for iteration

            while (completedCount < n) {
                // Add newly arrived processes to ready queue
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && !readyQueue.includes(p) && p.remainingBurstTime > 0) {
                        readyQueue.push(p);
                    }
                }

                readyQueue = readyQueue.filter(p => p.remainingBurstTime > 0); // Remove completed from queue
                // Sort ready queue by priority (lower number = higher priority), then by arrival time
                readyQueue.sort((a, b) => {
                    if (a.priority === b.priority) {
                        return a.arrivalTime - b.arrivalTime;
                    }
                    return a.priority - b.priority;
                });

                let nextProcessToRun = readyQueue.length > 0 ? readyQueue[0] : null;

                // Handle process completion
                if (runningProcess && runningProcess.remainingBurstTime === 0) {
                    calculateMetricsForProcess(runningProcess, currentTime);
                    completedProcesses.push(runningProcess);
                    completedCount++;
                    runningProcess = null;
                }

                // Preemption logic: If a new process arrives or becomes ready with higher priority
                if (runningProcess && nextProcessToRun && nextProcessToRun.id !== runningProcess.id && nextProcessToRun.priority < runningProcess.priority) {
                    // Preempt
                    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === runningProcess.id) {
                        ganttChart[ganttChart.length - 1].end = currentTime;
                    }
                    runningProcess = null;
                }

                // If no process is running, select the next one
                if (!runningProcess && nextProcessToRun) {
                    runningProcess = nextProcessToRun;
                    if (runningProcess.firstAllocationTime === -1) {
                        runningProcess.firstAllocationTime = currentTime;
                    }
                    ganttChart.push({ id: runningProcess.id, start: currentTime, end: currentTime });
                } else if (!runningProcess && !nextProcessToRun) {
                    // CPU Idle
                    let nextEventTime = Infinity;
                    for (const p of processes) {
                        if (p.remainingBurstTime > 0 && p.arrivalTime > currentTime) {
                            nextEventTime = Math.min(nextEventTime, p.arrivalTime);
                        }
                    }
                    if (nextEventTime === Infinity) break;
                    if (currentTime < nextEventTime) {
                        if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                            ganttChart[ganttChart.length - 1].end = nextEventTime;
                        } else {
                            ganttChart.push({ id: 'Idle', start: currentTime, end: nextEventTime });
                        }
                        currentTime = nextEventTime;
                        continue;
                    }
                }

                // Execute the running process for 1ms
                if (runningProcess) {
                    runningProcess.remainingBurstTime--;
                    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === runningProcess.id) {
                        ganttChart[ganttChart.length - 1].end = currentTime + 1;
                    }
                }
                currentTime++;
            }

            // Ensure the last running process's metrics are calculated
            if (runningProcess && runningProcess.remainingBurstTime === 0 && !completedProcesses.includes(runningProcess)) {
                 calculateMetricsForProcess(runningProcess, currentTime);
                 completedProcesses.push(runningProcess);
            }

            return { ganttChart: mergeGanttSegments(ganttChart), completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }


        /**
         * Round Robin (RR) Scheduling Algorithm.
         * Processes are executed in a cyclic manner with a fixed time quantum.
         * @param {Array<Object>} processes - Array of process objects.
         * @param {number} quantum - The time quantum for each process.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateRR(processes, quantum) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            let readyQueue = []; // Queue for processes ready to run
            const n = processes.length;
            let completedCount = 0;

            // Add a flag to track if a process has been added to the ready queue for the first time
            processes.forEach(p => p.addedToQueue = false);

            while (completedCount < n) {
                // Add newly arrived processes to the ready queue
                // Important: Processes arriving *at or before* currentTime should be added
                // This loop might add processes multiple times if not careful with `addedToQueue`
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && p.remainingBurstTime > 0 && !p.addedToQueue) {
                        readyQueue.push(p);
                        p.addedToQueue = true; // Mark as added to queue
                    }
                }

                // If readyQueue is empty, CPU is idle. Advance time to the next arrival.
                if (readyQueue.length === 0) {
                    let nextArrivalTime = Infinity;
                    for (const p of processes) {
                        if (p.remainingBurstTime > 0 && p.arrivalTime > currentTime) {
                            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                        }
                    }
                    if (nextArrivalTime === Infinity) break; // All processes finished or no more to arrive
                    if (currentTime < nextArrivalTime) {
                         if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                            ganttChart[ganttChart.length - 1].end = nextArrivalTime;
                        } else {
                            ganttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
                        }
                        currentTime = nextArrivalTime;
                    }
                    continue; // Re-evaluate queue after time jump
                }

                const currentProcess = readyQueue.shift(); // Get process from front of queue

                if (currentProcess.firstAllocationTime === -1) {
                    currentProcess.firstAllocationTime = currentTime;
                }

                // Determine actual execution time (min of remaining burst or quantum)
                const executionTime = Math.min(currentProcess.remainingBurstTime, quantum);
                const startTime = currentTime;
                currentTime += executionTime;
                currentProcess.remainingBurstTime -= executionTime;

                ganttChart.push({ id: currentProcess.id, start: startTime, end: currentTime });

                // After current process runs, check for new arrivals *again* before adding current process back
                // This ensures fairness for processes arriving during the quantum
                for (const p of processes) {
                    // Check processes that arrived *during* the quantum of the current process
                    if (p.arrivalTime > startTime && p.arrivalTime <= currentTime && p.remainingBurstTime > 0 && !p.addedToQueue) {
                        readyQueue.push(p);
                        p.addedToQueue = true;
                    }
                }

                if (currentProcess.remainingBurstTime === 0) {
                    calculateMetricsForProcess(currentProcess, currentTime);
                    completedProcesses.push(currentProcess);
                    completedCount++;
                } else {
                    readyQueue.push(currentProcess); // Add back to end of queue if not completed
                }
            }
            return { ganttChart: mergeGanttSegments(ganttChart), completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }


        /**
         * LJF (Longest Job First) Non-Preemptive Scheduling Algorithm.
         * Selects the process with the largest burst time among arrived processes.
         * Once started, a process runs to completion.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateLJFNonPreemptive(processes) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            const n = processes.length;
            let completedCount = 0;

            const arrivedQueue = [];

            while (completedCount < n) {
                // Add newly arrived processes
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && !arrivedQueue.includes(p) && !completedProcesses.includes(p)) {
                        arrivedQueue.push(p);
                    }
                }

                const runnableProcesses = arrivedQueue.filter(p => !completedProcesses.includes(p));

                if (runnableProcesses.length === 0) {
                    // CPU Idle. Advance time to the next arrival.
                    let nextArrivalTime = Infinity;
                    for (const p of processes) {
                        if (!completedProcesses.includes(p) && p.arrivalTime > currentTime) {
                            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                        }
                    }
                    if (nextArrivalTime === Infinity) break;
                    if (currentTime < nextArrivalTime) {
                        if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                           ganttChart[ganttChart.length - 1].end = nextArrivalTime;
                       } else {
                           ganttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
                       }
                       currentTime = nextArrivalTime;
                   }
                    continue;
                }

                // Sort by burst time (descending - longest first), then by arrival time for tie-breaking
                runnableProcesses.sort((a, b) => {
                    if (a.burstTime === b.burstTime) {
                        return a.arrivalTime - b.arrivalTime;
                    }
                    return b.burstTime - a.burstTime; // LJF: b.burstTime - a.burstTime
                });

                const selectedProcess = runnableProcesses[0];

                const startTime = currentTime;
                if (selectedProcess.firstAllocationTime === -1) {
                    selectedProcess.firstAllocationTime = startTime;
                }

                currentTime += selectedProcess.burstTime;

                ganttChart.push({ id: selectedProcess.id, start: startTime, end: currentTime });
                calculateMetricsForProcess(selectedProcess, currentTime);
                completedProcesses.push(selectedProcess);
                completedCount++;

                const index = arrivedQueue.indexOf(selectedProcess);
                if (index > -1) {
                    arrivedQueue.splice(index, 1);
                }
            }
            return { ganttChart, completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }

        /**
         * LRTF (Longest Remaining Time First) Preemptive LJF Scheduling Algorithm.
         * Selects the process with the largest remaining burst time. Can preempt running process.
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateLRTF(processes) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            let readyQueue = [];
            let runningProcess = null;
            const n = processes.length;
            let completedCount = 0;

            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

            while (completedCount < n) {
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && !readyQueue.includes(p) && p.remainingBurstTime > 0) {
                        readyQueue.push(p);
                    }
                }

                readyQueue = readyQueue.filter(p => p.remainingBurstTime > 0);
                // Sort ready queue by remaining burst time (descending - longest first)
                readyQueue.sort((a, b) => b.remainingBurstTime - a.remainingBurstTime);

                let nextProcessToRun = readyQueue.length > 0 ? readyQueue[0] : null;

                if (runningProcess && runningProcess.remainingBurstTime === 0) {
                    calculateMetricsForProcess(runningProcess, currentTime);
                    completedProcesses.push(runningProcess);
                    completedCount++;
                    runningProcess = null;
                }

                // Preemption logic: If a new process arrives or becomes ready with longer remaining time
                if (runningProcess && nextProcessToRun && nextProcessToRun.id !== runningProcess.id && nextProcessToRun.remainingBurstTime > runningProcess.remainingBurstTime) {
                    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === runningProcess.id) {
                        ganttChart[ganttChart.length - 1].end = currentTime;
                    }
                    runningProcess = null;
                }

                if (!runningProcess && nextProcessToRun) {
                    runningProcess = nextProcessToRun;
                    if (runningProcess.firstAllocationTime === -1) {
                        runningProcess.firstAllocationTime = currentTime;
                    }
                    ganttChart.push({ id: runningProcess.id, start: currentTime, end: currentTime });
                } else if (!runningProcess && !nextProcessToRun) {
                    // CPU Idle
                    let nextEventTime = Infinity;
                    for (const p of processes) {
                        if (p.remainingBurstTime > 0 && p.arrivalTime > currentTime) {
                            nextEventTime = Math.min(nextEventTime, p.arrivalTime);
                        }
                    }
                    if (nextEventTime === Infinity) break;
                    if (currentTime < nextEventTime) {
                        if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                            ganttChart[ganttChart.length - 1].end = nextEventTime;
                        } else {
                            ganttChart.push({ id: 'Idle', start: currentTime, end: nextEventTime });
                        }
                        currentTime = nextEventTime;
                        continue;
                    }
                }

                if (runningProcess) {
                    runningProcess.remainingBurstTime--;
                    if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === runningProcess.id) {
                        // Update the end of the last segment for this process
                        ganttChart[ganttChart.length - 1].end = currentTime + 1;
                    }
                }
                currentTime++;
            }

            if (runningProcess && runningProcess.remainingBurstTime === 0 && !completedProcesses.includes(runningProcess)) {
                 calculateMetricsForProcess(runningProcess, currentTime);
                 completedProcesses.push(runningProcess);
            }

            return { ganttChart: mergeGanttSegments(ganttChart), completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }


        /**
         * HRRN (Highest Response Ratio Next) Scheduling Algorithm.
         * Non-preemptive. Selects the process with the highest Response Ratio.
         * Response Ratio (RR) = (Waiting Time + Burst Time) / Burst Time
         * @param {Array<Object>} processes - Array of process objects.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateHRRN(processes) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            const n = processes.length;
            let completedCount = 0;

            // Keep original burst times for HRRN calculation (as remainingBurstTime changes)
            const originalProcesses = JSON.parse(JSON.stringify(processes));

            while (completedCount < n) {
                // Get all processes that have arrived and are not yet completed
                const arrivedProcesses = processes.filter(p =>
                    p.arrivalTime <= currentTime && !completedProcesses.includes(p)
                );

                if (arrivedProcesses.length === 0) {
                    // CPU Idle. Advance time to the next arrival.
                    let nextArrivalTime = Infinity;
                    for (const p of processes) {
                        if (!completedProcesses.includes(p) && p.arrivalTime > currentTime) {
                            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                        }
                    }
                    if (nextArrivalTime === Infinity) break;
                    if (currentTime < nextArrivalTime) {
                         if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                            ganttChart[ganttChart.length - 1].end = nextArrivalTime;
                        } else {
                            ganttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
                        }
                        currentTime = nextArrivalTime;
                    }
                    continue;
                }

                // Calculate Response Ratio for each arrived process
                for (const p of arrivedProcesses) {
                    const originalP = originalProcesses.find(op => op.id === p.id);
                    const waitingTime = currentTime - p.arrivalTime;
                    // Response Ratio (RR) = (Waiting Time + Burst Time) / Burst Time
                    // Use original burst time for RR calculation as per HRRN definition
                    p.responseRatio = (waitingTime + originalP.burstTime) / originalP.burstTime;
                }

                // Sort by HRRN (descending - highest ratio first), then by arrival time for tie-breaking
                arrivedProcesses.sort((a, b) => {
                    if (b.responseRatio === a.responseRatio) {
                        return a.arrivalTime - b.arrivalTime; // Tie-breaking
                    }
                    return b.responseRatio - a.responseRatio;
                });

                const selectedProcess = arrivedProcesses[0]; // Select the process with the highest HRRN

                const startTime = currentTime;
                if (selectedProcess.firstAllocationTime === -1) {
                    selectedProcess.firstAllocationTime = startTime;
                }

                currentTime += selectedProcess.burstTime; // Execute the process to completion

                ganttChart.push({ id: selectedProcess.id, start: startTime, end: currentTime });
                calculateMetricsForProcess(selectedProcess, currentTime);
                completedProcesses.push(selectedProcess);
                completedCount++;
            }
            return { ganttChart, completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }

        /**
         * MLFQ (Multilevel Feedback Queue) Scheduling Algorithm (Simplified).
         * Uses multiple queues with different priorities and scheduling policies.
         * - Q0 (Highest Priority): Round Robin with quantum `baseQuantum`
         * - Q1 (Medium Priority): Round Robin with quantum `baseQuantum * 2`
         * - Q2 (Lowest Priority): FCFS
         * Demotion: A process moves to a lower priority queue if it uses its full quantum.
         * Promotion: New processes always enter Q0. (Aging is not implemented for simplicity).
         * @param {Array<Object>} processes - Array of process objects.
         * @param {number} baseQuantum - The base time quantum for Q0.
         * @returns {{ganttChart: Array<Object>, completedProcesses: Array<Object>}} Simulation results.
         */
        function simulateMLFQ(processes, baseQuantum) {
            let currentTime = 0;
            const ganttChart = [];
            const completedProcesses = [];
            const n = processes.length;
            let completedCount = 0;

            let queue0 = []; // Highest priority, RR with quantum `baseQuantum`
            let queue1 = []; // Medium priority, RR with quantum `baseQuantum * 2`
            let queue2 = []; // Lowest priority, FCFS

            // Initialize processes: all start in Q0, and track if added to queue for first time
            processes.forEach(p => {
                p.currentQueue = 0;
                p.addedToQueue = false;
            });

            while (completedCount < n) {
                // Add newly arrived processes to Q0 (highest priority)
                for (const p of processes) {
                    if (p.arrivalTime <= currentTime && p.remainingBurstTime > 0 && !p.addedToQueue) {
                        queue0.push(p);
                        p.addedToQueue = true;
                    }
                }

                // Determine which queue has a process ready to run (Q0 > Q1 > Q2)
                let currentQueue = null;
                let quantumToUse = 0;

                if (queue0.length > 0) {
                    currentQueue = queue0;
                    quantumToUse = baseQuantum;
                } else if (queue1.length > 0) {
                    currentQueue = queue1;
                    quantumToUse = baseQuantum * 2;
                } else if (queue2.length > 0) {
                    currentQueue = queue2;
                    // For Q2 (FCFS), effectively no quantum limit, run until completion or preemption by higher queue
                    quantumToUse = Infinity;
                }

                if (!currentQueue || currentQueue.length === 0) {
                    // CPU Idle - no process ready in any queue. Advance time to the next arrival.
                    let nextArrivalTime = Infinity;
                    for (const p of processes) {
                        if (p.remainingBurstTime > 0 && p.arrivalTime > currentTime) {
                            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
                        }
                    }
                    if (nextArrivalTime === Infinity) break; // All processes completed or no more to arrive
                    if (currentTime < nextArrivalTime) {
                        if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === 'Idle') {
                            ganttChart[ganttChart.length - 1].end = nextArrivalTime;
                        } else {
                            ganttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
                        }
                        currentTime = nextArrivalTime;
                    }
                    continue; // Re-evaluate queues after time jump
                }

                const processToRun = currentQueue.shift(); // Get the process from the selected queue

                if (processToRun.firstAllocationTime === -1) {
                    processToRun.firstAllocationTime = currentTime;
                }

                let actualRunTime = Math.min(processToRun.remainingBurstTime, quantumToUse);
                const startTime = currentTime;
                let preempted = false;

                // Simulate execution tick by tick to allow for new arrivals and preemption
                for (let i = 0; i < actualRunTime; i++) {
                    // Check for higher priority arrivals every tick
                    // This is crucial for preemption in MLFQ
                    for (const p of processes) {
                        if (p.arrivalTime === currentTime + 1 && p.remainingBurstTime > 0 && !p.addedToQueue) {
                            queue0.push(p); // New arrivals always go to Q0
                            p.addedToQueue = true;
                            // If a higher priority process arrives, preempt the current process
                            if (processToRun.currentQueue !== 0) { // If current process is not in Q0
                                preempted = true;
                                break; // Exit inner loop to handle preemption
                            }
                        }
                    }

                    if (preempted) {
                        // Put the preempted process back into its current queue (at the front if it's RR)
                        if (processToRun.currentQueue === 0) queue0.unshift(processToRun);
                        else if (processToRun.currentQueue === 1) queue1.unshift(processToRun);
                        else queue2.unshift(processToRun);
                        break; // Exit the for loop for this process's execution
                    }

                    processToRun.remainingBurstTime--;
                    currentTime++; // Advance time by 1ms
                    if (processToRun.remainingBurstTime === 0) {
                        break; // Process completed its execution
                    }
                }

                ganttChart.push({ id: processToRun.id, start: startTime, end: currentTime });

                if (processToRun.remainingBurstTime === 0) {
                    calculateMetricsForProcess(processToRun, currentTime);
                    completedProcesses.push(processToRun);
                    completedCount++;
                } else if (!preempted) { // Process finished its quantum but not completed, and was not preempted
                    // Demotion logic: move to next lower priority queue
                    if (processToRun.currentQueue === 0) {
                        processToRun.currentQueue = 1;
                        queue1.push(processToRun);
                    } else if (processToRun.currentQueue === 1) {
                        processToRun.currentQueue = 2;
                        queue2.push(processToRun);
                    } else { // Already in Q2 (lowest), stays there
                        queue2.push(processToRun);
                    }
                }
                // If preempted, it was already put back into its queue.
            }
            return { ganttChart: mergeGanttSegments(ganttChart), completedProcesses: completedProcesses.sort((a,b) => parseInt(a.id.substring(1)) - parseInt(b.id.substring(1))) };
        }


        // --- Gantt Chart and Metrics Display Functions ---

        /**
         * Merges consecutive Gantt chart segments for the same process
         * to create cleaner, continuous bars.
         * @param {Array<Object>} gantt - Raw Gantt chart segments.
         * @returns {Array<Object>} Merged Gantt chart segments.
         */
        function mergeGanttSegments(gantt) {
            if (gantt.length === 0) return [];
            const merged = [];
            let currentSegment = { ...gantt[0] }; // Start with the first segment

            for (let i = 1; i < gantt.length; i++) {
                const nextSegment = gantt[i];
                // If current and next segments are for the same process and are contiguous
                if (currentSegment.id === nextSegment.id && currentSegment.end === nextSegment.start) {
                    currentSegment.end = nextSegment.end; // Extend the current segment
                } else {
                    merged.push(currentSegment); // Push the completed segment
                    currentSegment = { ...nextSegment }; // Start a new segment
                }
            }
            merged.push(currentSegment); // Push the last segment after the loop
            return merged;
        }


        /**
         * Renders the Gantt chart visualization.
         * @param {Array<Object>} ganttData - Array of Gantt chart segments ({id, start, end}).
         */
        function displayGanttChart(ganttData) {
            ganttChartDiv.innerHTML = ''; // Clear previous chart
            ganttTimeAxisDiv.innerHTML = ''; // Clear previous time axis

            if (ganttData.length === 0) {
                showAlert('No Gantt chart data to display.', 'info');
                return;
            }

            // Get unique process IDs for creating rows, including 'Idle' if present
            const processIds = [...new Set(ganttData.map(d => d.id))].filter(id => id !== 'Idle');
            processIds.sort((a,b) => parseInt(a.substring(1)) - parseInt(b.substring(1))); // Sort numerically (P1, P2, etc.)
            if (ganttData.some(d => d.id === 'Idle')) {
                processIds.push('Idle'); // Add 'Idle' at the end if it exists in data
            }

            // Calculate total time span for scaling the chart width
            const maxTime = Math.max(...ganttData.map(d => d.end));
            const minTime = Math.min(...ganttData.map(d => d.start)); // Should typically be 0
            const totalDuration = maxTime - minTime;

            // Define pixels per millisecond for scaling. Adjust this value for desired chart width.
            const pxPerMs = 20;
            const chartWidth = totalDuration * pxPerMs;

            // Set minimum width for the chart containers to enable horizontal scrolling if needed
            ganttChartDiv.style.minWidth = `${chartWidth + 100}px`; // Add some padding for better appearance
            ganttTimeAxisDiv.style.minWidth = `${chartWidth + 100}px`;


            // Group segments by process ID for easier rendering of rows
            const processGanttMap = new Map();
            processIds.forEach(id => processGanttMap.set(id, [])); // Initialize map with all process IDs
            ganttData.forEach(segment => {
                if (processGanttMap.has(segment.id)) {
                    processGanttMap.get(segment.id).push(segment);
                }
            });


            // Render each process row and its Gantt bars
            let animationDelay = 0;
            processGanttMap.forEach((segments, procId) => {
                const row = document.createElement('div');
                row.classList.add('gantt-chart-row');

                const label = document.createElement('div');
                label.classList.add('gantt-label');
                label.textContent = procId; // Display P1, P2, Idle etc.
                row.appendChild(label);

                const barsContainer = document.createElement('div');
                barsContainer.classList.add('gantt-bars');
                barsContainer.style.width = `${chartWidth}px`; // Ensure bars container takes full calculated width

                segments.forEach(segment => {
                    const bar = document.createElement('div');
                    bar.classList.add('gantt-bar');
                    // Use assigned color or a default grey for 'Idle'
                    bar.style.backgroundColor = procId === 'Idle' ? '#444' : processColors[procId];
                    bar.style.left = `${segment.start * pxPerMs}px`; // Position bar
                    bar.style.width = `${(segment.end - segment.start) * pxPerMs}px`; // Set bar width
                    bar.title = `${segment.id}: ${segment.start} - ${segment.end} ms`; // Tooltip on hover
                    bar.textContent = segment.id; // Text displayed on the bar
                    barsContainer.appendChild(bar);

                    // Trigger animation with a slight delay for staggered effect
                    setTimeout(() => {
                        bar.classList.add('animate-in');
                    }, animationDelay);
                    animationDelay += 50; // Increment delay for next bar
                });
                row.appendChild(barsContainer);
                ganttChartDiv.appendChild(row);
            });


            // Create Time Axis
            for (let t = 0; t <= maxTime; t++) {
                if (t % 5 === 0) { // Major ticks every 5ms
                    const timeUnit = document.createElement('div');
                    timeUnit.classList.add('gantt-time-unit', 'major-tick');
                    timeUnit.textContent = t;
                    timeUnit.style.left = `${t * pxPerMs}px`;
                    ganttTimeAxisDiv.appendChild(timeUnit);
                } else if (t % 1 === 0) { // Minor ticks every 1ms
                    const timeUnit = document.createElement('div');
                    timeUnit.classList.add('gantt-time-unit');
                    timeUnit.textContent = '|'; // Simple tick mark
                    timeUnit.style.left = `${t * pxPerMs}px`;
                    timeUnit.style.fontSize = '0.7em';
                    timeUnit.style.top = '-5px'; // Position slightly above the axis line
                    ganttTimeAxisDiv.appendChild(timeUnit);
                }
            }
        }

        /**
         * Calculates and displays average waiting time, turnaround time, and response time.
         * @param {Array<Object>} completedProcesses - Array of completed process objects with calculated metrics.
         */
        function calculateAndDisplayMetrics(completedProcesses) {
            if (completedProcesses.length === 0) {
                avgWaitingTimeSpan.textContent = '0.00 ms';
                avgTurnaroundTimeSpan.textContent = '0.00 ms';
                avgResponseTimeSpan.textContent = '0.00 ms';
                return;
            }

            let totalWaitingTime = 0;
            let totalTurnaroundTime = 0;
            let totalResponseTime = 0;

            completedProcesses.forEach(p => {
                totalWaitingTime += p.waitingTime;
                totalTurnaroundTime += p.turnaroundTime;
                totalResponseTime += p.responseTime;
            });

            const numProcesses = completedProcesses.length;
            avgWaitingTimeSpan.textContent = `${(totalWaitingTime / numProcesses).toFixed(2)} ms`;
            avgTurnaroundTimeSpan.textContent = `${(totalTurnaroundTime / numProcesses).toFixed(2)} ms`;
            avgResponseTimeSpan.textContent = `${(totalResponseTime / numProcesses).toFixed(2)} ms`;
        }



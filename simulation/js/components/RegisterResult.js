// js/components/RegisterResult.js

class RegisterResult {
    constructor(containerId, scoreboard) {
        this.container = document.getElementById(containerId);
        this.scoreboard = scoreboard;
        this.render();
    }

    render() {
        // Create a simple table showing which functional unit will write to each register
        let tableHTML = `
            <table class="w-full">
                <thead>
                    <tr>
                        <th class="w-1/6">Register</th>
                        <th>Functional Unit</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Add rows for registers that are being written
        let hasEntries = false;
        for (const [register, functionalUnit] of Object.entries(this.scoreboard.registerStatus)) {
            if (functionalUnit) {
                hasEntries = true;
                tableHTML += `
                    <tr>
                        <td class="font-mono">${register}</td>
                        <td>${functionalUnit}</td>
                    </tr>
                `;
            }
        }

        // If no entries, show a message
        if (!hasEntries) {
            tableHTML += `
                <tr>
                    <td colspan="2" class="text-center py-4 text-gray-500">
                        No registers are currently being written.
                    </td>
                </tr>
            `;
        }

        tableHTML += `
                </tbody>
            </table>
        `;

        this.container.innerHTML = tableHTML;
    }
}

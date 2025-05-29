// js/components/FunctionalUnitStatus.js

class FunctionalUnitStatus {
    constructor(containerId, scoreboard) {
        this.container = document.getElementById(containerId);
        this.scoreboard = scoreboard;
        this.render();
    }

    render() {
        let tableHTML = `
            <table class="w-full">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Busy</th>
                        <th>Op</th>
                        <th>Fi</th>
                        <th>Fj</th>
                        <th>Fk</th>
                        <th>Qj</th>
                        <th>Qk</th>
                        <th>Rj</th>
                        <th>Rk</th>
                        <th>Cycles Remaining</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.scoreboard.functionalUnits.forEach(unit => {
            // Determine the CSS class for the cycles column based on value
            let cyclesClass = '';
            if (unit.busy) {
                if (unit.cyclesRemaining > 5) {
                    cyclesClass = 'cycles-high';
                } else if (unit.cyclesRemaining > 2) {
                    cyclesClass = 'cycles-medium';
                } else {
                    cyclesClass = 'cycles-low';
                }
            }
            
            tableHTML += `
                <tr>
                    <td>${unit.name}</td>
                    <td>${unit.busy ? 'Yes' : 'No'}</td>
                    <td>${unit.op || ''}</td>
                    <td>${unit.fi || ''}</td>
                    <td>${unit.fj || ''}</td>
                    <td>${unit.fk || ''}</td>
                    <td>${unit.qj || ''}</td>
                    <td>${unit.qk || ''}</td>
                    <td>${unit.rj !== null ? (unit.rj ? 'Yes' : 'No') : ''}</td>
                    <td>${unit.rk !== null ? (unit.rk ? 'Yes' : 'No') : ''}</td>
                    <td class="${cyclesClass}">${unit.busy ? unit.cyclesRemaining : ''}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        this.container.innerHTML = tableHTML;
    }
}

/**
 * Action Service
 *
 * Generates structured "recommended next action" records from the same
 * priority/gap data InsightService already computes — entirely
 * deterministic, no AI involved. Each action links back to a specific
 * geography + metric, has an owner role, a priority tier, a due date
 * offset, and a status, matching the assignment's Tier 3 spec.
 *
 * These are generated fresh on each request rather than persisted, since
 * there's no action-tracking workflow (marking done, reassigning, etc.) in
 * scope for this assignment — they're a planning aid surfaced alongside the
 * review, not a task management system. A production version would persist
 * these to a table with update endpoints; that's called out in the README
 * as a future improvement.
 */
export class ActionService {
    /**
     * @param {object} insight - output of InsightService.buildMonthlyReviewSummary
     * @param {string} insight.month - 'YYYY-MM' reporting month, used to compute due dates
     */
    static generateRecommendedActions(insight) {
        const actions = [];
        const dueDate = (daysFromMonthEnd) => this._addDaysToMonthEnd(insight.month, daysFromMonthEnd);

        // 1. Critical/At Risk districts — highest priority, Program Manager owns
        insight.priorityDistricts.slice(0, 3).forEach((d, i) => {
            actions.push({
                id: `action-district-${d.name.replace(/\s+/g, '-').toLowerCase()}`,
                title: `Follow up with ${d.name} on ${d.risk.toLowerCase()} status`,
                owner: 'Program Manager',
                priority: d.risk === 'Critical' ? 'High' : 'Medium',
                dueDate: dueDate(d.risk === 'Critical' ? 7 : 14),
                status: 'Not Started',
                linkedMetric: 'Attendance rate',
                linkedGeography: { type: 'district', name: d.name },
                context: `${d.name} is currently ${d.risk} at ${(d.attendanceRate * 100).toFixed(1)}% attendance.`
            });
        });

        // 2. Critical/At Risk blocks — Block Coordinator owns
        insight.priorityBlocks.slice(0, 3).forEach((b) => {
            actions.push({
                id: `action-block-${b.name.replace(/\s+/g, '-').toLowerCase()}`,
                title: `Schedule field visit for ${b.name}`,
                owner: 'Block Coordinator',
                priority: b.risk === 'Critical' ? 'High' : 'Medium',
                dueDate: dueDate(b.risk === 'Critical' ? 7 : 14),
                status: 'Not Started',
                linkedMetric: 'Completion rate',
                linkedGeography: { type: 'block', name: b.name },
                context: `${b.name} is currently ${b.risk} at ${(b.completionRate * 100).toFixed(1)}% completion.`
            });
        });

        // 3. Evidence submission gap — M&E Lead owns, program-wide
        if (insight.headline.evidenceRate < 0.6) {
            actions.push({
                id: 'action-evidence-gap',
                title: 'Investigate low evidence submission rate program-wide',
                owner: 'M&E Lead',
                priority: insight.headline.evidenceRate < 0.4 ? 'High' : 'Medium',
                dueDate: dueDate(10),
                status: 'Not Started',
                linkedMetric: 'Evidence submission rate',
                linkedGeography: { type: 'program', name: 'All districts' },
                context: `Evidence submission rate is ${(insight.headline.evidenceRate * 100).toFixed(1)}% this month.`
            });
        }

        // 4. Declining attendance trend — Program Manager owns
        if (insight.movement && insight.movement.attendanceRateDelta < -2) {
            actions.push({
                id: 'action-attendance-decline',
                title: 'Review root cause of declining attendance trend',
                owner: 'Program Manager',
                priority: 'High',
                dueDate: dueDate(7),
                status: 'Not Started',
                linkedMetric: 'Attendance rate (month-over-month)',
                linkedGeography: { type: 'program', name: 'All districts' },
                context: `Attendance rate declined ${insight.movement.attendanceRateDelta.toFixed(1)} percentage points since ${insight.previousMonth}.`
            });
        }

        return actions.slice(0, 5); // cap at 5 per Tier 3 spec ("3-5 next actions")
    }

    static _addDaysToMonthEnd(month, days) {
        // month is 'YYYY-MM' — treat "month end" as the 28th to stay safe
        // across all months without needing a date library.
        const [year, mon] = month.split('-').map(Number);
        const base = new Date(year, mon - 1, 28);
        base.setDate(base.getDate() + days);
        return base.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    }
}
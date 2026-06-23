import { RiskService } from './risk.services.js';

/**
 * Aggregation Service
 *
 * Pure computation layer that turns arrays of raw school_responses rows
 * (as returned by SchoolResponseRepository) into the metrics the dashboard
 * needs: totals, rates, risk distribution, and per-geography breakdowns.
 *
 * Deliberately framework-agnostic and DB-agnostic — takes plain row arrays
 * in, returns plain objects out. This is what makes it unit-testable
 * without a database or HTTP server.
 */
export class AggregationService {
    /**
     * Compute summary KPIs from an array of school_responses rows.
     */
    static summarizeResponses(rows) {
        let totalSchools = rows.length;
        let conductedCount = 0;
        let evidenceCount = 0;
        let totalEnrollment = 0;
        let totalAttendance = 0;

        const riskDistribution = { 'On Track': 0, 'Behind': 0, 'At Risk': 0, 'Critical': 0 };

        for (const row of rows) {
            const isConducted = row.conducted_pbl === 'Yes';
            const isEvidence = row.evidence_submitted === 'Yes';

            if (isConducted) conductedCount++;
            if (isEvidence) evidenceCount++;

            totalEnrollment += row.derived_total_enrollment || 0;
            totalAttendance += row.derived_total_attendance || 0;

            if (riskDistribution[row.derived_risk_status] !== undefined) {
                riskDistribution[row.derived_risk_status]++;
            } else {
                riskDistribution['Critical']++;
            }
        }

        // IMPORTANT: attendance_rate is NOT totalAttendance / totalEnrollment.
        // The source data tracks attendance per enrolled student across BOTH
        // a Science session and a Math session for every class (regardless
        // of the school's labeled "subject taught" — the raw CSV populates
        // both attendance columns inconsistently relative to that label).
        // This means total_attendance can legitimately exceed
        // total_enrollment (a student attending both sessions counts twice).
        // The correct denominator is enrollment * 2 (max possible
        // attendance-instances per student). Verified against all 6,900
        // source rows: this reproduces the CSV's own "Derived: Overall PBL
        // attendance rate" column exactly, with zero mismatches.
        const overallAttendanceRate = totalEnrollment > 0 ? (totalAttendance / (totalEnrollment * 2)) : 0;
        const completionRate = totalSchools > 0 ? (conductedCount / totalSchools) : 0;
        const evidenceRate = totalSchools > 0 ? (evidenceCount / totalSchools) : 0;

        return {
            totalSchools,
            conductedCount,
            evidenceCount,
            totalEnrollment,
            totalAttendance,
            completionRate,
            evidenceRate,
            overallAttendanceRate,
            riskDistribution
        };
    }

    /**
     * Group rows by an arbitrary field (e.g. district_name, block_details)
     * and compute a summary + recalculated risk status for each group.
     *
     * Risk status here is recalculated from the GROUP's aggregate attendance
     * rate (not a majority vote of individual school statuses) — this
     * mirrors how a program reviewer reads "this district is At Risk", as
     * a property of the district's combined numbers.
     */
    static groupByField(rows, fieldName) {
        const groups = {};
        for (const row of rows) {
            const key = row[fieldName] || 'Unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        }

        const result = [];
        for (const [key, groupRows] of Object.entries(groups)) {
            const summary = this.summarizeResponses(groupRows);
            const calculatedRisk = RiskService.calculateRiskStatus(
                summary.conductedCount > 0,
                summary.overallAttendanceRate
            );

            result.push({
                name: key,
                ...summary,
                calculatedRisk
            });
        }

        return result;
    }

    /**
     * Compute month-over-month movement between two summary objects
     * (e.g. current month vs previous month) for the metrics that matter
     * most in a review: completion rate and attendance rate.
     * Returns signed percentage-point deltas, or null if no prior data.
     */
    static computeMovement(currentSummary, previousSummary) {
        if (!previousSummary) return null;

        const pp = (curr, prev) => Math.round((curr - prev) * 1000) / 10; // delta in percentage points, 1 decimal

        return {
            completionRateDelta: pp(currentSummary.completionRate, previousSummary.completionRate),
            evidenceRateDelta: pp(currentSummary.evidenceRate, previousSummary.evidenceRate),
            attendanceRateDelta: pp(currentSummary.overallAttendanceRate, previousSummary.overallAttendanceRate)
        };
    }

    /**
     * Rank groups (from groupByField) into top/bottom performers by
     * attendance rate, for "where does follow-up happen first" views.
     */
    static rankPerformance(groupedRows, limit = 5) {
        const sorted = [...groupedRows].sort((a, b) => b.overallAttendanceRate - a.overallAttendanceRate);
        return {
            topPerformers: sorted.slice(0, limit),
            bottomPerformers: sorted.slice(-limit).reverse()
        };
    }
}
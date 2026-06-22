import { RiskService } from './risk.service.js';

export class AggregationService {
    /**
     * Compute full dashboard rollups from an array of raw SQLite database results
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

            // Increment computed risk status mapping counters
            if (riskDistribution[row.derived_risk_status] !== undefined) {
                riskDistribution[row.derived_risk_status]++;
            } else {
                riskDistribution['Critical']++;
            }
        }

        const overallAttendanceRate = totalEnrollment > 0 ? (totalAttendance / totalEnrollment) : 0;
        const completionRate = totalSchools > 0 ? (conductedCount / totalSchools) : 0;
        const evidenceRate = conductedCount > 0 ? (evidenceCount / conductedCount) : 0;

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
     * Group items dynamically to form rows for hierarchical tables
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
}
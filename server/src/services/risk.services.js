export class RiskService {
    /**
     * Compute risk status for an individual school record or an aggregate.
     * @param {boolean} conducted - Did PBL get conducted at all?
     * @param {number} attendanceRate - Decimal rate (0.0 to 1.0)
     * @returns {'On Track'|'Behind'|'At Risk'|'Critical'}
     */
    static calculateRiskStatus(conducted, attendanceRate) {
        if (!conducted) return 'Critical';

        const pct = attendanceRate * 100;

        if (pct >= 75.0) return 'On Track';
        if (pct >= 60.0) return 'Behind';
        if (pct >= 35.0) return 'At Risk';
        return 'Critical';
    }

    /**
     * Hex color for a given risk status, used by frontend badges/charts.
     */
    static getRiskColor(status) {
        switch (status) {
            case 'On Track': return '#10B981'; // green
            case 'Behind':   return '#F59E0B'; // amber
            case 'At Risk':  return '#EF4444'; // red
            case 'Critical': return '#7F1D1D'; // dark red
            default:         return '#6B7280'; // grey
        }
    }

    /**
     * Returns true if a status is considered "needs follow-up" for
     * prioritization views (Behind, At Risk, Critical all qualify).
     */
    static needsFollowUp(status) {
        return status !== 'On Track';
    }
}
/**
 * Deterministic Risk Engine
 * Replicates program criteria purely based on attendance percentages and engagement metrics.
 */
export class RiskService {
    /**
     * Compute risk status for individual school records or aggregates
     * @param {boolean} conducted - Did the school conduct the session?
     * @param {number} attendanceRate - Calculated decimal rate (0.0 to 1.0)
     * @returns {string} Risk Classification Label
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
     * Determine hex styling for front-end rendering indicators
     */
    static getRiskColor(status) {
        switch (status) {
            case 'On Track': return '#10B981'; // Vivid Green
            case 'Behind':   return '#F59E0B'; // Soft Amber
            case 'At Risk':  return '#EF4444'; // Orange-Red
            case 'Critical': return '#7F1D1D'; // Dark Maroon
            default:         return '#6B7280'; // Slate Grey
        }
    }
}
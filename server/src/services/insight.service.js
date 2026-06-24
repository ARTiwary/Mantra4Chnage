import { RiskService } from './risk.services.js';

export class InsightService {
    static buildMonthlyReviewSummary({ summary, previousSummary, districtBreakdown, blockBreakdown, month, previousMonth }) {
        const movement = previousSummary
            ? {
                completionRateDelta: this._pp(summary.completionRate, previousSummary.completionRate),
                evidenceRateDelta: this._pp(summary.evidenceRate, previousSummary.evidenceRate),
                attendanceRateDelta: this._pp(summary.overallAttendanceRate, previousSummary.overallAttendanceRate)
            }
            : null;

        const achievements = this._buildAchievements(summary, movement);
        const risks = this._buildRisks(summary, districtBreakdown, blockBreakdown);
        const priorityDistricts = this._rankNeedsFollowUp(districtBreakdown).slice(0, 5);
        const priorityBlocks = this._rankNeedsFollowUp(blockBreakdown).slice(0, 5);
        const discussionPoints = this._buildDiscussionPoints(summary, movement, priorityDistricts, priorityBlocks);

        return {
            month,
            previousMonth,
            headline: {
                totalSchools: summary.totalSchools,
                conductedCount: summary.conductedCount,
                completionRate: summary.completionRate,
                evidenceRate: summary.evidenceRate,
                overallAttendanceRate: summary.overallAttendanceRate,
                riskDistribution: summary.riskDistribution
            },
            movement,
            achievements,
            risks,
            priorityDistricts,
            priorityBlocks,
            discussionPoints
        };
    }

    static buildGeographySummary({ summary, previousSummary, geographyName, geographyType, month, previousMonth, calculatedRisk }) {
        const movement = previousSummary
            ? {
                completionRateDelta: this._pp(summary.completionRate, previousSummary.completionRate),
                evidenceRateDelta: this._pp(summary.evidenceRate, previousSummary.evidenceRate),
                attendanceRateDelta: this._pp(summary.overallAttendanceRate, previousSummary.overallAttendanceRate)
            }
            : null;

        return {
            geographyName,
            geographyType,
            month,
            previousMonth,
            calculatedRisk,
            headline: {
                totalSchools: summary.totalSchools,
                conductedCount: summary.conductedCount,
                completionRate: summary.completionRate,
                evidenceRate: summary.evidenceRate,
                overallAttendanceRate: summary.overallAttendanceRate,
                riskDistribution: summary.riskDistribution
            },
            movement,
            needsFollowUp: RiskService.needsFollowUp(calculatedRisk)
        };
    }

    static _pp(curr, prev) {
        return Math.round((curr - prev) * 1000) / 10;
    }

    static _buildAchievements(summary, movement) {
        const items = [];
        if (summary.completionRate >= 0.75) {
            items.push(`Completion rate stands at ${(summary.completionRate * 100).toFixed(1)}%, at or above the On Track threshold.`);
        }
        if (movement && movement.completionRateDelta > 0) {
            items.push(`Completion rate improved by ${movement.completionRateDelta.toFixed(1)} percentage points since last month.`);
        }
        if (movement && movement.attendanceRateDelta > 0) {
            items.push(`Attendance rate improved by ${movement.attendanceRateDelta.toFixed(1)} percentage points since last month.`);
        }
        if (movement && movement.evidenceRateDelta > 0) {
            items.push(`Evidence submission improved by ${movement.evidenceRateDelta.toFixed(1)} percentage points since last month.`);
        }
        const onTrackShare = summary.totalSchools > 0 ? summary.riskDistribution['On Track'] / summary.totalSchools : 0;
        if (onTrackShare >= 0.3) {
            items.push(`${(onTrackShare * 100).toFixed(1)}% of schools are classified On Track this month.`);
        }
        if (items.length === 0) {
            items.push('No standout improvements this month — see risks and priorities below for where to focus.');
        }
        return items;
    }

    static _buildRisks(summary, districtBreakdown, blockBreakdown) {
        const items = [];
        const total = summary.totalSchools || 1;
        const criticalShare = summary.riskDistribution['Critical'] / total;
        const atRiskShare = summary.riskDistribution['At Risk'] / total;

        if (criticalShare > 0) {
            items.push(`${summary.riskDistribution['Critical']} schools (${(criticalShare * 100).toFixed(1)}%) are classified Critical this month.`);
        }
        if (atRiskShare > 0.15) {
            items.push(`${(atRiskShare * 100).toFixed(1)}% of schools are At Risk — attendance between 35% and 60%.`);
        }
        if (summary.evidenceRate < 0.5) {
            items.push(`Evidence submission rate (${(summary.evidenceRate * 100).toFixed(1)}%) is below half of all schools.`);
        }

        const criticalDistricts = districtBreakdown.filter(d => d.calculatedRisk === 'Critical');
        if (criticalDistricts.length > 0) {
            items.push(`${criticalDistricts.length} district(s) are classified Critical: ${criticalDistricts.map(d => d.name).join(', ')}.`);
        }

        if (items.length === 0) {
            items.push('No major risk flags this month at the current filter scope.');
        }
        return items;
    }

    static _rankNeedsFollowUp(groupedRows) {
        return [...groupedRows]
            .filter(g => RiskService.needsFollowUp(g.calculatedRisk))
            .sort((a, b) => a.overallAttendanceRate - b.overallAttendanceRate)
            .map(g => ({
                name: g.name,
                risk: g.calculatedRisk,
                attendanceRate: g.overallAttendanceRate,
                completionRate: g.completionRate,
                totalSchools: g.totalSchools
            }));
    }

    static _buildDiscussionPoints(summary, movement, priorityDistricts, priorityBlocks) {
        const points = [];
        points.push(`Review overall completion (${(summary.completionRate * 100).toFixed(1)}%) and evidence submission (${(summary.evidenceRate * 100).toFixed(1)}%) against program targets.`);

        if (priorityDistricts.length > 0) {
            const top = priorityDistricts[0];
            points.push(`Discuss follow-up plan for ${top.name}, currently ${top.risk} at ${(top.attendanceRate * 100).toFixed(1)}% attendance.`);
        }
        if (priorityBlocks.length > 0) {
            const top = priorityBlocks[0];
            points.push(`Identify block-level support needed for ${top.name} (${top.risk}).`);
        }
        if (movement) {
            const direction = movement.attendanceRateDelta >= 0 ? 'improving' : 'declining';
            points.push(`Attendance trend is ${direction} month-over-month (${movement.attendanceRateDelta >= 0 ? '+' : ''}${movement.attendanceRateDelta.toFixed(1)}pp) — confirm whether this matches field reports.`);
        }
        points.push('Confirm evidence collection process for schools currently marked Critical due to non-conduct.');

        return points;
    }
}
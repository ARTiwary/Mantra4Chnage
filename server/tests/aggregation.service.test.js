import { describe, it, expect } from 'vitest';
import { AggregationService } from '../src/services/aggregation.service.js';

const mockRow = (overrides = {}) => ({
    district_name: 'District A',
    block_details: 'District A - Block 001',
    conducted_pbl: 'Yes',
    evidence_submitted: 'Yes',
    derived_total_enrollment: 100,
    derived_total_attendance: 80,
    derived_risk_status: 'On Track',
    ...overrides
});

describe('AggregationService.summarizeResponses', () => {
    it('returns all-zero summary for an empty row set', () => {
        const summary = AggregationService.summarizeResponses([]);
        expect(summary.totalSchools).toBe(0);
        expect(summary.completionRate).toBe(0);
        expect(summary.evidenceRate).toBe(0);
        expect(summary.overallAttendanceRate).toBe(0);
    });

    it('computes completion rate as conducted / total schools', () => {
        const rows = [
            mockRow({ conducted_pbl: 'Yes' }),
            mockRow({ conducted_pbl: 'Yes' }),
            mockRow({ conducted_pbl: 'No', derived_total_enrollment: 0, derived_total_attendance: 0 }),
            mockRow({ conducted_pbl: 'No', derived_total_enrollment: 0, derived_total_attendance: 0 })
        ];
        const summary = AggregationService.summarizeResponses(rows);
        expect(summary.totalSchools).toBe(4);
        expect(summary.conductedCount).toBe(2);
        expect(summary.completionRate).toBe(0.5);
    });

    it('computes evidence rate as evidence-submitted / total schools', () => {
        const rows = [
            mockRow({ evidence_submitted: 'Yes' }),
            mockRow({ evidence_submitted: 'No' }),
            mockRow({ evidence_submitted: 'No' }),
            mockRow({ evidence_submitted: 'No' })
        ];
        const summary = AggregationService.summarizeResponses(rows);
        expect(summary.evidenceRate).toBe(0.25);
    });

    it('computes overall attendance rate as total attendance / (total enrollment * 2)', () => {
        // Denominator is enrollment*2 because attendance is tracked per
        // student across both a Science session and a Math session — see
        // aggregation.service.js for the full explanation and verification
        // against source data.
        const rows = [
            mockRow({ derived_total_enrollment: 100, derived_total_attendance: 80 }),
            mockRow({ derived_total_enrollment: 200, derived_total_attendance: 100 })
        ];
        const summary = AggregationService.summarizeResponses(rows);
        // (80+100) / ((100+200)*2) = 180/600 = 0.3
        expect(summary.overallAttendanceRate).toBeCloseTo(0.3, 5);
    });

    it('tallies risk distribution across all four buckets', () => {
        const rows = [
            mockRow({ derived_risk_status: 'On Track' }),
            mockRow({ derived_risk_status: 'Behind' }),
            mockRow({ derived_risk_status: 'At Risk' }),
            mockRow({ derived_risk_status: 'Critical' }),
            mockRow({ derived_risk_status: 'Critical' })
        ];
        const summary = AggregationService.summarizeResponses(rows);
        expect(summary.riskDistribution).toEqual({
            'On Track': 1,
            'Behind': 1,
            'At Risk': 1,
            'Critical': 2
        });
    });
});

describe('AggregationService.groupByField', () => {
    it('groups rows by the given field and computes per-group summaries', () => {
        const rows = [
            mockRow({ district_name: 'District A', derived_total_enrollment: 100, derived_total_attendance: 170 }), // 170/200 = 85% -> On Track
            mockRow({ district_name: 'District A', derived_total_enrollment: 100, derived_total_attendance: 170 }),
            mockRow({ district_name: 'District B', derived_total_enrollment: 100, derived_total_attendance: 40 })   // 40/200 = 20% -> Critical
        ];
        const grouped = AggregationService.groupByField(rows, 'district_name');
        const a = grouped.find(g => g.name === 'District A');
        const b = grouped.find(g => g.name === 'District B');

        expect(a.totalSchools).toBe(2);
        expect(a.calculatedRisk).toBe('On Track'); // 85% attendance
        expect(b.totalSchools).toBe(1);
        expect(b.calculatedRisk).toBe('Critical'); // 20% attendance
    });

    it('labels rows with a missing field value as Unknown', () => {
        const rows = [mockRow({ district_name: undefined })];
        const grouped = AggregationService.groupByField(rows, 'district_name');
        expect(grouped[0].name).toBe('Unknown');
    });
});

describe('AggregationService.computeMovement', () => {
    it('returns null when there is no previous summary', () => {
        const current = AggregationService.summarizeResponses([mockRow()]);
        expect(AggregationService.computeMovement(current, null)).toBeNull();
    });

    it('computes signed percentage-point deltas between two summaries', () => {
        const previous = AggregationService.summarizeResponses([
            mockRow({ conducted_pbl: 'No', derived_total_enrollment: 0, derived_total_attendance: 0 })
        ]);
        const current = AggregationService.summarizeResponses([
            mockRow({ conducted_pbl: 'Yes' })
        ]);
        const movement = AggregationService.computeMovement(current, previous);
        expect(movement.completionRateDelta).toBeGreaterThan(0);
    });
});

describe('AggregationService.rankPerformance', () => {
    it('returns top and bottom performers sorted by attendance rate', () => {
        const groups = [
            { name: 'Low', overallAttendanceRate: 0.2 },
            { name: 'High', overallAttendanceRate: 0.9 },
            { name: 'Mid', overallAttendanceRate: 0.5 }
        ];
        const { topPerformers, bottomPerformers } = AggregationService.rankPerformance(groups, 1);
        expect(topPerformers[0].name).toBe('High');
        expect(bottomPerformers[0].name).toBe('Low');
    });
});
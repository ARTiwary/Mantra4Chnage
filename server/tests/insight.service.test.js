import { describe, it, expect } from 'vitest';
import { InsightService } from '../src/services/insight.service.js';

const mockSummary = (overrides = {}) => ({
    totalSchools: 100,
    conductedCount: 80,
    evidenceCount: 60,
    totalEnrollment: 10000,
    totalAttendance: 12000,
    completionRate: 0.8,
    evidenceRate: 0.6,
    overallAttendanceRate: 0.6,
    riskDistribution: { 'On Track': 40, 'Behind': 30, 'At Risk': 20, 'Critical': 10 },
    ...overrides
});

describe('InsightService.buildMonthlyReviewSummary', () => {
    it('includes month and previousMonth labels in the output', () => {
        const result = InsightService.buildMonthlyReviewSummary({
            summary: mockSummary(),
            previousSummary: null,
            districtBreakdown: [],
            blockBreakdown: [],
            month: '2025-09',
            previousMonth: null
        });
        expect(result.month).toBe('2025-09');
        expect(result.movement).toBeNull();
    });

    it('computes movement deltas when a previous summary is provided', () => {
        const result = InsightService.buildMonthlyReviewSummary({
            summary: mockSummary({ completionRate: 0.85 }),
            previousSummary: mockSummary({ completionRate: 0.75 }),
            districtBreakdown: [],
            blockBreakdown: [],
            month: '2025-09',
            previousMonth: '2025-08'
        });
        expect(result.movement.completionRateDelta).toBeCloseTo(10, 1);
    });

    it('flags districts with Critical risk in the risks list', () => {
        const districtBreakdown = [
            { name: 'District X', calculatedRisk: 'Critical', overallAttendanceRate: 0.1, completionRate: 0.2, totalSchools: 5 },
            { name: 'District Y', calculatedRisk: 'On Track', overallAttendanceRate: 0.9, completionRate: 0.95, totalSchools: 5 }
        ];
        const result = InsightService.buildMonthlyReviewSummary({
            summary: mockSummary(),
            previousSummary: null,
            districtBreakdown,
            blockBreakdown: [],
            month: '2025-09',
            previousMonth: null
        });
        expect(result.risks.some(r => r.includes('District X'))).toBe(true);
    });

    it('ranks priority districts by ascending attendance rate, excluding On Track', () => {
        const districtBreakdown = [
            { name: 'High', calculatedRisk: 'On Track', overallAttendanceRate: 0.9, completionRate: 0.9, totalSchools: 5 },
            { name: 'Low', calculatedRisk: 'Critical', overallAttendanceRate: 0.1, completionRate: 0.1, totalSchools: 5 },
            { name: 'Mid', calculatedRisk: 'At Risk', overallAttendanceRate: 0.45, completionRate: 0.5, totalSchools: 5 }
        ];
        const result = InsightService.buildMonthlyReviewSummary({
            summary: mockSummary(),
            previousSummary: null,
            districtBreakdown,
            blockBreakdown: [],
            month: '2025-09',
            previousMonth: null
        });
        expect(result.priorityDistricts.map(d => d.name)).toEqual(['Low', 'Mid']);
    });

    it('always produces at least one achievement, risk, and discussion point', () => {
        const result = InsightService.buildMonthlyReviewSummary({
            summary: mockSummary({ completionRate: 0, evidenceRate: 0, overallAttendanceRate: 0, riskDistribution: { 'On Track': 0, 'Behind': 0, 'At Risk': 0, 'Critical': 100 } }),
            previousSummary: null,
            districtBreakdown: [],
            blockBreakdown: [],
            month: '2025-09',
            previousMonth: null
        });
        expect(result.achievements.length).toBeGreaterThan(0);
        expect(result.risks.length).toBeGreaterThan(0);
        expect(result.discussionPoints.length).toBeGreaterThan(0);
    });
});

describe('InsightService.buildGeographySummary', () => {
    it('marks needsFollowUp true for any non-On-Track risk', () => {
        const result = InsightService.buildGeographySummary({
            summary: mockSummary(),
            previousSummary: null,
            geographyName: 'District A',
            geographyType: 'district',
            month: '2025-09',
            previousMonth: null,
            calculatedRisk: 'At Risk'
        });
        expect(result.needsFollowUp).toBe(true);
    });

    it('marks needsFollowUp false for On Track', () => {
        const result = InsightService.buildGeographySummary({
            summary: mockSummary(),
            previousSummary: null,
            geographyName: 'District A',
            geographyType: 'district',
            month: '2025-09',
            previousMonth: null,
            calculatedRisk: 'On Track'
        });
        expect(result.needsFollowUp).toBe(false);
    });
});
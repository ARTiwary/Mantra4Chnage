import { describe, it, expect } from 'vitest';
import { ActionService } from '../src/services/action.service.js';

const mockInsight = (overrides = {}) => ({
    month: '2025-09',
    previousMonth: '2025-08',
    headline: { totalSchools: 100, conductedCount: 80, completionRate: 0.8, evidenceRate: 0.6, overallAttendanceRate: 0.6, riskDistribution: {} },
    movement: { completionRateDelta: 1, evidenceRateDelta: 1, attendanceRateDelta: 1 },
    achievements: [],
    risks: [],
    priorityDistricts: [],
    priorityBlocks: [],
    discussionPoints: [],
    ...overrides
});

describe('ActionService.generateRecommendedActions', () => {
    it('returns at most 5 actions', () => {
        const insight = mockInsight({
            priorityDistricts: [
                { name: 'D1', risk: 'Critical', attendanceRate: 0.1, completionRate: 0.1, totalSchools: 5 },
                { name: 'D2', risk: 'Critical', attendanceRate: 0.15, completionRate: 0.15, totalSchools: 5 },
                { name: 'D3', risk: 'At Risk', attendanceRate: 0.4, completionRate: 0.4, totalSchools: 5 }
            ],
            priorityBlocks: [
                { name: 'B1', risk: 'Critical', attendanceRate: 0.1, completionRate: 0.1, totalSchools: 5 },
                { name: 'B2', risk: 'At Risk', attendanceRate: 0.45, completionRate: 0.45, totalSchools: 5 }
            ]
        });
        const actions = ActionService.generateRecommendedActions(insight);
        expect(actions.length).toBeLessThanOrEqual(5);
    });

    it('every action includes owner, priority, dueDate, and status', () => {
        const insight = mockInsight({
            priorityDistricts: [{ name: 'District X', risk: 'Critical', attendanceRate: 0.1, completionRate: 0.1, totalSchools: 5 }]
        });
        const actions = ActionService.generateRecommendedActions(insight);
        expect(actions.length).toBeGreaterThan(0);
        actions.forEach(a => {
            expect(a.owner).toBeTruthy();
            expect(a.priority).toBeTruthy();
            expect(a.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(a.status).toBe('Not Started');
        });
    });

    it('assigns High priority to Critical districts, Medium to others', () => {
        const insight = mockInsight({
            priorityDistricts: [
                { name: 'Critical District', risk: 'Critical', attendanceRate: 0.1, completionRate: 0.1, totalSchools: 5 },
                { name: 'Behind District', risk: 'Behind', attendanceRate: 0.65, completionRate: 0.65, totalSchools: 5 }
            ]
        });
        const actions = ActionService.generateRecommendedActions(insight);
        const critical = actions.find(a => a.linkedGeography.name === 'Critical District');
        const behind = actions.find(a => a.linkedGeography.name === 'Behind District');
        expect(critical.priority).toBe('High');
        expect(behind.priority).toBe('Medium');
    });

    it('generates an evidence-gap action when evidence rate is below 60%', () => {
        const insight = mockInsight({ headline: { ...mockInsight().headline, evidenceRate: 0.45 } });
        const actions = ActionService.generateRecommendedActions(insight);
        expect(actions.some(a => a.id === 'action-evidence-gap')).toBe(true);
    });

    it('does not generate an evidence-gap action when evidence rate is healthy', () => {
        const insight = mockInsight({ headline: { ...mockInsight().headline, evidenceRate: 0.85 } });
        const actions = ActionService.generateRecommendedActions(insight);
        expect(actions.some(a => a.id === 'action-evidence-gap')).toBe(false);
    });

    it('generates an attendance-decline action when attendance dropped more than 2pp', () => {
        const insight = mockInsight({ movement: { completionRateDelta: 0, evidenceRateDelta: 0, attendanceRateDelta: -5 } });
        const actions = ActionService.generateRecommendedActions(insight);
        expect(actions.some(a => a.id === 'action-attendance-decline')).toBe(true);
    });

    it('produces due dates after the reporting month', () => {
        const insight = mockInsight({
            priorityDistricts: [{ name: 'District X', risk: 'Critical', attendanceRate: 0.1, completionRate: 0.1, totalSchools: 5 }]
        });
        const actions = ActionService.generateRecommendedActions(insight);
        actions.forEach(a => {
            expect(new Date(a.dueDate).getTime()).toBeGreaterThan(new Date('2025-09-28').getTime());
        });
    });
});
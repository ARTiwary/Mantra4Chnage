import { describe, it, expect } from 'vitest';
import { RiskService } from '../src/services/risk.service.js';

describe('RiskService.calculateRiskStatus', () => {
    it('returns Critical when PBL was not conducted, regardless of attendance rate', () => {
        expect(RiskService.calculateRiskStatus(false, 0.95)).toBe('Critical');
        expect(RiskService.calculateRiskStatus(false, 0)).toBe('Critical');
    });

    it('returns On Track at exactly 75% and above', () => {
        expect(RiskService.calculateRiskStatus(true, 0.75)).toBe('On Track');
        expect(RiskService.calculateRiskStatus(true, 1.0)).toBe('On Track');
        expect(RiskService.calculateRiskStatus(true, 0.7500001)).toBe('On Track');
    });

    it('returns Behind between 60% (inclusive) and 75% (exclusive)', () => {
        expect(RiskService.calculateRiskStatus(true, 0.60)).toBe('Behind');
        expect(RiskService.calculateRiskStatus(true, 0.7499)).toBe('Behind');
        expect(RiskService.calculateRiskStatus(true, 0.65)).toBe('Behind');
    });

    it('returns At Risk between 35% (inclusive) and 60% (exclusive)', () => {
        expect(RiskService.calculateRiskStatus(true, 0.35)).toBe('At Risk');
        expect(RiskService.calculateRiskStatus(true, 0.5999)).toBe('At Risk');
        expect(RiskService.calculateRiskStatus(true, 0.45)).toBe('At Risk');
    });

    it('returns Critical below 35%', () => {
        expect(RiskService.calculateRiskStatus(true, 0.3499)).toBe('Critical');
        expect(RiskService.calculateRiskStatus(true, 0)).toBe('Critical');
        expect(RiskService.calculateRiskStatus(true, 0.01)).toBe('Critical');
    });

    it('handles boundary precision consistently at each threshold', () => {
        // Guards against floating point drift at exact boundaries
        expect(RiskService.calculateRiskStatus(true, 0.7499999999)).toBe('Behind');
        expect(RiskService.calculateRiskStatus(true, 0.5999999999)).toBe('At Risk');
        expect(RiskService.calculateRiskStatus(true, 0.3499999999)).toBe('Critical');
    });
});

describe('RiskService.getRiskColor', () => {
    it('returns a distinct hex color for each known status', () => {
        const statuses = ['On Track', 'Behind', 'At Risk', 'Critical'];
        const colors = statuses.map(s => RiskService.getRiskColor(s));
        expect(new Set(colors).size).toBe(4); // all distinct
        colors.forEach(c => expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/));
    });

    it('returns a fallback color for an unknown status', () => {
        expect(RiskService.getRiskColor('Unknown Status')).toBe('#6B7280');
    });
});

describe('RiskService.needsFollowUp', () => {
    it('is false only for On Track', () => {
        expect(RiskService.needsFollowUp('On Track')).toBe(false);
        expect(RiskService.needsFollowUp('Behind')).toBe(true);
        expect(RiskService.needsFollowUp('At Risk')).toBe(true);
        expect(RiskService.needsFollowUp('Critical')).toBe(true);
    });
});
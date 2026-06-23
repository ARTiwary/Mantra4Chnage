import { Router } from 'express';
import { SchoolResponseRepository } from '../repositories/schoolResponse.repo.js';
import { AggregationService } from '../services/aggregation.service.js';
import { RiskService } from '../services/risk.services.js';
import { InsightService } from '../services/insight.service.js';
import { GroqService } from '../services/groq.services.js';

const router = Router();

const FIELD_BY_TYPE = {
    district: 'district_name',
    block: 'block_details'
};

router.get('/:type/:name/summary', (req, res) => {
    try {
        const { type, name } = req.params;
        const { month } = req.query;
        const field = FIELD_BY_TYPE[type];

        if (!field) {
            return res.status(400).json({ success: false, error: "type must be 'district' or 'block'" });
        }
        if (!month) {
            return res.status(400).json({ success: false, error: 'month query parameter is required' });
        }

        const filterKey = type === 'district' ? 'district' : 'block';
        const rows = SchoolResponseRepository.getFilteredResponses({ month, [filterKey]: name });
        const summary = AggregationService.summarizeResponses(rows);
        const calculatedRisk = RiskService.calculateRiskStatus(summary.conductedCount > 0, summary.overallAttendanceRate);

        let previousSummary = null;
        const previousMonth = SchoolResponseRepository.getPreviousMonth(month);
        if (previousMonth) {
            const prevRows = SchoolResponseRepository.getFilteredResponses({ month: previousMonth, [filterKey]: name });
            previousSummary = AggregationService.summarizeResponses(prevRows);
        }

        const insight = InsightService.buildGeographySummary({
            summary,
            previousSummary,
            geographyName: name,
            geographyType: type,
            month,
            previousMonth,
            calculatedRisk
        });

        res.json({ success: true, data: insight });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/narrative', async (req, res) => {
    try {
        const { insight } = req.body;
        if (!insight) {
            return res.status(400).json({ success: false, error: 'Missing insight data' });
        }
        const result = await GroqService.generateGeographyNarrative(insight);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
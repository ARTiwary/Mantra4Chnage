import { Router } from 'express';
import { SchoolResponseRepository } from '../repositories/schoolResponse.repo.js';
import { AggregationService } from '../services/aggregation.service.js';
import { InsightService } from '../services/insight.service.js';
import { ActionService } from '../services/action.service.js';
import { GroqService } from '../services/groq.services.js';

const router = Router();

function buildInsightForFilters(query) {
    const rows = SchoolResponseRepository.getFilteredResponses(query);
    const summary = AggregationService.summarizeResponses(rows);

    const districtBreakdown = AggregationService.groupByField(rows, 'district_name');
    const blockBreakdown = AggregationService.groupByField(rows, 'block_details');

    let previousSummary = null;
    let previousMonth = null;
    if (query.month) {
        previousMonth = SchoolResponseRepository.getPreviousMonth(query.month);
        if (previousMonth) {
            const prevRows = SchoolResponseRepository.getFilteredResponses({ ...query, month: previousMonth });
            previousSummary = AggregationService.summarizeResponses(prevRows);
        }
    }

    return InsightService.buildMonthlyReviewSummary({
        summary,
        previousSummary,
        districtBreakdown,
        blockBreakdown,
        month: query.month,
        previousMonth
    });
}

router.get('/summary', (req, res) => {
    try {
        if (!req.query.month) {
            return res.status(400).json({ success: false, error: 'month query parameter is required' });
        }
        const insight = buildInsightForFilters(req.query);
        res.json({ success: true, data: insight });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/summary/narrative', async (req, res) => {
    try {
        const { insight } = req.body;
        if (!insight) {
            return res.status(400).json({ success: false, error: 'Missing insight data' });
        }
        const result = await GroqService.generateReviewSummaryNarrative(insight);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/actions', (req, res) => {
    try {
        if (!req.query.month) {
            return res.status(400).json({ success: false, error: 'month query parameter is required' });
        }
        const insight = buildInsightForFilters(req.query);
        const actions = ActionService.generateRecommendedActions(insight);
        res.json({ success: true, data: actions });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
import { Router } from 'express';
import { SchoolResponseRepository } from '../repositories/schoolResponse.repo.js';
import { AggregationService } from '../services/aggregation.service.js';

const router = Router();

/**
 * GET /api/dashboard/filters
 * Distinct values for populating filter dropdowns.
 */
router.get('/filters', (req, res) => {
    try {
        const filters = SchoolResponseRepository.getDistinctFilters();
        res.json({ success: true, data: filters });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/dashboard/summary
 * Headline KPIs for the current filter selection, plus month-over-month
 * movement vs the previous reporting month (when one exists).
 */
router.get('/summary', (req, res) => {
    try {
        const rows = SchoolResponseRepository.getFilteredResponses(req.query);
        const summary = AggregationService.summarizeResponses(rows);

        let movement = null;
        if (req.query.month) {
            const prevMonth = SchoolResponseRepository.getPreviousMonth(req.query.month);
            if (prevMonth) {
                const prevRows = SchoolResponseRepository.getFilteredResponses({ ...req.query, month: prevMonth });
                const prevSummary = AggregationService.summarizeResponses(prevRows);
                movement = AggregationService.computeMovement(summary, prevSummary);
                movement.previousMonth = prevMonth;
            }
        }

        res.json({ success: true, data: { ...summary, movement } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/dashboard/breakdown/district
 * GET /api/dashboard/breakdown/block
 * GET /api/dashboard/breakdown/grade   (grouped by classes_covered text)
 * GET /api/dashboard/breakdown/subject
 */
router.get('/breakdown/district', (req, res) => {
    try {
        const rows = SchoolResponseRepository.getFilteredResponses(req.query);
        const breakdown = AggregationService.groupByField(rows, 'district_name');
        res.json({ success: true, data: breakdown });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/breakdown/block', (req, res) => {
    try {
        const rows = SchoolResponseRepository.getFilteredResponses(req.query);
        const breakdown = AggregationService.groupByField(rows, 'block_details');
        res.json({ success: true, data: breakdown });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/breakdown/subject', (req, res) => {
    try {
        const rows = SchoolResponseRepository.getFilteredResponses(req.query);
        const breakdown = AggregationService.groupByField(rows, 'subject_taught');
        res.json({ success: true, data: breakdown });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/dashboard/priorities
 * Top and bottom performing districts/blocks, for "who needs follow-up
 * first" views.
 */
router.get('/priorities', (req, res) => {
    try {
        const rows = SchoolResponseRepository.getFilteredResponses(req.query);
        const districtBreakdown = AggregationService.groupByField(rows, 'district_name');
        const blockBreakdown = AggregationService.groupByField(rows, 'block_details');

        res.json({
            success: true,
            data: {
                districts: AggregationService.rankPerformance(districtBreakdown, 5),
                blocks: AggregationService.rankPerformance(blockBreakdown, 5)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
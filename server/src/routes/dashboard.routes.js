import { Router } from 'express';
import { SchoolResponseRepository } from '../repositories/schoolResponse.repo.js';
import { AggregationService } from '../services/aggregation.service.js';

const router = Router();


router.get('/filters', (req, res) => {
    try {
        const filters = SchoolResponseRepository.getDistinctFilters();
        res.json({ success: true, data: filters });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


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
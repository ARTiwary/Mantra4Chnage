import { Router } from 'express';
import { SchoolResponseRepository } from '../repositories/schoolResponse.repo.js';
import { AggregationService } from '../services/aggregation.service.js';

const router = Router();

router.get('/summary', (req, res) => {
    try {
        const rows = SchoolResponseRepository.getFilteredResponses(req.query);
        const summary = AggregationService.summarizeResponses(rows);
        res.json({ success: true, data: summary });
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

router.get('/filters', (req, res) => {
    try {
        const filters = SchoolResponseRepository.getDistinctFilters();
        res.json({ success: true, data: filters });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
import { Router } from 'express';
import { GrantRepository } from '../repositories/grant.repo.js';
import { GroqService } from '../services/groq.services.js';

const router = Router();

/**
 * GET /api/grants/list
 * All distinct grants available for selection.
 */
router.get('/list', (req, res) => {
    try {
        const grants = GrantRepository.getAllProfiles();
        const months = GrantRepository.getDistinctMonths();
        res.json({ success: true, data: { grants, months } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/grants/details/:grantId?month=2025-09
 * Fact panel: performance metrics, finance rows, and linked evidence/media
 * for the selected grant + month.
 */
router.get('/details/:grantId', (req, res) => {
    try {
        const { grantId } = req.params;
        const { month } = req.query;

        const performance = GrantRepository.getPerformanceById(grantId, month);
        const finances = GrantRepository.getFinancesById(grantId, month);
        const media = GrantRepository.getMediaAssets(grantId, month);

        res.json({
            success: true,
            data: {
                performance: performance[0] || null,
                finances,
                media
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/grants/narrative
 * Body: { performance: {...}, finances: [...] }
 * Generates a report-ready narrative section using only the supplied facts.
 * Falls back to a deterministic summary if AI is disabled or fails — this
 * endpoint never errors out just because the AI call failed.
 */
router.post('/narrative', async (req, res) => {
    try {
        const { performance, finances } = req.body;
        if (!performance) {
            return res.status(400).json({ success: false, error: 'Missing performance data' });
        }

        const result = await GroqService.generateGrantNarrative({
            performanceData: [performance],
            financeData: finances || []
        });

        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/grants/ai-status
 * Lets the frontend show whether AI generation is currently enabled,
 * without needing to attempt a generation first.
 */
router.get('/ai-status', (req, res) => {
    res.json({ success: true, data: { aiEnabled: GroqService.isEnabled() } });
});

export default router;
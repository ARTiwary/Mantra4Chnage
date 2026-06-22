import { Router } from 'express';
import { GrantRepository } from '../repositories/grant.repo.js';
import { GroqService } from '../services/groq.service.js';

const router = Router();

router.get('/list', (req, res) => {
    try {
        const grants = GrantRepository.getAllProfiles();
        res.json({ success: true, data: grants });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/details/:grantId', async (req, res) => {
    try {
        const { grantId } = req.params;
        const { month } = req.query; // optional month filter

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

router.post('/narrative', async (req, res) => {
    try {
        const { performance, finances } = req.body;
        if (!performance) {
            return res.status(400).json({ success: false, error: 'Missing performance metadata' });
        }
        
        const text = await GroqService.generateGrantNarrative({
            performanceData: [performance],
            financeData: finances || []
        });

        res.json({ success: true, narrative: text });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
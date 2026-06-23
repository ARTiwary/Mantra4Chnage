import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dashboardRoutes from './routes/dashboard.routes.js';
import grantRoutes from './routes/grants.routes.js';
import reviewRoutes from './routes/review.routes.js';
import geographyRoutes from './routes/geography.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// Serve grant evidence images as static files.
app.use('/images', express.static(path.join(__dirname, '../../data/grants/images')));

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/grants', grantRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/geography', geographyRoutes);

app.get('/api/health', (req, res) => {
    res.json({ online: true, timestamp: new Date().toISOString() });
});

// Centralized error handler — catches anything that slips past route-level
// try/catch blocks instead of leaking a stack trace to the client.
app.use((err, req, res, next) => {
    console.error('[Unhandled error]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;
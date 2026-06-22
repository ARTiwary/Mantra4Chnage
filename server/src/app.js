import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dashboardRoutes from './routes/dashboard.routes.js';
import grantRoutes from './routes/grants.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// Expose the raw data image uploads folder as static file assets
app.use('/images', express.static(path.join(__dirname, '../../data/grants/images')));

// API Endpoint Wireframes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/grants', grantRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ online: true, timestamp: new Date() });
});

export default app;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import patientRoutes from './routes/patients.js';
import escalationRoutes from './routes/escalations.js';
import prescriptionRoutes from './routes/prescriptions.js';
import refillRoutes from './routes/refills.js';
import logRoutes from './routes/logs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MEDITRACK API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/logs', logRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../client/dist'), { index: false }));

app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Force Database Sync on Startup (Ensures Railway creates tables)
try {
    console.log('🔄 Syncing database schema to ensure tables exist...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Database schema is up to date.');
} catch (error) {
    console.error('❌ Failed to sync database schema:', error);
}

app.listen(PORT, () => {
    console.log(`✅ MEDITRACK server running at http://localhost:${PORT}`);
});

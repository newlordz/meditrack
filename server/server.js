import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

app.listen(PORT, () => {
    console.log(`✅ MEDITRACK server running at http://localhost:${PORT}`);
});

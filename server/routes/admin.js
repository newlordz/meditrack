import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/admin/clear-logs
router.post('/clear-logs', async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.medicationLog.deleteMany(),
            prisma.passwordResetRequest.deleteMany(),
            prisma.escalation.deleteMany(),
            prisma.refillRequest.deleteMany()
        ]);
        res.json({ message: 'All system logs, password resets, refill requests, and escalations cleared successfully. The system starts fresh!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to clear system logs' });
    }
});

export default router;

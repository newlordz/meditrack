import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        const logs = await prisma.medicationLog.findMany({
            include: {
                patient: { include: { user: { select: { firstName: true, lastName: true } } } },
                schedule: { include: { prescription: true } },
            },
            orderBy: { loggedAt: 'desc' }
        });

        res.json(logs.map(l => ({
            id: l.id,
            patient: `${l.patient.user.firstName} ${l.patient.user.lastName}`,
            pid: l.patient.pid,
            drug: l.schedule.prescription.drugName,
            dosage: l.schedule.prescription.dosage,
            action: l.action,
            loggedAt: l.loggedAt,
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

export default router;

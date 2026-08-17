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

// POST /api/logs - Create medication log
router.post('/', async (req, res) => {
    try {
        const { patientId, scheduleId, action } = req.body;
        if (!patientId || !action) {
            return res.status(400).json({ error: 'patientId and action are required' });
        }

        const log = await prisma.medicationLog.create({
            data: {
                patientId,
                scheduleId: scheduleId || undefined,
                action: action.toUpperCase()
            }
        });

        res.status(201).json(log);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to record log' });
    }
});

export default router;

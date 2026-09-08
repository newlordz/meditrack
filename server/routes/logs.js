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
            patient: l.patient?.user ? `${l.patient.user.firstName} ${l.patient.user.lastName}` : 'Patient',
            pid: l.patient?.pid || 'N/A',
            drug: l.schedule?.prescription?.drugName || 'Prescribed Medication',
            dosage: l.schedule?.prescription?.dosage || 'Standard Dose',
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
        let { patientId, scheduleId, prescriptionId, action } = req.body;
        if (!patientId || !action) {
            return res.status(400).json({ error: 'patientId and action are required' });
        }

        // If scheduleId is not provided, locate or create a schedule for the patient
        if (!scheduleId) {
            let schedule = await prisma.schedule.findFirst({
                where: { patientId },
                include: { prescription: true }
            });

            if (!schedule) {
                const rx = prescriptionId 
                    ? await prisma.prescription.findUnique({ where: { id: prescriptionId } })
                    : await prisma.prescription.findFirst({ where: { patientId, status: 'ACTIVE' } });

                if (rx) {
                    schedule = await prisma.schedule.create({
                        data: {
                            patientId,
                            prescriptionId: rx.id,
                            scheduledTime: '08:00 AM'
                        }
                    });
                }
            }

            if (schedule) {
                scheduleId = schedule.id;
            }
        }

        if (!scheduleId) {
            return res.status(400).json({ error: 'No active schedule available to record medication log.' });
        }

        const log = await prisma.medicationLog.create({
            data: {
                patientId,
                scheduleId,
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

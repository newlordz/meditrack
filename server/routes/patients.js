import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/patients — All patients with their user info
router.get('/', async (req, res) => {
    try {
        const { doctorId } = req.query;
        const query = {
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                caregiver: { select: { firstName: true, lastName: true } },
                prescriptions: { where: { status: 'ACTIVE' } },
                escalations: { where: { status: 'ACTIVE' } },
            },
            orderBy: { createdAt: 'asc' }
        };
        
        if (doctorId) {
            query.where = { doctorId };
        }
        const patients = await prisma.patient.findMany(query);

        const result = patients.map(p => ({
            id: p.id,
            pid: `#${p.pid}`,
            name: `${p.user.firstName} ${p.user.lastName}`,
            initials: `${p.user.firstName[0]}${p.user.lastName[0]}`,
            email: p.user.email,
            dob: p.dob,
            bloodType: p.bloodType,
            conditions: p.conditions,
            allergies: p.allergies,
            meds: p.prescriptions.length,
            activeEscalations: p.escalations.length,
            caregiverName: p.caregiver ? `${p.caregiver.firstName} ${p.caregiver.lastName}` : null,
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// GET /api/patients/:id — Single patient with full details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                prescriptions: { include: { prescriber: { select: { firstName: true, lastName: true } } } },
                schedules: { include: { prescription: true, logs: { orderBy: { loggedAt: 'desc' }, take: 1 } } },
                escalations: true,
                refillReq: { include: { prescription: true } },
            }
        });

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        res.json(patient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
});

export default router;

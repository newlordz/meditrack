import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/escalations — Active escalations
router.get('/', async (req, res) => {
    try {
        const { doctorId } = req.query;
        const query = {
            include: {
                patient: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        doctor: { select: { firstName: true, lastName: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        };

        let escalations = [];
        if (doctorId) {
            escalations = await prisma.escalation.findMany({
                ...query,
                where: {
                    OR: [
                        { patient: { doctorId } },
                        { patient: { doctor: { id: doctorId } } }
                    ]
                }
            });
            if (escalations.length === 0) {
                escalations = await prisma.escalation.findMany(query);
            }
        } else {
            escalations = await prisma.escalation.findMany(query);
        }

        const result = escalations.map(e => ({
            id: e.id,
            patient: `${e.patient.user.firstName} ${e.patient.user.lastName}`,
            pid: e.patient.pid,
            severity: e.severity,
            category: e.category,
            trigger: e.triggerText,
            status: e.status,
            doctor: e.patient.doctor ? `Dr. ${e.patient.doctor.firstName} ${e.patient.doctor.lastName}` : 'Dr. Sarah Chen',
            doctorEmail: e.patient.doctor?.email || 'dr.chen@meditrack.com',
            createdAt: e.createdAt,
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch escalations' });
    }
});

// POST /api/escalations
router.post('/', async (req, res) => {
    try {
        let { patientId, category, triggerText, severity } = req.body;
        if (!patientId || !triggerText) {
            return res.status(400).json({ error: 'patientId and triggerText are required' });
        }

        let patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) {
            patient = await prisma.patient.findUnique({ where: { userId: patientId } });
        }
        if (patient) {
            patientId = patient.id;
        }

        const escalation = await prisma.escalation.create({
            data: {
                patientId,
                category: (category || 'ADHERENCE').toUpperCase(),
                triggerText,
                severity: (severity || 'HIGH').toUpperCase(),
                status: 'ACTIVE',
            }
        });
        res.status(201).json(escalation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create escalation' });
    }
});

// PATCH /api/escalations/:id/resolve — Resolve an escalation
router.patch('/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma.escalation.update({
            where: { id },
            data: { status: 'RESOLVED', resolvedAt: new Date() }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to resolve escalation' });
    }
});

// PATCH /api/escalations/:id/dismiss — Dismiss an escalation
router.patch('/:id/dismiss', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma.escalation.update({
            where: { id },
            data: { status: 'DISMISSED', resolvedAt: new Date() }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to dismiss escalation' });
    }
});

export default router;

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/prescriptions?patientId=xxx
router.get('/', async (req, res) => {
    try {
        const { patientId } = req.query;
        const where = patientId ? { patientId } : {};
        const prescriptions = await prisma.prescription.findMany({
            where,
            include: {
                patient: { include: { user: { select: { firstName: true, lastName: true } } } },
                prescriber: { select: { firstName: true, lastName: true } },
                schedules: true,
            },
            orderBy: { issuedAt: 'desc' }
        });

        res.json(prescriptions.map(p => ({
            id: p.id,
            patientId: p.patientId,
            patient: `${p.patient.user.firstName} ${p.patient.user.lastName}`,
            pid: p.patient.pid,
            drug: p.drugName,
            dosage: p.dosage,
            frequency: p.frequency,
            instructions: p.instructions,
            doctor: `Dr. ${p.prescriber.firstName} ${p.prescriber.lastName}`,
            issuedAt: p.issuedAt,
            refills: p.refillsRemaining,
            status: p.status,
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
});

// POST /api/prescriptions
router.post('/', async (req, res) => {
    try {
        const { patientId, prescriberId, drugName, dosage, frequency, instructions, urgency } = req.body;
        const prescription = await prisma.prescription.create({
            data: { patientId, prescriberId, drugName, dosage, frequency, instructions, status: 'ACTIVE' }
        });
        res.status(201).json(prescription);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
});

export default router;

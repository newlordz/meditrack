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
        let { patientId, prescriberId, drugName, dosage, frequency, instructions, urgency } = req.body;

        // Resolve patient if patientId was a userId
        let patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) {
            patient = await prisma.patient.findUnique({ where: { userId: patientId } });
        }
        if (patient) {
            patientId = patient.id;
        }

        const prescription = await prisma.prescription.create({
            data: { patientId, prescriberId, drugName, dosage, frequency, instructions, status: 'ACTIVE' }
        });

        // Automatically generate scheduled doses for this prescription
        const freqLower = (frequency || '').toLowerCase();
        let defaultTimes = ['08:00 AM'];
        if (freqLower.includes('twice') || freqLower.includes('2x') || freqLower.includes('bid') || freqLower.includes('12h')) {
            defaultTimes = ['08:00 AM', '08:00 PM'];
        } else if (freqLower.includes('three') || freqLower.includes('3x') || freqLower.includes('tid') || freqLower.includes('8h')) {
            defaultTimes = ['08:00 AM', '02:00 PM', '08:00 PM'];
        } else if (freqLower.includes('four') || freqLower.includes('4x') || freqLower.includes('qid') || freqLower.includes('6h')) {
            defaultTimes = ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];
        } else if (freqLower.includes('night') || freqLower.includes('bedtime') || freqLower.includes('pm')) {
            defaultTimes = ['09:00 PM'];
        }

        for (const scheduledTime of defaultTimes) {
            await prisma.schedule.create({
                data: {
                    prescriptionId: prescription.id,
                    patientId: patientId,
                    scheduledTime: scheduledTime
                }
            });
        }

        // Automatically create a doctor prescription dispense request for the pharmacy
        await prisma.refillRequest.create({
            data: {
                patientId,
                prescriptionId: prescription.id,
                pharmacyStatus: 'APPROVED'
            }
        });

        res.status(201).json(prescription);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
});

// PATCH /api/prescriptions/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, refillsRemaining } = req.body;
        const data = {};
        if (status) data.status = status.toUpperCase();
        if (refillsRemaining !== undefined) data.refillsRemaining = Number(refillsRemaining);

        const updated = await prisma.prescription.update({
            where: { id },
            data
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update prescription' });
    }
});

export default router;

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/refills
router.get('/', async (req, res) => {
    try {
        const { doctorId } = req.query;
        const query = {
            include: {
                patient: { include: { user: { select: { firstName: true, lastName: true } } } },
                prescription: true,
            },
            orderBy: { requestedAt: 'desc' }
        };

        let refills = [];
        if (doctorId) {
            refills = await prisma.refillRequest.findMany({
                ...query,
                where: {
                    OR: [
                        { patient: { doctorId } },
                        { patient: { doctor: { id: doctorId } } }
                    ]
                }
            });
            if (refills.length === 0) {
                refills = await prisma.refillRequest.findMany(query);
            }
        } else {
            refills = await prisma.refillRequest.findMany(query);
        }

        res.json(refills.map(r => ({
            id: r.id,
            name: `${r.patient.user.firstName} ${r.patient.user.lastName}`,
            pid: r.patient.pid,
            medication: r.prescription.drugName,
            dosage: r.prescription.dosage,
            status: r.pharmacyStatus.toLowerCase(),
            requestedAt: r.requestedAt,
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch refill requests' });
    }
});

// POST /api/refills
router.post('/', async (req, res) => {
    try {
        let { patientId, prescriptionId } = req.body;
        if (!patientId || !prescriptionId) {
            return res.status(400).json({ error: 'patientId and prescriptionId are required' });
        }

        let patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) {
            patient = await prisma.patient.findUnique({ where: { userId: patientId } });
        }
        if (patient) {
            patientId = patient.id;
        }

        const refill = await prisma.refillRequest.create({
            data: {
                patientId,
                prescriptionId,
                pharmacyStatus: 'PENDING'
            }
        });
        res.status(201).json(refill);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create refill request' });
    }
});

// PATCH /api/refills/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = await prisma.refillRequest.update({
            where: { id },
            data: { pharmacyStatus: status.toUpperCase() }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update refill status' });
    }
});

export default router;

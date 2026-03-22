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

        if (doctorId) {
            query.where = { patient: { doctorId } };
        }

        const refills = await prisma.refillRequest.findMany(query);

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

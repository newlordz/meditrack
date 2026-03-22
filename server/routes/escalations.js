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
                    include: { user: { select: { firstName: true, lastName: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        };

        if (doctorId) {
            query.where = { patient: { doctorId } };
        }

        const escalations = await prisma.escalation.findMany(query);

        const result = escalations.map(e => ({
            id: e.id,
            patient: `${e.patient.user.firstName} ${e.patient.user.lastName}`,
            pid: e.patient.pid,
            severity: e.severity,
            category: e.category,
            trigger: e.triggerText,
            status: e.status,
            createdAt: e.createdAt,
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch escalations' });
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

export default router;

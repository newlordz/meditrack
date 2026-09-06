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
                patient: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        doctor: { select: { firstName: true, lastName: true } }
                    }
                },
                prescription: {
                    include: {
                        prescriber: { select: { firstName: true, lastName: true } }
                    }
                },
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
            patientId: r.patientId,
            prescriptionId: r.prescriptionId,
            name: `${r.patient.user.firstName} ${r.patient.user.lastName}`,
            pid: r.patient.pid,
            medication: r.prescription.drugName,
            dosage: r.prescription.dosage,
            frequency: r.prescription.frequency,
            instructions: r.prescription.instructions || 'Take as directed by doctor',
            doctor: r.prescription?.prescriber
                ? `Dr. ${r.prescription.prescriber.firstName} ${r.prescription.prescriber.lastName}`
                : (r.patient?.doctor ? `Dr. ${r.patient.doctor.firstName} ${r.patient.doctor.lastName}` : 'Clinic Doctor'),
            status: r.pharmacyStatus.toLowerCase(),
            pharmacyStatus: r.pharmacyStatus,
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
        let { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        let normalizedStatus = status.toUpperCase();
        if (normalizedStatus === 'COMPLETE' || normalizedStatus === 'COMPLETED') {
            normalizedStatus = 'DISPENSED';
        } else if (normalizedStatus === 'DENIED') {
            normalizedStatus = 'REJECTED';
        }

        const updated = await prisma.refillRequest.update({
            where: { id },
            data: { pharmacyStatus: normalizedStatus },
            include: {
                patient: { include: { user: true } },
                prescription: { include: { schedules: true } }
            }
        });

        // If dispensed by pharmacist, deduct refills remaining and record an audit MedicationLog
        if (normalizedStatus === 'DISPENSED') {
            if (updated.prescription && updated.prescription.refillsRemaining > 0) {
                await prisma.prescription.update({
                    where: { id: updated.prescriptionId },
                    data: { refillsRemaining: updated.prescription.refillsRemaining - 1 }
                }).catch(err => console.error('Error updating refills remaining:', err));
            }

            const schedule = updated.prescription?.schedules?.[0];
            if (schedule) {
                await prisma.medicationLog.create({
                    data: {
                        patientId: updated.patientId,
                        scheduleId: schedule.id,
                        action: 'TAKEN',
                        loggedAt: new Date()
                    }
                }).catch(err => console.error('Error creating medication log for dispense:', err));
            }
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update refill status' });
    }
});

export default router;

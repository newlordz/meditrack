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
                doctor: { select: { id: true, firstName: true, lastName: true, email: true } },
                prescriptions: { where: { status: 'ACTIVE' } },
                escalations: { where: { status: 'ACTIVE' } },
                logs: true,
            },
            orderBy: { createdAt: 'asc' }
        };
        
        let patients = [];
        if (doctorId) {
            patients = await prisma.patient.findMany({
                ...query,
                where: {
                    OR: [
                        { doctorId },
                        { doctor: { id: doctorId } }
                    ]
                }
            });
            if (patients.length === 0) {
                patients = await prisma.patient.findMany(query);
            }
        } else {
            patients = await prisma.patient.findMany(query);
        }

        const result = patients.map(p => {
            const totalLogs = p.logs ? p.logs.length : 0;
            const takenLogs = p.logs ? p.logs.filter(l => l.action === 'TAKEN').length : 0;
            const computedAdherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : (p.escalations.length > 0 ? 45 : 90);

            return {
                id: p.id,
                pid: p.pid.startsWith('#') ? p.pid : `#${p.pid}`,
                name: `${p.user.firstName} ${p.user.lastName}`,
                initials: `${p.user.firstName[0]}${p.user.lastName[0]}`,
                email: p.user.email,
                doctorId: p.doctorId,
                doctor: p.doctor,
                doctorName: p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : null,
                dob: p.dob,
                bloodType: p.bloodType,
                conditions: p.conditions,
                allergies: p.allergies,
                meds: p.prescriptions.length,
                adherence: computedAdherence,
                activeEscalations: p.escalations.length,
                caregiverName: p.caregiver ? `${p.caregiver.firstName} ${p.caregiver.lastName}` : null,
            };
        });

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
        const includeQuery = {
            user: { select: { firstName: true, lastName: true, email: true } },
            doctor: { select: { id: true, firstName: true, lastName: true, email: true } },
            prescriptions: { include: { prescriber: { select: { firstName: true, lastName: true } } } },
            schedules: { include: { prescription: true, logs: { orderBy: { loggedAt: 'desc' }, take: 1 } } },
            escalations: true,
            refillReq: { include: { prescription: true } },
        };

        let patient = await prisma.patient.findUnique({
            where: { id },
            include: includeQuery
        });

        if (!patient) {
            patient = await prisma.patient.findUnique({
                where: { userId: id },
                include: includeQuery
            });
        }

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        res.json(patient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
});

// DELETE /api/patients/:id — Single patient with full details
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let patient = await prisma.patient.findUnique({ where: { id } });
        if (!patient) {
            patient = await prisma.patient.findUnique({ where: { userId: id } });
        }
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const targetId = patient.id;

        // Prisma doesn't have onDelete: Cascade configured in the schema,
        // so we delete related records in a transaction manually.
        await prisma.$transaction([
            prisma.medicationLog.deleteMany({ where: { patientId: targetId } }),
            prisma.schedule.deleteMany({ where: { patientId: targetId } }),
            prisma.refillRequest.deleteMany({ where: { patientId: targetId } }),
            prisma.escalation.deleteMany({ where: { patientId: targetId } }),
            prisma.prescription.deleteMany({ where: { patientId: targetId } }),
            prisma.patient.delete({ where: { id: targetId } }),
            prisma.user.delete({ where: { id: patient.userId } })
        ]);

        res.json({ message: 'Patient deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete patient' });
    }
});

// PATCH /api/patients/:id — Update a patient
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            doctorId, dob, bloodType, weight, height, gender, phone, address,
            emergencyContactName, emergencyContactRelation, emergencyContactPhone,
            secondaryContactName, secondaryContactRelation, secondaryContactPhone,
            profileCompleted, conditions, allergies, firstName, lastName, email
        } = req.body;

        let patient = await prisma.patient.findUnique({ where: { id } });
        if (!patient) {
            patient = await prisma.patient.findUnique({ where: { userId: id } });
        }
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const targetId = patient.id;

        await prisma.$transaction([
            // Update patient table
            prisma.patient.update({
                where: { id: targetId },
                data: {
                    doctorId: doctorId !== undefined ? doctorId : undefined,
                    dob: dob ? new Date(dob) : undefined,
                    bloodType: bloodType !== undefined ? bloodType : undefined,
                    weight: weight !== undefined ? weight : undefined,
                    height: height !== undefined ? height : undefined,
                    gender: gender !== undefined ? gender : undefined,
                    phone: phone !== undefined ? phone : undefined,
                    address: address !== undefined ? address : undefined,
                    emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
                    emergencyContactRelation: emergencyContactRelation !== undefined ? emergencyContactRelation : undefined,
                    emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
                    secondaryContactName: secondaryContactName !== undefined ? secondaryContactName : undefined,
                    secondaryContactRelation: secondaryContactRelation !== undefined ? secondaryContactRelation : undefined,
                    secondaryContactPhone: secondaryContactPhone !== undefined ? secondaryContactPhone : undefined,
                    profileCompleted: profileCompleted !== undefined ? Boolean(profileCompleted) : undefined,
                    conditions: conditions !== undefined ? conditions : undefined,
                    allergies: allergies !== undefined ? allergies : undefined,
                }
            }),
            // Update associated user if user info is passed
            ...(firstName || lastName || email ? [
                prisma.user.update({
                    where: { id: patient.userId },
                    data: {
                        firstName: firstName !== undefined ? firstName : undefined,
                        lastName: lastName !== undefined ? lastName : undefined,
                        email: email !== undefined ? email : undefined
                    }
                })
            ] : [])
        ]);

        res.json({ message: 'Patient updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update patient' });
    }
});

export default router;

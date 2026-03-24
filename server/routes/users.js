import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users - Get all Staff (Doctors, Pharmacists, Caregivers)
router.get('/', async (req, res) => {
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: {
                    in: ['DOCTOR', 'PHARMACIST', 'CAREGIVER']
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const safeStaff = staff.map(s => ({
            id: s.id,
            name: `${s.role === 'DOCTOR' ? 'Dr. ' : ''}${s.firstName} ${s.lastName}`,
            email: s.email,
            role: s.role.toLowerCase(),
            status: 'active',
            joined: s.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }));

        res.json(safeStaff);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});

// POST /api/users - Register new user (Staff or Patient)
router.post('/', async (req, res) => {
    try {
        const { role, firstName, lastName, email, password, doctorId, username } = req.body;

        if (!role || !firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userRole = role.toUpperCase();

        const user = await prisma.user.create({
            data: {
                email,
                username: username || null,
                passwordHash,
                mustChangePassword: true,
                role: userRole,
                firstName,
                lastName
            }
        });

        if (userRole === 'PATIENT') {
            // Also create Patient profile
            const pidString = Math.floor(Math.random() * 900) + 100;
            const patient = await prisma.patient.create({
                data: {
                    pid: `P-${pidString}`,
                    userId: user.id,
                    doctorId: doctorId || null,
                    dob: new Date('1970-01-01'), // Default, can be updated later
                    bloodType: 'Unknown',
                    weight: 'Unknown',
                    height: 'Unknown',
                    conditions: [],
                    allergies: []
                }
            });
            return res.json({ id: patient.id, message: 'Patient registered successfully' });
        }

        res.json({ id: user.id, message: 'Staff member registered successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Failed to create user' });
    }
});

// PATCH /api/users/:id/reset - Reset Password
router.patch('/:id/reset', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: { passwordHash, mustChangePassword: true }
        });

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// PATCH /api/users/:id/change-password - User self-changes password
router.patch('/:id/change-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Missing fields or password too short' });
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: { passwordHash, mustChangePassword: false }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// DELETE /api/users/:id - Delete Staff User
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await prisma.user.findUnique({ where: { id }});
        if (!user || user.role === 'PATIENT') {
             return res.status(400).json({ error: 'Invalid operation' });
        }

        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;

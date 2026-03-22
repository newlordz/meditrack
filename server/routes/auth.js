import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                patientInfo: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user details without password
        const { passwordHash, ...safeUser } = user;
        
        let id = safeUser.id;
        if (safeUser.role === 'PATIENT' && safeUser.patientInfo) {
             id = safeUser.patientInfo.id;
        }

        res.json({
            id: id,
            userId: safeUser.id, // we might need the actual User ID for the reset endpoint later
            email: safeUser.email,
            name: `${safeUser.role === 'DOCTOR' ? 'Dr. ' : ''}${safeUser.firstName} ${safeUser.lastName}`,
            role: safeUser.role.toLowerCase(),
            status: 'active',
            mustChangePassword: safeUser.mustChangePassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

export default router;

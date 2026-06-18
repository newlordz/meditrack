import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSecret, verifyTOTP } from '../utils/totp.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email },
                    { staffNumber: email }
                ]
            },
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

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            return res.json({
                requireMfa: true,
                userId: user.id,
                email: user.email
            });
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

// POST /api/auth/verify-mfa
router.post('/verify-mfa', async (req, res) => {
    try {
        const { userId, code } = req.body;
        if (!userId || !code) {
            return res.status(400).json({ error: 'User ID and verification code are required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { patientInfo: true }
        });

        if (!user || !user.mfaEnabled || !user.mfaSecret) {
            return res.status(400).json({ error: 'MFA is not enabled for this user' });
        }

        const isValid = verifyTOTP(code, user.mfaSecret);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid MFA code' });
        }

        // Return user details without password
        const { passwordHash, ...safeUser } = user;
        
        let id = safeUser.id;
        if (safeUser.role === 'PATIENT' && safeUser.patientInfo) {
             id = safeUser.patientInfo.id;
        }

        res.json({
            id: id,
            userId: safeUser.id,
            email: safeUser.email,
            name: `${safeUser.role === 'DOCTOR' ? 'Dr. ' : ''}${safeUser.firstName} ${safeUser.lastName}`,
            role: safeUser.role.toLowerCase(),
            status: 'active',
            mustChangePassword: safeUser.mustChangePassword
        });
    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({ error: 'Server error during MFA verification' });
    }
});

// POST /api/auth/enable-mfa
router.post('/enable-mfa', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const secret = generateSecret();
        res.json({
            secret,
            qrCodeUrl: `https://quickchart.io/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(`otpauth://totp/MediTrack:${userId}?secret=${secret}&issuer=MediTrack`)}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to initiate MFA setup' });
    }
});

// POST /api/auth/confirm-mfa
router.post('/confirm-mfa', async (req, res) => {
    try {
        const { userId, secret, code } = req.body;
        if (!userId || !secret || !code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const isValid = verifyTOTP(code, secret);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid verification code. Setup failed.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true, mfaSecret: secret }
        });

        res.json({ message: 'MFA successfully enabled!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to confirm MFA setup' });
    }
});

// POST /api/auth/disable-mfa
router.post('/disable-mfa', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: false, mfaSecret: null }
        });

        res.json({ message: 'MFA successfully disabled!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to disable MFA' });
    }
});

// POST /api/auth/reset-request
router.post('/reset-request', async (req, res) => {
    try {
        const { name, username, role } = req.body;
        if (!name || !username || !role) {
            return res.status(400).json({ error: 'Name, username, and role are required.' });
        }

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ],
                role: role.toUpperCase()
            }
        });

        if (!user) {
            // Return success anyway to avoid user enumeration? Let's return error so they know it didn't match.
            return res.status(404).json({ error: 'No matching user found for the provided details.' });
        }

        // Create pending request
        const request = await prisma.passwordResetRequest.create({
            data: {
                userId: user.id,
                status: 'PENDING'
            }
        });

        res.status(201).json({ message: 'Request submitted to administration successfully.', request });
    } catch(err) {
        console.error('Reset request error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/auth/reset-requests
router.get('/reset-requests', async (req, res) => {
    try {
        const requests = await prisma.passwordResetRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true, role: true, username: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const formatted = requests.map(r => ({
            id: r.id,
            userId: r.userId,
            status: r.status,
            createdAt: r.createdAt,
            userRef: r.user.username || r.user.email,
            name: `${r.user.firstName} ${r.user.lastName}`,
            role: r.user.role.toLowerCase()
        }));

        res.json(formatted);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reset requests' });
    }
});

// PATCH /api/auth/reset-requests/:id
router.patch('/reset-requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, password } = req.body;

        if (status === 'APPROVED' && (!password || password.length < 6)) {
            return res.status(400).json({ error: 'A minimum 6-character password is required to approve.' });
        }

        const request = await prisma.passwordResetRequest.findUnique({ where: { id } });
        if (!request) return res.status(404).json({ error: 'Request not found' });

        if (status === 'REJECTED') {
            await prisma.passwordResetRequest.update({ where: { id }, data: { status: 'REJECTED' } });
            return res.json({ message: 'Request rejected.' });
        }

        if (status === 'APPROVED') {
            const passwordHash = await bcrypt.hash(password, 10);
            
            // Transaction: Update request and update user password
            await prisma.$transaction([
                prisma.passwordResetRequest.update({ where: { id }, data: { status: 'APPROVED' } }),
                prisma.user.update({
                    where: { id: request.userId },
                    data: { passwordHash, mustChangePassword: true }
                })
            ]);

            return res.json({ message: 'Request approved and password updated.' });
        }

        res.status(400).json({ error: 'Invalid status' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process reset request' });
    }
});

export default router;

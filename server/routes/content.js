import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_SITE_CONTENT } from '../utils/defaultContent.js';

const router = Router();
const prisma = new PrismaClient();

// Helper to assemble full content with defaults
async function getFullContent() {
    const records = await prisma.siteContent.findMany();
    const result = { ...DEFAULT_SITE_CONTENT };

    for (const record of records) {
        if (result[record.key]) {
            result[record.key] = {
                ...result[record.key],
                ...(typeof record.data === 'object' && record.data !== null ? record.data : {}),
            };
        } else {
            result[record.key] = record.data;
        }
    }
    return result;
}

// GET /api/content - Retrieve all site sections
router.get('/', async (req, res) => {
    try {
        const content = await getFullContent();
        res.json(content);
    } catch (err) {
        console.error('Error fetching site content:', err);
        // Fallback to in-memory defaults if DB is temporarily unreachable
        res.json(DEFAULT_SITE_CONTENT);
    }
});

// GET /api/content/:key - Retrieve a single section
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const record = await prisma.siteContent.findUnique({
            where: { key },
        });

        const fallback = DEFAULT_SITE_CONTENT[key] || null;
        if (!record && !fallback) {
            return res.status(404).json({ error: `Section '${key}' not found` });
        }

        const data = record
            ? { ...fallback, ...(typeof record.data === 'object' ? record.data : {}) }
            : fallback;

        res.json(data);
    } catch (err) {
        console.error(`Error fetching section ${req.params.key}:`, err);
        const fallback = DEFAULT_SITE_CONTENT[req.params.key] || null;
        res.json(fallback);
    }
});

// PUT /api/content/:key - Update a section (Admin only / authorized)
router.put('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const incomingData = req.body;

        if (!incomingData || typeof incomingData !== 'object') {
            return res.status(400).json({ error: 'Request body must be a valid JSON object' });
        }

        const fallback = DEFAULT_SITE_CONTENT[key] || {};
        const mergedData = { ...fallback, ...incomingData };

        const updated = await prisma.siteContent.upsert({
            where: { key },
            update: { data: mergedData },
            create: { key, data: mergedData },
        });

        res.json({
            key: updated.key,
            data: updated.data,
            updatedAt: updated.updatedAt,
            message: `Section '${key}' updated successfully`,
        });
    } catch (err) {
        console.error(`Error updating section ${req.params.key}:`, err);
        res.status(500).json({ error: 'Failed to update section content' });
    }
});

// POST /api/content/reset/:key - Reset a specific section to defaults
router.post('/reset/:key', async (req, res) => {
    try {
        const { key } = req.params;
        await prisma.siteContent.deleteMany({
            where: { key },
        });

        const fallback = DEFAULT_SITE_CONTENT[key] || {};
        res.json({
            key,
            data: fallback,
            message: `Section '${key}' reset to factory defaults`,
        });
    } catch (err) {
        console.error(`Error resetting section ${req.params.key}:`, err);
        res.status(500).json({ error: 'Failed to reset section' });
    }
});

// POST /api/content/reset-all - Reset entire website content to defaults
router.post('/reset-all', async (req, res) => {
    try {
        await prisma.siteContent.deleteMany();
        res.json({
            data: DEFAULT_SITE_CONTENT,
            message: 'All website sections have been restored to factory defaults',
        });
    } catch (err) {
        console.error('Error resetting all site content:', err);
        res.status(500).json({ error: 'Failed to reset all content' });
    }
});

export default router;

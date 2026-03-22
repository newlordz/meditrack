import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function main() {
    const patients = await prisma.patient.findMany({ include: { user: true } });
    const docs = await prisma.user.findMany({ where: { role: 'DOCTOR' } });
    const out = {
        patients: patients.map(p => ({ id: p.id, pid: p.pid, name: p.user.firstName + ' ' + p.user.lastName, docId: p.doctorId })),
        doctors: docs.map(u => ({ id: u.id, name: u.firstName + ' ' + u.lastName }))
    };
    fs.writeFileSync('db_dump.json', JSON.stringify(out, null, 2));
}
main().finally(() => prisma.$disconnect());

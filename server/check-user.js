import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'dr.nl@meditrack.gov.gh' }
        });
        console.log("USER RECORD:");
        console.log(JSON.stringify(user, null, 2));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();

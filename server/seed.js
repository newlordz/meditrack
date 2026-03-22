import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clean slate
    await prisma.medicationLog.deleteMany();
    await prisma.refillRequest.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();

    // Create portal users (Doctor, Pharmacist, Caregiver)
    const doctorUser = await prisma.user.create({
        data: {
            email: 'dr.chen@meditrack.com',
            passwordHash: await bcrypt.hash('password123', 10),
            role: 'DOCTOR',
            firstName: 'Sarah',
            lastName: 'Chen',
        }
    });

    const pharmacistUser = await prisma.user.create({
        data: {
            email: 'dr.frimpong@meditrack.com',
            passwordHash: await bcrypt.hash('password123', 10),
            role: 'PHARMACIST',
            firstName: 'Kofi',
            lastName: 'Frimpong',
        }
    });

    const caregiverUser = await prisma.user.create({
        data: {
            email: 'mary.johanson@meditrack.com',
            passwordHash: await bcrypt.hash('password123', 10),
            role: 'CAREGIVER',
            firstName: 'Mary',
            lastName: 'Johanson',
        }
    });

    // Create patient users and their profiles
    const patientsData = [
        { firstName: 'Ama', lastName: 'Johanson', email: 'ama.johanson@email.com', pid: 'P-001', dob: new Date('1989-04-12'), blood: 'O+', conditions: ['Type 2 Diabetes', 'Hypertension'], allergies: ['Penicillin'] },
        { firstName: 'John', lastName: 'Doe', email: 'john.doe@email.com', pid: 'P-002', dob: new Date('1973-06-18'), blood: 'A+', conditions: ['Type 2 Diabetes'], allergies: ['Sulfa'] },
        { firstName: 'Alice', lastName: 'Smith', email: 'alice.smith@email.com', pid: 'P-003', dob: new Date('1981-09-22'), blood: 'B+', conditions: ['Hypertension'], allergies: [] },
        { firstName: 'Yaw', lastName: 'Darko', email: 'yaw.darko@email.com', pid: 'P-004', dob: new Date('1957-03-05'), blood: 'AB+', conditions: ['Atrial Fibrillation'], allergies: ['Aspirin', 'NSAIDs'] },
        { firstName: 'Sarah', lastName: 'Green', email: 'sarah.green@email.com', pid: 'P-005', dob: new Date('1996-11-14'), blood: 'O-', conditions: ['Post-OP Recovery', 'GERD'], allergies: [] },
        { firstName: 'Kwame', lastName: 'Bediako', email: 'kwame.bediako@email.com', pid: 'P-006', dob: new Date('1964-07-29'), blood: 'A-', conditions: ['Hypertension', 'CKD'], allergies: ['Codeine'] },
        { firstName: 'Nana Ama', lastName: 'Boateng', email: 'nanaama.boateng@email.com', pid: 'P-007', dob: new Date('1984-01-30'), blood: 'B-', conditions: ['Anxiety', 'Hypothyroidism'], allergies: [] },
        { firstName: 'Kwesi', lastName: 'Ofori', email: 'kwesi.ofori@email.com', pid: 'P-008', dob: new Date('1968-05-12'), blood: 'O+', conditions: ['Type 2 Diabetes'], allergies: [] },
    ];

    const createdPatients = [];
    for (const pd of patientsData) {
        const userAccount = await prisma.user.create({
            data: {
                email: pd.email,
                passwordHash: await bcrypt.hash('password123', 10),
                role: 'PATIENT',
                firstName: pd.firstName,
                lastName: pd.lastName,
            }
        });

        const patient = await prisma.patient.create({
            data: {
                pid: pd.pid,
                userId: userAccount.id,
                // First 3 patients belong to the caregiver
                caregiverId: ['P-001', 'P-002', 'P-003'].includes(pd.pid) ? caregiverUser.id : null,
                dob: pd.dob,
                bloodType: pd.blood,
                weight: '70 kg',
                height: '170 cm',
                conditions: pd.conditions,
                allergies: pd.allergies,
            }
        });
        createdPatients.push(patient);
    }

    // Seed prescriptions + schedules for P-001 (Ama Johanson)
    const amaPatient = createdPatients.find(p => p.pid === 'P-001');
    const rxData = [
        { drug: 'Lisinopril', dosage: '10mg', freq: 'Once daily', time: '8:00 PM' },
        { drug: 'Metformin', dosage: '500mg', freq: 'Twice daily', time: '12:00 PM' },
        { drug: 'Aspirin', dosage: '100mg', freq: 'Once daily', time: '8:00 AM' },
    ];
    for (const rx of rxData) {
        const prescription = await prisma.prescription.create({
            data: {
                patientId: amaPatient.id,
                prescriberId: doctorUser.id,
                drugName: rx.drug,
                dosage: rx.dosage,
                frequency: rx.freq,
                instructions: 'Take with water',
                refillsRemaining: 3,
                status: 'ACTIVE',
            }
        });
        await prisma.schedule.create({
            data: {
                prescriptionId: prescription.id,
                patientId: amaPatient.id,
                scheduledTime: rx.time,
            }
        });
    }

    // Seed an escalation for John Doe (P-002)
    const johnPatient = createdPatients.find(p => p.pid === 'P-002');
    await prisma.escalation.create({
        data: {
            patientId: johnPatient.id,
            category: 'ADHERENCE',
            triggerText: 'Missed 4 consecutive doses of Glibenclamide',
            severity: 'CRITICAL',
            status: 'ACTIVE',
        }
    });

    console.log('✅ Database seeded successfully!');
    console.log(`   ${createdPatients.length} patients created`);
    console.log('   Prescriptions and schedules created for Ama Johanson');
    console.log('   Escalation created for John Doe');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });

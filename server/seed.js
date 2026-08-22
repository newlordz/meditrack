import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clean slate in correct dependency order
    await prisma.medicationLog.deleteMany();
    await prisma.refillRequest.deleteMany();
    await prisma.escalation.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.passwordResetRequest.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();

    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Create Portal Staff Users
    const doctorUser = await prisma.user.create({
        data: {
            email: 'dr.chen@meditrack.com',
            username: 'dr.chen',
            passwordHash: defaultPasswordHash,
            role: 'DOCTOR',
            firstName: 'Sarah',
            lastName: 'Chen',
            staffNumber: 'MDT100001',
            mustChangePassword: false,
        }
    });

    const pharmacistUser = await prisma.user.create({
        data: {
            email: 'dr.frimpong@meditrack.com',
            username: 'dr.frimpong',
            passwordHash: defaultPasswordHash,
            role: 'PHARMACIST',
            firstName: 'Kofi',
            lastName: 'Frimpong',
            staffNumber: 'MDT200001',
            mustChangePassword: false,
        }
    });

    const caregiverUser = await prisma.user.create({
        data: {
            email: 'mary.johanson@meditrack.com',
            username: 'mary.johanson',
            passwordHash: defaultPasswordHash,
            role: 'CAREGIVER',
            firstName: 'Mary',
            lastName: 'Johanson',
            mustChangePassword: false,
        }
    });

    // 2. Create Patients & Their Linked User Accounts
    const patientsData = [
        {
            firstName: 'Ama', lastName: 'Johanson', email: 'ama.johanson@email.com', username: 'ama.johanson',
            pid: 'P-001', dob: new Date('1989-04-12'), blood: 'O+', weight: '68 kg', height: '165 cm', gender: 'Female',
            phone: '+233 24 000 1234', address: 'House 14, Ring Road Central, Accra, Ghana',
            conditions: ['Type 2 Diabetes', 'Hypertension'], allergies: ['Penicillin'],
            caregiver: caregiverUser.id,
            prescriptions: [
                { drug: 'Aspirin', dosage: '100mg', freq: 'Once daily', instructions: 'Take with water after breakfast', times: ['08:00 AM'], refills: 3 },
                { drug: 'Metformin', dosage: '500mg', freq: 'Twice daily', instructions: 'Take with lunch and dinner', times: ['12:00 PM', '08:00 PM'], refills: 2 },
                { drug: 'Lisinopril', dosage: '10mg', freq: 'Once daily', instructions: 'Take at bedtime', times: ['09:00 PM'], refills: 2 },
            ]
        },
        {
            firstName: 'John', lastName: 'Doe', email: 'john.doe@email.com', username: 'john.doe',
            pid: 'P-002', dob: new Date('1973-06-18'), blood: 'A+', weight: '82 kg', height: '178 cm', gender: 'Male',
            phone: '+233 20 111 2233', address: 'Plot 8, Airport Residential, Accra',
            conditions: ['Type 2 Diabetes'], allergies: ['Sulfa'],
            caregiver: caregiverUser.id,
            prescriptions: [
                { drug: 'Glibenclamide', dosage: '5mg', freq: 'Once daily', instructions: 'Take before breakfast', times: ['08:00 AM'], refills: 1 },
                { drug: 'Metformin', dosage: '500mg', freq: 'Twice daily', instructions: 'Take after meals', times: ['12:00 PM', '08:00 PM'], refills: 2 },
            ]
        },
        {
            firstName: 'Alice', lastName: 'Smith', email: 'alice.smith@email.com', username: 'alice.smith',
            pid: 'P-003', dob: new Date('1981-09-22'), blood: 'B+', weight: '62 kg', height: '160 cm', gender: 'Female',
            phone: '+233 27 222 3344', address: '24 Cantonments Rd, Accra',
            conditions: ['Hypertension'], allergies: [],
            caregiver: caregiverUser.id,
            prescriptions: [
                { drug: 'Amlodipine', dosage: '5mg', freq: 'Twice daily', instructions: 'Take morning and evening', times: ['08:00 AM', '06:00 PM'], refills: 4 },
                { drug: 'Hydrochlorothiazide', dosage: '25mg', freq: 'Once daily', instructions: 'Take in the morning', times: ['08:00 AM'], refills: 4 },
            ]
        },
        {
            firstName: 'Yaw', lastName: 'Darko', email: 'yaw.darko@email.com', username: 'yaw.darko',
            pid: 'P-004', dob: new Date('1957-03-05'), blood: 'AB+', weight: '76 kg', height: '172 cm', gender: 'Male',
            phone: '+233 24 333 4455', address: '12 Labone Crescent, Accra',
            conditions: ['Atrial Fibrillation'], allergies: ['Aspirin', 'NSAIDs'],
            caregiver: null,
            prescriptions: [
                { drug: 'Warfarin', dosage: '5mg', freq: 'Once daily', instructions: 'Take at 8:00 AM consistently', times: ['08:00 AM'], refills: 0 },
                { drug: 'Bisoprolol', dosage: '5mg', freq: 'Once daily', instructions: 'Take with morning meal', times: ['08:00 AM'], refills: 2 },
                { drug: 'Furosemide', dosage: '40mg', freq: 'Twice daily', instructions: 'Take 12pm and 8pm', times: ['12:00 PM', '08:00 PM'], refills: 2 },
            ]
        },
        {
            firstName: 'Sarah', lastName: 'Green', email: 'sarah.green@email.com', username: 'sarah.green',
            pid: 'P-005', dob: new Date('1996-11-14'), blood: 'O-', weight: '58 kg', height: '168 cm', gender: 'Female',
            phone: '+233 50 444 5566', address: '55 East Legon Avenue, Accra',
            conditions: ['Post-OP Recovery', 'GERD'], allergies: [],
            caregiver: null,
            prescriptions: [
                { drug: 'Omeprazole', dosage: '20mg', freq: 'Once daily', instructions: 'Take 30 mins before first meal', times: ['08:00 AM'], refills: 0 },
            ]
        },
        {
            firstName: 'Kwame', lastName: 'Bediako', email: 'kwame.bediako@email.com', username: 'kwame.bediako',
            pid: 'P-006', dob: new Date('1964-07-29'), blood: 'A-', weight: '79 kg', height: '175 cm', gender: 'Male',
            phone: '+233 26 555 6677', address: '7 Spintex Road, Accra',
            conditions: ['Hypertension', 'Chronic Kidney Disease'], allergies: ['Codeine'],
            caregiver: null,
            prescriptions: [
                { drug: 'Lisinopril', dosage: '10mg', freq: 'Once daily', instructions: 'Take in morning', times: ['08:00 AM'], refills: 3 },
                { drug: 'Amlodipine', dosage: '5mg', freq: 'Once daily', instructions: 'Take at night', times: ['09:00 PM'], refills: 3 },
                { drug: 'Furosemide', dosage: '20mg', freq: 'Twice daily', instructions: 'Take morning and evening', times: ['08:00 AM', '06:00 PM'], refills: 2 },
            ]
        },
        {
            firstName: 'Nana Ama', lastName: 'Boateng', email: 'nanaama.boateng@email.com', username: 'nanaama.boateng',
            pid: 'P-007', dob: new Date('1984-01-30'), blood: 'B-', weight: '65 kg', height: '162 cm', gender: 'Female',
            phone: '+233 24 666 7788', address: '18 Dzorwulu Highway, Accra',
            conditions: ['Anxiety', 'Hypothyroidism'], allergies: [],
            caregiver: null,
            prescriptions: [
                { drug: 'Levothyroxine', dosage: '50mcg', freq: 'Once daily', instructions: 'Take on empty stomach upon waking', times: ['07:00 AM'], refills: 5 },
                { drug: 'Sertraline', dosage: '50mg', freq: 'Once daily', instructions: 'Take with breakfast', times: ['09:00 AM'], refills: 3 },
            ]
        },
        {
            firstName: 'Kwesi', lastName: 'Ofori', email: 'kwesi.ofori@email.com', username: 'kwesi.ofori',
            pid: 'P-008', dob: new Date('1968-05-12'), blood: 'O+', weight: '85 kg', height: '176 cm', gender: 'Male',
            phone: '+233 20 777 8899', address: '30 Achimota Crescent, Accra',
            conditions: ['Type 2 Diabetes'], allergies: [],
            caregiver: null,
            prescriptions: [
                { drug: 'Glibenclamide', dosage: '5mg', freq: 'Twice daily', instructions: 'Take morning and evening before meals', times: ['08:00 AM', '06:00 PM'], refills: 0 },
                { drug: 'Metformin', dosage: '1000mg', freq: 'Once daily', instructions: 'Take with morning meal', times: ['08:00 AM'], refills: 1 },
                { drug: 'Atorvastatin', dosage: '20mg', freq: 'Once daily', instructions: 'Take at bedtime', times: ['09:00 PM'], refills: 2 },
            ]
        },
    ];

    const createdPatientsMap = {};

    for (const pd of patientsData) {
        const userAccount = await prisma.user.create({
            data: {
                email: pd.email,
                username: pd.username,
                passwordHash: defaultPasswordHash,
                role: 'PATIENT',
                firstName: pd.firstName,
                lastName: pd.lastName,
                mustChangePassword: false,
            }
        });

        const patient = await prisma.patient.create({
            data: {
                pid: pd.pid,
                userId: userAccount.id,
                doctorId: doctorUser.id,
                caregiverId: pd.caregiver,
                dob: pd.dob,
                bloodType: pd.blood,
                weight: pd.weight,
                height: pd.height,
                gender: pd.gender,
                phone: pd.phone,
                address: pd.address,
                emergencyContactName: 'Mary Johanson',
                emergencyContactRelation: 'Spouse',
                emergencyContactPhone: '+233 24 999 8888',
                profileCompleted: true,
                conditions: pd.conditions,
                allergies: pd.allergies,
            }
        });

        createdPatientsMap[pd.pid] = { patient, user: userAccount, prescriptions: [] };

        // Create prescriptions & schedules
        for (const rx of pd.prescriptions) {
            const prescription = await prisma.prescription.create({
                data: {
                    patientId: patient.id,
                    prescriberId: doctorUser.id,
                    drugName: rx.drug,
                    dosage: rx.dosage,
                    frequency: rx.freq,
                    instructions: rx.instructions,
                    refillsRemaining: rx.refills,
                    status: 'ACTIVE',
                }
            });

            const schedules = [];
            for (const t of rx.times) {
                const sched = await prisma.schedule.create({
                    data: {
                        prescriptionId: prescription.id,
                        patientId: patient.id,
                        scheduledTime: t,
                    }
                });
                schedules.push(sched);
            }

            createdPatientsMap[pd.pid].prescriptions.push({ prescription, schedules });
        }
    }

    // 3. Seed Realistic Medication Logs
    console.log('📦 Seeding medication logs...');
    const now = new Date();
    const todayMorning = new Date(now); todayMorning.setHours(8, 5, 0, 0);
    const todayNoon = new Date(now); todayNoon.setHours(12, 10, 0, 0);
    const yesterdayMorning = new Date(now); yesterdayMorning.setDate(yesterdayMorning.getDate() - 1); yesterdayMorning.setHours(8, 15, 0, 0);
    const twoDaysAgo = new Date(now); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); twoDaysAgo.setHours(8, 10, 0, 0);

    // Logs for Ama Johanson (P-001) - High adherence
    const p1 = createdPatientsMap['P-001'];
    if (p1.prescriptions[0]?.schedules[0]) {
        await prisma.medicationLog.create({
            data: { patientId: p1.patient.id, scheduleId: p1.prescriptions[0].schedules[0].id, action: 'TAKEN', loggedAt: todayMorning }
        });
        await prisma.medicationLog.create({
            data: { patientId: p1.patient.id, scheduleId: p1.prescriptions[0].schedules[0].id, action: 'TAKEN', loggedAt: yesterdayMorning }
        });
        await prisma.medicationLog.create({
            data: { patientId: p1.patient.id, scheduleId: p1.prescriptions[0].schedules[0].id, action: 'TAKEN', loggedAt: twoDaysAgo }
        });
    }
    if (p1.prescriptions[1]?.schedules[0]) {
        await prisma.medicationLog.create({
            data: { patientId: p1.patient.id, scheduleId: p1.prescriptions[1].schedules[0].id, action: 'TAKEN', loggedAt: todayNoon }
        });
    }

    // Logs for John Doe (P-002) - Missed doses
    const p2 = createdPatientsMap['P-002'];
    if (p2.prescriptions[0]?.schedules[0]) {
        await prisma.medicationLog.create({
            data: { patientId: p2.patient.id, scheduleId: p2.prescriptions[0].schedules[0].id, action: 'MISSED', loggedAt: todayMorning }
        });
        await prisma.medicationLog.create({
            data: { patientId: p2.patient.id, scheduleId: p2.prescriptions[0].schedules[0].id, action: 'MISSED', loggedAt: yesterdayMorning }
        });
    }

    // Logs for Alice Smith (P-003) - Consistent
    const p3 = createdPatientsMap['P-003'];
    if (p3.prescriptions[0]?.schedules[0]) {
        await prisma.medicationLog.create({
            data: { patientId: p3.patient.id, scheduleId: p3.prescriptions[0].schedules[0].id, action: 'TAKEN', loggedAt: todayMorning }
        });
    }

    // 4. Seed Refill Requests
    console.log('🔄 Seeding refill requests...');
    const refillSeeds = [
        { pid: 'P-002', rxIdx: 0, status: 'PENDING' },
        { pid: 'P-003', rxIdx: 0, status: 'PENDING' },
        { pid: 'P-004', rxIdx: 0, status: 'PENDING' },
        { pid: 'P-005', rxIdx: 0, status: 'REJECTED' },
        { pid: 'P-006', rxIdx: 0, status: 'APPROVED' },
    ];

    for (const rs of refillSeeds) {
        const patientObj = createdPatientsMap[rs.pid];
        const rx = patientObj?.prescriptions[rs.rxIdx]?.prescription;
        if (rx) {
            await prisma.refillRequest.create({
                data: {
                    patientId: patientObj.patient.id,
                    prescriptionId: rx.id,
                    pharmacyStatus: rs.status,
                    requestedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)),
                }
            });
        }
    }

    // 5. Seed Escalations
    console.log('⚠️ Seeding escalations...');
    await prisma.escalation.create({
        data: {
            patientId: createdPatientsMap['P-002'].patient.id,
            category: 'ADHERENCE',
            triggerText: 'Missed 4 consecutive doses of Glibenclamide 5mg',
            severity: 'CRITICAL',
            status: 'ACTIVE',
        }
    });

    await prisma.escalation.create({
        data: {
            patientId: createdPatientsMap['P-004'].patient.id,
            category: 'ADHERENCE',
            triggerText: 'Irregular Warfarin dosing pattern detected',
            severity: 'HIGH',
            status: 'ACTIVE',
        }
    });

    await prisma.escalation.create({
        data: {
            patientId: createdPatientsMap['P-005'].patient.id,
            category: 'VITALS',
            triggerText: 'Smart dispenser offline for >48 hours',
            severity: 'HIGH',
            status: 'ACTIVE',
        }
    });

    await prisma.escalation.create({
        data: {
            patientId: createdPatientsMap['P-001'].patient.id,
            category: 'ADHERENCE',
            triggerText: 'Adherence check-in required',
            severity: 'MEDIUM',
            status: 'RESOLVED',
            resolvedAt: new Date(),
        }
    });

    console.log('✅ Database seeded successfully with full clinical records for all 8 patients!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });

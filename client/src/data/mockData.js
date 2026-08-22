/**
 * mockData.js — Static UI Lookup Libraries & Drug References
 * (All dynamic clinical data is now served live from the PostgreSQL database via Prisma & API)
 */

// ─── Common Drug Library for Autocomplete ─────────────────────────────────────
export const COMMON_DRUGS = [
    'Amlodipine 5mg',
    'Amlodipine 10mg',
    'Amoxicillin 250mg',
    'Amoxicillin 500mg',
    'Aspirin 81mg',
    'Aspirin 100mg',
    'Atorvastatin 20mg',
    'Atorvastatin 40mg',
    'Azithromycin 250mg',
    'Azithromycin 500mg',
    'Bisoprolol 5mg',
    'Cetirizine 10mg',
    'Ciprofloxacin 500mg',
    'Digoxin 0.25mg',
    'Furosemide 20mg',
    'Furosemide 40mg',
    'Glibenclamide 5mg',
    'Glipizide 10mg',
    'Hydrochlorothiazide 25mg',
    'Ibuprofen 400mg',
    'Ibuprofen 800mg',
    'Levothyroxine 50mcg',
    'Levothyroxine 100mcg',
    'Lisinopril 10mg',
    'Lisinopril 20mg',
    'Loratadine 10mg',
    'Losartan 50mg',
    'Metformin 500mg',
    'Metformin 1000mg',
    'Omeprazole 20mg',
    'Omeprazole 40mg',
    'Pantoprazole 40mg',
    'Paracetamol 500mg',
    'Paracetamol 1000mg',
    'Sertraline 50mg',
    'Simvastatin 20mg',
    'Spironolactone 25mg',
    'Vitamin C 500mg',
    'Vitamin D3 1000 IU',
    'Warfarin 5mg'
];

export const COMMON_INSTRUCTIONS = [
    'Take 1 tablet daily',
    'Take 1 tablet twice daily',
    'Take 1 tablet three times a day',
    'Take 1 tablet before meals',
    'Take 1 tablet after meals',
    'Take 1 tablet at bedtime',
    'Take with full glass of water',
    'Take on empty stomach upon waking',
    'Take with morning meal',
    'Take as needed for pain',
    'Finish the entire course',
    'Avoid alcohol while taking this medication'
];

export const COMMON_CONDITIONS = [
    'Hypertension',
    'Type 2 Diabetes',
    'Type 1 Diabetes',
    'Asthma',
    'Hyperlipidemia',
    'Osteoarthritis',
    'Depression',
    'Anxiety Disorder',
    'Atrial Fibrillation',
    'Chronic Kidney Disease',
    'COPD',
    'Hypothyroidism',
    'GERD',
    'Routine Checkup',
    'Post-Op Recovery'
];

// Reference pill visual identification library for webcam scanner
export const PILL_DATABASE = {
    'Lisinopril': { shape: 'Round', color: 'Light Pink', imprint: 'L 10', score: 'Unscored' },
    'Metformin': { shape: 'Oval', color: 'White', imprint: 'M 500', score: 'Scored' },
    'Aspirin': { shape: 'Round', color: 'White', imprint: 'ASA 81', score: 'Unscored' },
    'Warfarin': { shape: 'Round', color: 'Peach', imprint: 'WAR 5', score: 'Scored' },
    'Amlodipine': { shape: 'Octagon', color: 'White', imprint: 'AML 5', score: 'Unscored' },
    'Glibenclamide': { shape: 'Oval', color: 'Yellow', imprint: 'GLIB 5', score: 'Scored' },
    'Omeprazole': { shape: 'Capsule', color: 'Purple/Gold', imprint: 'OMEP 20', score: 'N/A' },
    'Levothyroxine': { shape: 'Round', color: 'White', imprint: 'M 50', score: 'Unscored' },
    'Sertraline': { shape: 'Capsule', color: 'Blue/White', imprint: 'SERT 50', score: 'N/A' },
    'Vitamin D3': { shape: 'Capsule', color: 'Yellow/Gold', imprint: 'VD3', score: 'N/A' },
    'Omega-3': { shape: 'Oval', color: 'Clear/Gold', imprint: 'None', score: 'N/A' },
};

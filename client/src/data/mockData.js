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
    'Hydrochlorothiazide': { shape: 'Round', color: 'Peach / Light Orange', imprint: 'H 25', score: 'Unscored' },
    'Atorvastatin': { shape: 'Oval', color: 'White / Off-White', imprint: 'ATV 20', score: 'Unscored' },
    'Losartan': { shape: 'Oval', color: 'White / Greenish', imprint: '93 7365', score: 'Unscored' },
    'Paracetamol': { shape: 'Round / Caplet', color: 'White', imprint: 'PARA 500', score: 'Scored' },
    'Amoxicillin': { shape: 'Capsule / Caplet', color: 'Pink / Maroon', imprint: 'AMOX 500', score: 'Unscored' },
    'Ibuprofen': { shape: 'Round / Oval', color: 'Brown / Reddish', imprint: 'IBU 400', score: 'Unscored' },
    'Omeprazole': { shape: 'Capsule', color: 'Purple/Gold', imprint: 'OMEP 20', score: 'N/A' },
    'Levothyroxine': { shape: 'Round', color: 'White', imprint: 'M 50', score: 'Unscored' },
    'Gabapentin': { shape: 'Capsule', color: 'White / Yellow', imprint: 'GAB 300', score: 'N/A' },
    'Metoprolol': { shape: 'Round', color: 'Pink / White', imprint: 'MET 50', score: 'Scored' },
    'Sertraline': { shape: 'Capsule', color: 'Blue/White', imprint: 'SERT 50', score: 'N/A' },
    'Simvastatin': { shape: 'Oval', color: 'Peach / Tan', imprint: 'SIM 20', score: 'Unscored' },
    'Vitamin D3': { shape: 'Capsule', color: 'Yellow/Gold', imprint: 'VD3', score: 'N/A' },
    'Omega-3': { shape: 'Oval', color: 'Clear/Gold', imprint: 'None', score: 'N/A' },
};

// ─── Sickness Medication Detection — Clinical Knowledge Maps ──────────────────

/**
 * CONDITION_MED_MAP
 * Maps diagnoses/conditions to evidence-based first-line drug recommendations.
 * Each entry includes: drug name, category badge, dosing instructions, and clinical notes.
 */
export const CONDITION_MED_MAP = {
    'Hypertension': [
        { drug: 'Amlodipine 5mg', category: 'CCB', instructions: 'Take 1 tablet daily in the morning', note: 'First-line CCB for stage 1 HTN', risk: 'low' },
        { drug: 'Lisinopril 10mg', category: 'ACE Inhibitor', instructions: 'Take 1 tablet daily, monitor K+ and creatinine', note: 'Preferred in diabetic or CKD patients', risk: 'medium' },
        { drug: 'Hydrochlorothiazide 25mg', category: 'Thiazide Diuretic', instructions: 'Take 1 tablet daily in the morning', note: 'Effective monotherapy for isolated systolic HTN', risk: 'low' },
        { drug: 'Losartan 50mg', category: 'ARB', instructions: 'Take 1 tablet daily with or without food', note: 'Preferred when ACE inhibitor cough occurs', risk: 'low' },
        { drug: 'Bisoprolol 5mg', category: 'Beta Blocker', instructions: 'Take 1 tablet daily, do not stop abruptly', note: 'Add-on therapy; useful in heart failure comorbidity', risk: 'medium' },
    ],
    'Type 2 Diabetes': [
        { drug: 'Metformin 500mg', category: 'Biguanide', instructions: 'Take 1 tablet twice daily after meals', note: 'First-line agent; reduces cardiovascular risk', risk: 'low' },
        { drug: 'Metformin 1000mg', category: 'Biguanide', instructions: 'Take 1 tablet twice daily after meals', note: 'Titrate up from 500mg if tolerated', risk: 'low' },
        { drug: 'Glibenclamide 5mg', category: 'Sulfonylurea', instructions: 'Take 1 tablet daily 30 min before breakfast', note: 'Caution: hypoglycemia risk in elderly', risk: 'medium' },
        { drug: 'Glipizide 10mg', category: 'Sulfonylurea', instructions: 'Take 1 tablet daily before breakfast', note: 'Shorter half-life than glibenclamide; lower hypo risk', risk: 'medium' },
    ],
    'Type 1 Diabetes': [
        { drug: 'Metformin 500mg', category: 'Adjunct', instructions: 'Take 1 tablet with meals as adjunct to insulin', note: 'Adjunct only; insulin remains primary therapy', risk: 'low' },
    ],
    'Hyperlipidemia': [
        { drug: 'Atorvastatin 20mg', category: 'Statin', instructions: 'Take 1 tablet daily at bedtime', note: 'High-intensity statin for CVD risk reduction', risk: 'low' },
        { drug: 'Atorvastatin 40mg', category: 'Statin', instructions: 'Take 1 tablet daily at bedtime', note: 'Escalate if LDL target not met at 20mg', risk: 'low' },
        { drug: 'Simvastatin 20mg', category: 'Statin', instructions: 'Take 1 tablet daily at bedtime', note: 'Alternative moderate-intensity statin', risk: 'low' },
    ],
    'Asthma': [
        { drug: 'Paracetamol 500mg', category: 'Analgesic (Safe)', instructions: 'Take 1-2 tablets every 4-6 hours as needed, max 4g/day', note: 'Preferred painkiller — avoid NSAIDs and Aspirin in asthma', risk: 'low' },
        { drug: 'Cetirizine 10mg', category: 'Antihistamine', instructions: 'Take 1 tablet daily at bedtime', note: 'For allergic component of asthma; non-sedating', risk: 'low' },
        { drug: 'Loratadine 10mg', category: 'Antihistamine', instructions: 'Take 1 tablet daily in the morning', note: 'Non-sedating; safe in daytime use', risk: 'low' },
    ],
    'COPD': [
        { drug: 'Bisoprolol 5mg', category: 'Beta Blocker', instructions: 'Take 1 tablet daily, do not stop abruptly', note: 'Cardioselective; use cautiously in severe COPD', risk: 'medium' },
        { drug: 'Spironolactone 25mg', category: 'Aldosterone Antagonist', instructions: 'Take 1 tablet daily with food', note: 'For concurrent heart failure management', risk: 'medium' },
    ],
    'Atrial Fibrillation': [
        { drug: 'Warfarin 5mg', category: 'Anticoagulant', instructions: 'Take 1 tablet daily, monitor INR regularly', note: 'Standard anticoagulation for stroke prevention in AF', risk: 'high' },
        { drug: 'Bisoprolol 5mg', category: 'Beta Blocker', instructions: 'Take 1 tablet daily for rate control', note: 'Rate control agent; do not stop abruptly', risk: 'medium' },
        { drug: 'Digoxin 0.25mg', category: 'Cardiac Glycoside', instructions: 'Take 1 tablet daily; monitor toxicity', note: 'Rate control only; narrow therapeutic index', risk: 'high' },
        { drug: 'Aspirin 100mg', category: 'Antiplatelet', instructions: 'Take 1 tablet daily after meals', note: 'Only if anticoagulation is contraindicated', risk: 'medium' },
    ],
    'Hypothyroidism': [
        { drug: 'Levothyroxine 50mcg', category: 'Thyroid Hormone', instructions: 'Take 1 tablet daily on empty stomach, 30 min before eating', note: 'Start low and titrate based on TSH', risk: 'low' },
        { drug: 'Levothyroxine 100mcg', category: 'Thyroid Hormone', instructions: 'Take 1 tablet daily on empty stomach, 30 min before eating', note: 'Maintenance dose; monitor TSH every 6 months', risk: 'low' },
    ],
    'GERD': [
        { drug: 'Omeprazole 20mg', category: 'PPI', instructions: 'Take 1 capsule daily 30 minutes before breakfast', note: 'First-line PPI for GERD; 4–8 week course', risk: 'low' },
        { drug: 'Omeprazole 40mg', category: 'PPI', instructions: 'Take 1 capsule daily before breakfast', note: 'For erosive esophagitis or severe GERD', risk: 'low' },
        { drug: 'Pantoprazole 40mg', category: 'PPI', instructions: 'Take 1 tablet daily 30 minutes before a meal', note: 'Alternative PPI; fewer drug interactions', risk: 'low' },
    ],
    'Chronic Kidney Disease': [
        { drug: 'Furosemide 40mg', category: 'Loop Diuretic', instructions: 'Take 1 tablet daily in the morning', note: 'For fluid overload in CKD; monitor electrolytes', risk: 'medium' },
        { drug: 'Spironolactone 25mg', category: 'Aldosterone Antagonist', instructions: 'Take 1 tablet daily; monitor potassium closely', note: 'Caution in CKD — hyperkalemia risk', risk: 'high' },
        { drug: 'Lisinopril 10mg', category: 'ACE Inhibitor', instructions: 'Take 1 tablet daily; monitor K+ and renal function', note: 'Renoprotective in diabetic nephropathy', risk: 'medium' },
    ],
    'Depression': [
        { drug: 'Sertraline 50mg', category: 'SSRI', instructions: 'Take 1 tablet daily; effects may take 2-4 weeks', note: 'First-line SSRI; well-tolerated. Review in 4 weeks', risk: 'low' },
    ],
    'Anxiety Disorder': [
        { drug: 'Sertraline 50mg', category: 'SSRI', instructions: 'Take 1 tablet daily; start low and increase slowly', note: 'First-line for GAD; allow 4–6 weeks for full effect', risk: 'low' },
    ],
    'Osteoarthritis': [
        { drug: 'Paracetamol 500mg', category: 'Analgesic', instructions: 'Take 1-2 tablets every 4-6 hours as needed; max 4g/day', note: 'First-line analgesic for OA; avoid in liver disease', risk: 'low' },
        { drug: 'Ibuprofen 400mg', category: 'NSAID', instructions: 'Take 1 tablet three times daily after meals', note: 'Effective anti-inflammatory; avoid in GI, renal issues', risk: 'medium' },
    ],
    'Post-Op Recovery': [
        { drug: 'Paracetamol 1000mg', category: 'Analgesic', instructions: 'Take 1 tablet every 6 hours; max 4g/day', note: 'Baseline analgesia; avoid opioids where possible', risk: 'low' },
        { drug: 'Ibuprofen 400mg', category: 'NSAID', instructions: 'Take 1 tablet three times daily after food', note: 'Anti-inflammatory; contraindicated in renal impairment', risk: 'medium' },
        { drug: 'Omeprazole 20mg', category: 'PPI', instructions: 'Take 1 capsule daily to protect stomach lining', note: 'Gastroprotection when prescribing NSAIDs post-op', risk: 'low' },
    ],
    'Routine Checkup': [
        { drug: 'Vitamin D3 1000 IU', category: 'Supplement', instructions: 'Take 1 capsule daily with a fatty meal', note: 'For confirmed or suspected Vitamin D deficiency', risk: 'low' },
        { drug: 'Vitamin C 500mg', category: 'Supplement', instructions: 'Take 1 tablet daily after a meal', note: 'Immune support; safe for general supplementation', risk: 'low' },
    ],
};

/**
 * DRUG_INTERACTIONS
 * Known clinically significant drug-drug interactions.
 * Format: [DrugA, DrugB] — order doesn't matter. Lookup both directions.
 */
export const DRUG_INTERACTIONS = [
    { pair: ['Warfarin', 'Aspirin'], severity: 'high', message: 'Warfarin + Aspirin significantly increases bleeding risk. Use extreme caution.' },
    { pair: ['Warfarin', 'Ibuprofen'], severity: 'high', message: 'NSAIDs like Ibuprofen potentiate anticoagulation from Warfarin. Avoid combination.' },
    { pair: ['Lisinopril', 'Spironolactone'], severity: 'medium', message: 'ACE inhibitor + aldosterone antagonist may cause severe hyperkalemia. Monitor K+ closely.' },
    { pair: ['Lisinopril', 'Furosemide'], severity: 'medium', message: 'First-dose hypotension risk. Start Lisinopril at low dose if patient is on Furosemide.' },
    { pair: ['Metformin', 'Furosemide'], severity: 'medium', message: 'Furosemide can increase metformin plasma levels and lactic acidosis risk.' },
    { pair: ['Digoxin', 'Furosemide'], severity: 'high', message: 'Furosemide-induced hypokalemia increases Digoxin toxicity risk. Monitor K+ and Digoxin levels.' },
    { pair: ['Digoxin', 'Spironolactone'], severity: 'medium', message: 'Spironolactone can raise Digoxin serum levels. Monitor closely.' },
    { pair: ['Bisoprolol', 'Digoxin'], severity: 'medium', message: 'Combined rate-lowering effect. Risk of severe bradycardia or heart block.' },
    { pair: ['Sertraline', 'Aspirin'], severity: 'medium', message: 'SSRI + Aspirin increases GI bleeding risk. Use with a PPI if combination is needed.' },
    { pair: ['Sertraline', 'Ibuprofen'], severity: 'medium', message: 'SSRI + NSAID increases GI bleeding risk significantly.' },
    { pair: ['Levothyroxine', 'Omeprazole'], severity: 'low', message: 'PPIs can reduce Levothyroxine absorption. Separate dosing by at least 4 hours.' },
    { pair: ['Amlodipine', 'Atorvastatin'], severity: 'medium', message: 'Amlodipine can increase Atorvastatin levels. Limit Atorvastatin to 20mg when combined.' },
];

/**
 * DRUG_ALLERGY_CLASSES
 * Maps drug names to their class for cross-reactivity allergy checks.
 * A patient allergic to "Penicillin" should also see warnings for Amoxicillin.
 */
export const DRUG_ALLERGY_CLASSES = {
    'Amoxicillin 250mg': ['Penicillin', 'Amoxicillin', 'Beta-lactam'],
    'Amoxicillin 500mg': ['Penicillin', 'Amoxicillin', 'Beta-lactam'],
    'Ciprofloxacin 500mg': ['Ciprofloxacin', 'Fluoroquinolone', 'Quinolone'],
    'Azithromycin 250mg': ['Azithromycin', 'Macrolide'],
    'Azithromycin 500mg': ['Azithromycin', 'Macrolide'],
    'Aspirin 81mg': ['Aspirin', 'Salicylate', 'NSAID'],
    'Aspirin 100mg': ['Aspirin', 'Salicylate', 'NSAID'],
    'Ibuprofen 400mg': ['Ibuprofen', 'NSAID'],
    'Ibuprofen 800mg': ['Ibuprofen', 'NSAID'],
    'Sertraline 50mg': ['Sertraline', 'SSRI', 'Antidepressant'],
    'Warfarin 5mg': ['Warfarin', 'Anticoagulant'],
    'Metformin 500mg': ['Metformin', 'Biguanide'],
    'Metformin 1000mg': ['Metformin', 'Biguanide'],
    'Lisinopril 10mg': ['Lisinopril', 'ACE Inhibitor'],
    'Lisinopril 20mg': ['Lisinopril', 'ACE Inhibitor'],
    'Losartan 50mg': ['Losartan', 'ARB', 'Angiotensin Receptor Blocker'],
    'Amlodipine 5mg': ['Amlodipine', 'Calcium Channel Blocker', 'CCB'],
    'Amlodipine 10mg': ['Amlodipine', 'Calcium Channel Blocker', 'CCB'],
    'Omeprazole 20mg': ['Omeprazole', 'PPI', 'Proton Pump Inhibitor'],
    'Omeprazole 40mg': ['Omeprazole', 'PPI', 'Proton Pump Inhibitor'],
    'Pantoprazole 40mg': ['Pantoprazole', 'PPI', 'Proton Pump Inhibitor'],
    'Levothyroxine 50mcg': ['Levothyroxine', 'Thyroid Hormone'],
    'Levothyroxine 100mcg': ['Levothyroxine', 'Thyroid Hormone'],
    'Glibenclamide 5mg': ['Glibenclamide', 'Sulfonylurea'],
    'Glipizide 10mg': ['Glipizide', 'Sulfonylurea'],
    'Furosemide 20mg': ['Furosemide', 'Loop Diuretic', 'Sulfonamide'],
    'Furosemide 40mg': ['Furosemide', 'Loop Diuretic', 'Sulfonamide'],
    'Spironolactone 25mg': ['Spironolactone', 'Aldosterone Antagonist'],
    'Digoxin 0.25mg': ['Digoxin', 'Cardiac Glycoside'],
    'Bisoprolol 5mg': ['Bisoprolol', 'Beta Blocker'],
    'Atorvastatin 20mg': ['Atorvastatin', 'Statin'],
    'Atorvastatin 40mg': ['Atorvastatin', 'Statin'],
    'Simvastatin 20mg': ['Simvastatin', 'Statin'],
    'Hydrochlorothiazide 25mg': ['Hydrochlorothiazide', 'Thiazide Diuretic', 'Sulfonamide'],
    'Cetirizine 10mg': ['Cetirizine', 'Antihistamine'],
    'Loratadine 10mg': ['Loratadine', 'Antihistamine'],
    'Paracetamol 500mg': ['Paracetamol', 'Acetaminophen'],
    'Paracetamol 1000mg': ['Paracetamol', 'Acetaminophen'],
};


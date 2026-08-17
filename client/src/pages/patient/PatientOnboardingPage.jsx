import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { getPatient, updatePatient } from '../../api/api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const GENDERS = ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'];
const RELATIONS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Guardian', 'Relative', 'Friend', 'Doctor / Caregiver', 'Other'];

const POPULAR_ALLERGIES = ['Penicillin', 'Sulfa Drugs', 'Aspirin', 'NSAIDs', 'Codeine', 'Amoxicillin', 'Latex', 'Peanuts', 'Shellfish'];
const POPULAR_CONDITIONS = ['Hypertension', 'Type 2 Diabetes', 'Type 1 Diabetes', 'Asthma', 'Hyperlipidemia', 'Atrial Fibrillation', 'GERD', 'CKD', 'Anxiety'];

export default function PatientOnboardingPage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        // Step 1: Vitals & Personal
        phone: '',
        gender: 'Male',
        dob: '1990-01-01',
        bloodType: 'O+',
        weight: '70 kg',
        height: '170 cm',
        address: '',

        // Step 2: Emergency Contacts
        emergencyContactName: '',
        emergencyContactRelation: 'Spouse',
        emergencyContactPhone: '',
        secondaryContactName: '',
        secondaryContactRelation: 'Parent',
        secondaryContactPhone: '',

        // Step 3: Medical Background
        allergies: [],
        conditions: [],
    });

    const [customAllergy, setCustomAllergy] = useState('');
    const [customCondition, setCustomCondition] = useState('');

    // Pre-populate if patient data exists
    useEffect(() => {
        if (!user?.id) return;
        getPatient(user.id)
            .then(p => {
                if (!p) return;
                setForm(prev => ({
                    ...prev,
                    phone: p.phone || prev.phone,
                    gender: p.gender || prev.gender,
                    dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : prev.dob,
                    bloodType: p.bloodType || prev.bloodType,
                    weight: p.weight || prev.weight,
                    height: p.height || prev.height,
                    address: p.address || prev.address,
                    emergencyContactName: p.emergencyContactName || prev.emergencyContactName,
                    emergencyContactRelation: p.emergencyContactRelation || prev.emergencyContactRelation,
                    emergencyContactPhone: p.emergencyContactPhone || prev.emergencyContactPhone,
                    secondaryContactName: p.secondaryContactName || prev.secondaryContactName,
                    secondaryContactRelation: p.secondaryContactRelation || prev.secondaryContactRelation,
                    secondaryContactPhone: p.secondaryContactPhone || prev.secondaryContactPhone,
                    allergies: p.allergies || prev.allergies,
                    conditions: p.conditions || prev.conditions,
                }));
            })
            .catch(err => console.error('Failed to pre-fetch patient data', err));
    }, [user]);

    const toggleAllergy = (item) => {
        setForm(prev => ({
            ...prev,
            allergies: prev.allergies.includes(item)
                ? prev.allergies.filter(x => x !== item)
                : [...prev.allergies, item]
        }));
    };

    const addCustomAllergy = () => {
        if (!customAllergy.trim()) return;
        if (!form.allergies.includes(customAllergy.trim())) {
            setForm(prev => ({ ...prev, allergies: [...prev.allergies, customAllergy.trim()] }));
        }
        setCustomAllergy('');
    };

    const toggleCondition = (item) => {
        setForm(prev => ({
            ...prev,
            conditions: prev.conditions.includes(item)
                ? prev.conditions.filter(x => x !== item)
                : [...prev.conditions, item]
        }));
    };

    const addCustomCondition = () => {
        if (!customCondition.trim()) return;
        if (!form.conditions.includes(customCondition.trim())) {
            setForm(prev => ({ ...prev, conditions: [...prev.conditions, customCondition.trim()] }));
        }
        setCustomCondition('');
    };

    const handleNext = (e) => {
        if (e) e.preventDefault();
        setError('');

        if (step === 1) {
            if (!form.phone.trim()) {
                setError('Please provide your phone number.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!form.emergencyContactName.trim() || !form.emergencyContactPhone.trim()) {
                setError('Please fill in your primary emergency contact name and phone number.');
                return;
            }
            setStep(3);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await updatePatient(user.id, {
                phone: form.phone,
                gender: form.gender,
                dob: form.dob,
                bloodType: form.bloodType,
                weight: form.weight,
                height: form.height,
                address: form.address,
                emergencyContactName: form.emergencyContactName,
                emergencyContactRelation: form.emergencyContactRelation,
                emergencyContactPhone: form.emergencyContactPhone,
                secondaryContactName: form.secondaryContactName || null,
                secondaryContactRelation: form.secondaryContactRelation || null,
                secondaryContactPhone: form.secondaryContactPhone || null,
                allergies: form.allergies,
                conditions: form.conditions,
                profileCompleted: true
            });

            updateUser({ profileCompleted: true });
            navigate('/patient/schedule', { replace: true });
        } catch (err) {
            setError(err.message || 'Failed to save information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Personal & Vitals', icon: 'person' },
        { num: 2, title: 'Emergency Contacts', icon: 'contact_phone' },
        { num: 3, title: 'Medical History', icon: 'medical_services' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex flex-col justify-center sm:px-6 lg:px-8 py-10">
            <div className="max-w-2xl w-full mx-auto">
                {/* Brand Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-blue-600/20">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Patient Onboarding
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Complete Your Health Profile</h1>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        Welcome to MediTrack, <span className="font-bold text-slate-800">{user?.name || 'Patient'}</span>! Please provide your emergency contacts and basic medical details so your care team can keep you safe.
                    </p>
                </div>

                {/* Stepper Wizard Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center justify-between">
                    {steps.map((s, idx) => (
                        <div key={s.num} className="flex-1 flex items-center">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                                    step === s.num
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100'
                                        : step > s.num
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {step > s.num ? (
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                    ) : (
                                        s.num
                                    )}
                                </div>
                                <span className={`text-xs font-bold hidden sm:inline ${
                                    step === s.num ? 'text-blue-600' : step > s.num ? 'text-slate-800' : 'text-slate-400'
                                }`}>
                                    {s.title}
                                </span>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-fade-in">
                    {error && (
                        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-rose-500 text-[20px] mt-0.5">error</span>
                            <p className="text-sm font-semibold text-rose-700">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Personal & Vitals */}
                    {step === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">person</span>
                                    Personal &amp; Vitals Details
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Basic contact information and physiological metrics.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Phone Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="+233 24 000 0000"
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Gender
                                    </label>
                                    <select
                                        value={form.gender}
                                        onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        value={form.dob}
                                        onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Blood Type
                                    </label>
                                    <select
                                        value={form.bloodType}
                                        onChange={e => setForm(f => ({ ...f, bloodType: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Weight (e.g. 70 kg)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="70 kg"
                                        value={form.weight}
                                        onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Height (e.g. 175 cm)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="175 cm"
                                        value={form.height}
                                        onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Home Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="House No. 12, Ring Road Central, Accra"
                                    value={form.address}
                                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                                >
                                    Next: Emergency Contacts
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Emergency Contacts */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-rose-500">emergency</span>
                                    Emergency Contacts
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Who should we contact in the event of an urgent clinical alert?</p>
                            </div>

                            {/* Primary Emergency Contact */}
                            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 text-xs font-black text-rose-700 uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    Primary Contact (Required)
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Contact Full Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Kwame Mensah"
                                            value={form.emergencyContactName}
                                            onChange={e => setForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Relationship <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.emergencyContactRelation}
                                            onChange={e => setForm(f => ({ ...f, emergencyContactRelation: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                                        >
                                            {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Emergency Phone Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="+233 24 555 9876"
                                        value={form.emergencyContactPhone}
                                        onChange={e => setForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Secondary Emergency Contact (Optional) */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Secondary Contact (Optional)
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Contact Full Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Abena Owusu"
                                            value={form.secondaryContactName}
                                            onChange={e => setForm(f => ({ ...f, secondaryContactName: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Relationship
                                        </label>
                                        <select
                                            value={form.secondaryContactRelation}
                                            onChange={e => setForm(f => ({ ...f, secondaryContactRelation: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        >
                                            {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+233 20 333 5432"
                                        value={form.secondaryContactPhone}
                                        onChange={e => setForm(f => ({ ...f, secondaryContactPhone: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                                >
                                    Next: Medical History
                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Medical Background */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-600">health_and_safety</span>
                                    Allergies &amp; Health Conditions
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Select any known allergies or medical conditions so we can check drug conflicts.</p>
                            </div>

                            {/* Allergies */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Known Drug &amp; Food Allergies
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {POPULAR_ALLERGIES.map(item => {
                                        const selected = form.allergies.includes(item);
                                        return (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => toggleAllergy(item)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                    selected
                                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-400/30'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {selected && <span className="mr-1">✓</span>}
                                                {item}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add other allergy (e.g. Ibuprofen)"
                                        value={customAllergy}
                                        onChange={e => setCustomAllergy(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAllergy(); } }}
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomAllergy}
                                        className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Conditions */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Diagnosed Medical Conditions
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {POPULAR_CONDITIONS.map(item => {
                                        const selected = form.conditions.includes(item);
                                        return (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => toggleCondition(item)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                    selected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-400/30'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {selected && <span className="mr-1">✓</span>}
                                                {item}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add other condition (e.g. Epilepsy)"
                                        value={customCondition}
                                        onChange={e => setCustomCondition(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCondition(); } }}
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomCondition}
                                        className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleSubmit}
                                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Saving Health Profile...
                                        </>
                                    ) : (
                                        <>
                                            Complete Profile &amp; Go to Portal
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

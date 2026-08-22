import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useApi } from '../../hooks/useApi';
import { getPatient, updatePatient } from '../../api/api';
import MFASettingsCard from '../../components/MFASettingsCard';

const EMPTY_PROFILE = {
    firstName: '',
    lastName: '',
    email: '',
    avatar: 'U',
    dob: '',
    gender: 'Not specified',
    bloodType: 'Unknown',
    weight: '—',
    height: '—',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    secondaryContactName: '',
    secondaryContactRelation: '',
    secondaryContactPhone: '',
    allergies: [],
    conditions: [],
};


const TOGGLE_PREFS = [
    { key: 'doseReminders', label: 'Dose Reminders', desc: 'Get notified 15 min before each scheduled dose' },
    { key: 'missedAlerts', label: 'Missed Dose Alerts', desc: 'Alert when a dose is missed by more than 1 hour' },
    { key: 'weeklyReport', label: 'Weekly Health Summary', desc: 'Email digest every Monday morning' },
    { key: 'doctorUpdates', label: 'Doctor Messages', desc: 'Inbox alerts when your doctor sends a note' },
    { key: 'streakNotifs', label: 'Streak Notifications', desc: 'Celebrate streaks and badge unlocks' },
];

function SectionCard({ title, icon, children, action }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                </div>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function ProfileField({ label, field, type = 'text', profile, draft, editing, setDraft }) {
    return (
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            {editing ? (
                <input
                    type={type}
                    value={draft[field] ?? ''}
                    onChange={e => setDraft(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            ) : (
                <p className="text-sm font-semibold text-slate-800">{profile[field] || '—'}</p>
            )}
        </div>
    );
}

export default function PatientProfilePage() {
    const { user, updateUser } = useAuth();
    const targetUserId = user?.id || user?.userId;
    const { data: realPatient } = useApi(() => getPatient(targetUserId), [targetUserId]);

    const getDynamicDoctorsList = () => {
        if (!realPatient) return [];
        const docMap = new Map();
        
        // Add primary doctor if present
        if (realPatient.doctor) {
            const docId = realPatient.doctor.id;
            const name = `Dr. ${realPatient.doctor.firstName} ${realPatient.doctor.lastName}`;
            docMap.set(docId, {
                id: docId,
                name,
                email: realPatient.doctor.email,
                specialty: 'Primary Care Physician',
                icon: 'favorite',
                color: 'bg-rose-50 text-rose-600',
                since: realPatient.createdAt ? new Date(realPatient.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2024',
                prescribes: []
            });
        }
        
        // Add doctors from prescriptions
        if (realPatient.prescriptions && Array.isArray(realPatient.prescriptions)) {
            realPatient.prescriptions.forEach(presc => {
                if (presc.prescriber) {
                    const prescId = presc.prescriberId || presc.prescriber.id || `presc_${presc.prescriber.firstName}_${presc.prescriber.lastName}`;
                    const name = `Dr. ${presc.prescriber.firstName} ${presc.prescriber.lastName}`;
                    if (docMap.has(prescId)) {
                        docMap.get(prescId).prescribes.push(presc.drugName);
                    } else {
                        docMap.set(prescId, {
                            id: prescId,
                            name,
                            email: presc.prescriber.email || 'doctor@meditrack.com',
                            specialty: 'Prescribing Physician',
                            icon: 'medication',
                            color: 'bg-blue-50 text-blue-600',
                            since: presc.issuedAt ? new Date(presc.issuedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent',
                            prescribes: [presc.drugName]
                        });
                    }
                }
            });
        }
        
        return Array.from(docMap.values());
    };

    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('meditrack_patient_profile');
        return saved ? JSON.parse(saved) : EMPTY_PROFILE;
    });

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(profile);
    const [prefs, setPrefs] = useState(() => {
        const saved = localStorage.getItem('meditrack_patient_prefs');
        return saved ? JSON.parse(saved) : { doseReminders: true, missedAlerts: true, weeklyReport: false, doctorUpdates: true, streakNotifs: true };
    });
    const [newAllergy, setNewAllergy] = useState('');
    const [newCond, setNewCond] = useState('');
    const [showAddAllergy, setShowAddAllergy] = useState(false);
    const [showAddCond, setShowAddCond] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        if (realPatient) {
            const mapped = {
                firstName: realPatient.user?.firstName || '',
                lastName: realPatient.user?.lastName || '',
                email: realPatient.user?.email || '',
                avatar: realPatient.user?.firstName ? realPatient.user.firstName[0] : 'U',
                dob: realPatient.dob ? new Date(realPatient.dob).toISOString().split('T')[0] : '',
                gender: realPatient.gender || 'Not specified',
                bloodType: realPatient.bloodType || 'Unknown',
                weight: realPatient.weight || '—',
                height: realPatient.height || '—',
                phone: realPatient.phone || '',
                address: realPatient.address || '',
                emergencyContactName: realPatient.emergencyContactName || '',
                emergencyContactRelation: realPatient.emergencyContactRelation || '',
                emergencyContactPhone: realPatient.emergencyContactPhone || '',
                secondaryContactName: realPatient.secondaryContactName || '',
                secondaryContactRelation: realPatient.secondaryContactRelation || '',
                secondaryContactPhone: realPatient.secondaryContactPhone || '',
                allergies: realPatient.allergies || [],
                conditions: realPatient.conditions || [],
            };
            setProfile(mapped);
            setDraft(mapped);
        }
    }, [realPatient]);

    const handlePrefToggle = (key) => {
        setPrefs(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            localStorage.setItem('meditrack_patient_prefs', JSON.stringify(updated));
            return updated;
        });
    };

    const age = new Date().getFullYear() - new Date(profile.dob).getFullYear();

    const handleSave = async () => {
        try {
            await updatePatient(targetUserId, {
                firstName: draft.firstName,
                lastName: draft.lastName,
                email: draft.email,
                dob: draft.dob,
                gender: draft.gender,
                bloodType: draft.bloodType,
                weight: draft.weight,
                height: draft.height,
                phone: draft.phone,
                address: draft.address,
                emergencyContactName: draft.emergencyContactName,
                emergencyContactRelation: draft.emergencyContactRelation,
                emergencyContactPhone: draft.emergencyContactPhone,
                secondaryContactName: draft.secondaryContactName,
                secondaryContactRelation: draft.secondaryContactRelation,
                secondaryContactPhone: draft.secondaryContactPhone,
            });
            setProfile(draft);
            setEditing(false);
        } catch(err) {
            console.error('Failed to update profile', err);
        }
    };

    const handleCancel = () => {
        setDraft(profile);
        setEditing(false);
    };

    const addAllergy = async () => {
        if (!newAllergy.trim()) return;
        const updated = [...profile.allergies, newAllergy.trim()];
        setProfile(p => ({ ...p, allergies: updated }));
        setDraft(p => ({ ...p, allergies: updated }));
        setNewAllergy('');
        setShowAddAllergy(false);
        await updatePatient(targetUserId, { allergies: updated }).catch(console.error);
    };

    const removeAllergy = async (a) => {
        const updated = profile.allergies.filter(x => x !== a);
        setProfile(p => ({ ...p, allergies: updated }));
        setDraft(p => ({ ...p, allergies: updated }));
        await updatePatient(targetUserId, { allergies: updated }).catch(console.error);
    };

    const addCondition = async () => {
        if (!newCond.trim()) return;
        const updated = [...profile.conditions, newCond.trim()];
        setProfile(p => ({ ...p, conditions: updated }));
        setDraft(p => ({ ...p, conditions: updated }));
        setNewCond('');
        setShowAddCond(false);
        await updatePatient(targetUserId, { conditions: updated }).catch(console.error);
    };

    const removeCondition = async (c) => {
        const updated = profile.conditions.filter(x => x !== c);
        setProfile(p => ({ ...p, conditions: updated }));
        setDraft(p => ({ ...p, conditions: updated }));
        await updatePatient(targetUserId, { conditions: updated }).catch(console.error);
    };


    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 space-y-6 mb-20 lg:mb-0 animate-fade-in">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Patient › <span className="text-primary font-semibold">Profile</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">My Profile</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Manage your personal info, emergency contacts, medical details, and preferences.</p>
                    </div>
                    {!editing ? (
                        <button onClick={() => { setDraft(profile); setEditing(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">Save Changes</button>
                        </div>
                    )}
                </div>


                {/* ── Avatar + Summary strip ─────────────────────────── */}
                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-white">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black flex-shrink-0 shadow-lg">
                        {profile.avatar}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-2xl font-black">{profile.firstName} {profile.lastName}</h3>
                        <p className="text-white/80 text-sm mt-0.5">{profile.email}</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
                            {[
                                { label: 'Age', value: `${isNaN(age) ? '—' : age} yrs` },
                                { label: 'Blood Type', value: profile.bloodType },
                                { label: 'Weight', value: profile.weight },
                                { label: 'Height', value: profile.height },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
                                    <p className="text-[10px] text-white/70 uppercase tracking-wider">{label}</p>
                                    <p className="text-sm font-bold">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center gap-1 bg-white/15 rounded-2xl px-5 py-3">
                        <span className="material-symbols-outlined text-3xl">verified_user</span>
                        <p className="text-xs font-bold">Verified Patient</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left column ───────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Personal Information */}
                        <SectionCard
                            title="Personal Information"
                            icon="person"
                            action={editing && <span className="text-xs text-primary font-semibold">Editing…</span>}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ProfileField label="First Name" field="firstName" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Last Name" field="lastName" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Date of Birth" field="dob" type="date" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Gender" field="gender" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Blood Type" field="bloodType" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Weight" field="weight" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Height" field="height" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Phone" field="phone" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                                <ProfileField label="Email" field="email" type="email" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                            </div>
                            <div className="mt-5">
                                <ProfileField label="Home Address" field="address" profile={profile} draft={draft} editing={editing} setDraft={setDraft} />
                            </div>
                        </SectionCard>

                        {/* Emergency Contacts */}
                        <SectionCard
                            title="Emergency Contacts"
                            icon="contact_phone"
                            action={editing && <span className="text-xs text-primary font-semibold">Editing…</span>}
                        >
                            {editing ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Emergency Contact</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={draft.emergencyContactName ?? ''}
                                                onChange={e => setDraft(d => ({ ...d, emergencyContactName: e.target.value }))}
                                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Relationship (e.g. Spouse)"
                                                value={draft.emergencyContactRelation ?? ''}
                                                onChange={e => setDraft(d => ({ ...d, emergencyContactRelation: e.target.value }))}
                                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                            />
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={draft.emergencyContactPhone ?? ''}
                                            onChange={e => setDraft(d => ({ ...d, emergencyContactPhone: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                        />
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Secondary Emergency Contact (Optional)</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={draft.secondaryContactName ?? ''}
                                                onChange={e => setDraft(d => ({ ...d, secondaryContactName: e.target.value }))}
                                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Relationship (e.g. Parent)"
                                                value={draft.secondaryContactRelation ?? ''}
                                                onChange={e => setDraft(d => ({ ...d, secondaryContactRelation: e.target.value }))}
                                                className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                            />
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            value={draft.secondaryContactPhone ?? ''}
                                            onChange={e => setDraft(d => ({ ...d, secondaryContactPhone: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {profile.emergencyContactName ? (
                                        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">person</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 text-sm truncate">{profile.emergencyContactName}</p>
                                                    <span className="text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">Primary</span>
                                                </div>
                                                <p className="text-xs text-slate-500">{profile.emergencyContactRelation || 'Contact'} · {profile.emergencyContactPhone || 'No phone'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No primary emergency contact on record. Click "Edit Profile" to add.</p>
                                    )}

                                    {profile.secondaryContactName && (
                                        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">person</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 text-sm truncate">{profile.secondaryContactName}</p>
                                                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Secondary</span>
                                                </div>
                                                <p className="text-xs text-slate-500">{profile.secondaryContactRelation || 'Contact'} · {profile.secondaryContactPhone || 'No phone'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SectionCard>

                        {/* MFA Settings */}
                        <MFASettingsCard user={user} updateUser={updateUser} />

                        {/* Allergies */}
                        <SectionCard
                            title="Known Allergies"
                            icon="warning"
                            action={
                                <button onClick={() => setShowAddAllergy(true)} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add
                                </button>
                            }
                        >
                            {profile.allergies.length === 0 && (
                                <p className="text-sm text-slate-400 italic">No known allergies on record.</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {profile.allergies.map(a => (
                                    <span key={a} className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full text-sm font-semibold">
                                        {a}
                                        <button onClick={() => removeAllergy(a)} className="hover:text-rose-900 transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            {showAddAllergy && (
                                <div className="flex gap-2 mt-4">
                                    <input autoFocus value={newAllergy} onChange={e => setNewAllergy(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addAllergy()}
                                        placeholder="e.g. Amoxicillin"
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                    <button onClick={addAllergy} className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors">Add</button>
                                    <button onClick={() => setShowAddAllergy(false)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
                                </div>
                            )}
                        </SectionCard>

                        {/* Medical Conditions */}
                        <SectionCard
                            title="Medical Conditions"
                            icon="medical_information"
                            action={
                                <button onClick={() => setShowAddCond(true)} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                                    <span className="material-symbols-outlined text-[14px]">add</span> Add
                                </button>
                            }
                        >
                            {profile.conditions.length === 0 && (
                                <p className="text-sm text-slate-400 italic">No conditions on record.</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {profile.conditions.map(c => (
                                    <span key={c} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full text-sm font-semibold">
                                        {c}
                                        <button onClick={() => removeCondition(c)} className="hover:text-amber-900 transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                            </div>
                            {showAddCond && (
                                <div className="flex gap-2 mt-4">
                                    <input autoFocus value={newCond} onChange={e => setNewCond(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCondition()}
                                        placeholder="e.g. Asthma"
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                                    <button onClick={addCondition} className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors">Add</button>
                                    <button onClick={() => setShowAddCond(false)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    {/* ── Right column ──────────────────────────────── */}
                    <div className="space-y-6">

                        {/* Prescribing Doctors */}
                        <SectionCard title="Prescribing Doctors" icon="stethoscope">
                            <div className="space-y-4">
                                {getDynamicDoctorsList().length === 0 && (
                                    <p className="text-sm text-slate-400 italic">No prescribing doctors on record.</p>
                                )}
                                {getDynamicDoctorsList().map(doc => (
                                    <div key={doc.id || doc.name} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.color}`}>
                                                <span className="material-symbols-outlined">{doc.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                                                <p className="text-xs text-slate-500">{doc.specialty} · Since {doc.since}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {doc.prescribes.map(med => (
                                                <span key={med} className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{med}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Notification Preferences */}
                        <SectionCard title="Notifications" icon="notifications">
                            <div className="space-y-4">
                                {TOGGLE_PREFS.map(pref => (
                                    <div key={pref.key} className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{pref.label}</p>
                                            <p className="text-xs text-slate-400 leading-relaxed">{pref.desc}</p>
                                        </div>
                                        <button
                                            onClick={() => setPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }))}
                                            className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 relative ${prefs[pref.key] ? 'bg-primary' : 'bg-slate-200'}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${prefs[pref.key] ? 'left-5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    );
}

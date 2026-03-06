import { useState } from 'react';
import { PATIENT_PROFILE as INITIAL_PROFILE } from '../../data/mockData';

const DOCTORS = [
    { name: 'Dr. Amara Mensah', specialty: 'Cardiologist', icon: 'favorite', color: 'bg-rose-50 text-rose-600', since: 'Jan 2022', prescribes: ['Aspirin 100mg', 'Lisinopril 10mg', 'Omega-3 1000mg'] },
    { name: 'Dr. Kofi Acheampong', specialty: 'Endocrinologist', icon: 'biotech', color: 'bg-violet-50 text-violet-600', since: 'Mar 2023', prescribes: ['Metformin 500mg', 'Vitamin D3 4000IU'] },
];

const EMERGENCY_CONTACTS = [
    { name: 'Kwame Johanson', relation: 'Spouse', phone: '+233 24 555 9876', icon: 'person' },
    { name: 'Abena Mensah', relation: 'Mother', phone: '+233 20 333 5432', icon: 'elderly_woman' },
];

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
    const [profile, setProfile] = useState(INITIAL_PROFILE);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(INITIAL_PROFILE);
    const [prefs, setPrefs] = useState({ doseReminders: true, missedAlerts: true, weeklyReport: false, doctorUpdates: true, streakNotifs: true });
    const [showAddAllergy, setShowAddAllergy] = useState(false);
    const [newAllergy, setNewAllergy] = useState('');
    const [showAddCond, setShowAddCond] = useState(false);
    const [newCond, setNewCond] = useState('');

    const age = new Date().getFullYear() - new Date(profile.dob).getFullYear();

    const handleSave = () => {
        setProfile(draft);
        setEditing(false);
    };

    const handleCancel = () => {
        setDraft(profile);
        setEditing(false);
    };

    const addAllergy = () => {
        if (!newAllergy.trim()) return;
        setProfile(p => ({ ...p, allergies: [...p.allergies, newAllergy.trim()] }));
        setDraft(p => ({ ...p, allergies: [...p.allergies, newAllergy.trim()] }));
        setNewAllergy('');
        setShowAddAllergy(false);
    };

    const removeAllergy = (a) => setProfile(p => ({ ...p, allergies: p.allergies.filter(x => x !== a) }));

    const addCondition = () => {
        if (!newCond.trim()) return;
        setProfile(p => ({ ...p, conditions: [...p.conditions, newCond.trim()] }));
        setDraft(p => ({ ...p, conditions: [...p.conditions, newCond.trim()] }));
        setNewCond('');
        setShowAddCond(false);
    };

    const removeCondition = (c) => setProfile(p => ({ ...p, conditions: p.conditions.filter(x => x !== c) }));


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
                        <p className="text-sm text-slate-500 mt-0.5">Manage your personal info, medical details, and preferences.</p>
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
                                { label: 'Age', value: `${age} yrs` },
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
                                {DOCTORS.map(doc => (
                                    <div key={doc.name} className="border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow">
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

                        {/* Emergency Contacts */}
                        <SectionCard title="Emergency Contacts" icon="emergency">
                            <div className="space-y-3">
                                {EMERGENCY_CONTACTS.map(c => (
                                    <div key={c.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-primary text-[18px]">{c.icon}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                                            <p className="text-xs text-slate-500">{c.relation} · {c.phone}</p>
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

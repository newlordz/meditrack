import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';

const NOTIFICATION_SETTINGS = [
    {
        title: 'Dose Alerts',
        icon: 'medication',
        color: 'text-primary',
        items: [
            { key: 'missedDose', label: 'Missed Dose Alerts', desc: 'Notify me when a patient misses a scheduled dose' },
            { key: 'upcomingDose', label: 'Upcoming Dose Reminders', desc: 'Send a reminder 15 minutes before each scheduled dose' },
            { key: 'doubleDose', label: 'Double-Dose Warning', desc: 'Alert if a dose is logged twice within 2 hours' },
        ],
    },
    {
        title: 'Refill & Inventory',
        icon: 'autorenew',
        color: 'text-amber-600',
        items: [
            { key: 'refillSoon', label: 'Refill Due Reminders', desc: 'Notify 7 days before a prescription runs out' },
            { key: 'refillOverdue', label: 'Overdue Refill Alerts', desc: 'Alert on the day a refill is overdue' },
        ],
    },
    {
        title: 'Escalation & Reports',
        icon: 'campaign',
        color: 'text-rose-600',
        items: [
            { key: 'doctorEscalation', label: 'Doctor Escalation Confirmations', desc: 'Notify me when a doctor is alerted about my patient' },
            { key: 'dailySummary', label: 'Daily Adherence Summary', desc: 'Receive a daily digest of all patient adherence data' },
        ],
    },
    {
        title: 'Privacy & Sharing',
        icon: 'lock',
        color: 'text-slate-600',
        items: [
            { key: 'shareWithDoctor', label: 'Share Data with Doctor', desc: 'Allow your monitored patients\' doctors to view caregiver notes' },
            { key: 'smsReminders', label: 'SMS Reminders', desc: 'Receive critical alerts via SMS in addition to app notifications' },
        ],
    },
];

const RELATIONSHIP_OPTIONS = ['Primary Caregiver', 'Family Member', 'Nurse', 'Home Health Aide', 'Social Worker', 'Other'];

export default function CaregiverSettingsPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [displayName, setName] = useState('Mary Johnson');
    const [email, setEmail] = useState('mary.j@meditrack.health');
    const [phone, setPhone] = useState('+1 (555) 012-3456');
    const [relationship, setRelationship] = useState('Primary Caregiver');
    const [saved, setSaved] = useState(false);
    const [dangerMsg, setDangerMsg] = useState('');

    const [prefs, setPrefs] = useState({
        missedDose: true,
        upcomingDose: true,
        doubleDose: true,
        refillSoon: true,
        refillOverdue: true,
        doctorEscalation: true,
        dailySummary: false,
        shareWithDoctor: true,
        smsReminders: false,
    });

    const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleResetPrefs = () => {
        if (!window.confirm('Reset all notification preferences to defaults?')) return;
        setPrefs({
            missedDose: true, upcomingDose: true, doubleDose: true,
            refillSoon: true, refillOverdue: true, doctorEscalation: true,
            dailySummary: false, shareWithDoctor: true, smsReminders: false,
        });
        setDangerMsg('Notification preferences reset to defaults.');
        setTimeout(() => setDangerMsg(''), 3000);
    };

    const handleLogoutAll = () => {
        if (!window.confirm('This will sign you out on all devices. Continue?')) return;
        setDangerMsg('Signing out all sessions…');
        setTimeout(() => { logout(); navigate('/login'); }, 1500);
    };

    return (
        <div className="flex flex-col min-h-screen">

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage your caregiver profile and notification preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl text-sm transition-all shadow-sm ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">{saved ? 'check' : 'save'}</span>
                    {saved ? 'Saved!' : 'Save Changes'}
                </button>
            </header>

            <div className="flex-1 px-4 sm:px-6 py-6 space-y-6 mb-20 lg:mb-0 animate-fade-in">

                {/* Profile */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                        <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                        <h3 className="font-bold text-slate-900">Caregiver Profile</h3>
                    </div>
                    <div className="p-6">
                        {/* Avatar row */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                                {displayName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{displayName}</p>
                                <p className="text-sm text-slate-400">{relationship}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Display Name</label>
                                <input
                                    value={displayName}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Role</label>
                                <select
                                    value={relationship}
                                    onChange={e => setRelationship(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {RELATIONSHIP_OPTIONS.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification / Privacy toggle sections */}
                {NOTIFICATION_SETTINGS.map(section => (
                    <div key={section.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                            <span className={`material-symbols-outlined text-[20px] ${section.color}`}>{section.icon}</span>
                            <h3 className="font-bold text-slate-900">{section.title}</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            {section.items.map(item => (
                                <div key={item.key} className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => toggle(item.key)}
                                        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 relative ${prefs[item.key] ? 'bg-primary' : 'bg-slate-200'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${prefs[item.key] ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Danger Zone */}
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                    <h3 className="font-bold text-rose-800 mb-1">Danger Zone</h3>
                    <p className="text-sm text-rose-600 mb-4">These actions are irreversible or will sign you out immediately.</p>
                    {dangerMsg && (
                        <div className="mb-4 px-4 py-2.5 bg-rose-100 border border-rose-300 rounded-xl text-sm font-semibold text-rose-800">
                            ⚠ {dangerMsg}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleResetPrefs}
                            className="px-4 py-2 border border-rose-300 text-rose-700 font-bold rounded-xl text-sm hover:bg-rose-100 transition-colors"
                        >
                            Reset Notification Preferences
                        </button>
                        <button
                            onClick={handleLogoutAll}
                            className="px-4 py-2 border border-rose-300 text-rose-700 font-bold rounded-xl text-sm hover:bg-rose-100 transition-colors"
                        >
                            Sign Out All Devices
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const TOGGLE_SECTIONS = [
    {
        title: 'Dispensing Alerts',
        icon: 'notifications_active',
        color: 'text-rose-600',
        items: [
            { key: 'highConflict', label: 'High Conflict Notifications', desc: 'Alert when a high-severity drug interaction is detected' },
            { key: 'pendingQueue', label: 'Pending Queue Reminder', desc: 'Remind every 30 min if pending dispenses exceed 10' },
            { key: 'refillAlert', label: 'Refill Request Alerts', desc: 'Notify immediately when a refill is requested by a doctor' },
            { key: 'batchExpiry', label: 'Batch Expiry Warnings', desc: 'Alert 30 days before any batch expires' },
        ],
    },
    {
        title: 'Verification & Audit',
        icon: 'verified_user',
        color: 'text-blue-600',
        items: [
            { key: 'requireScan', label: 'Require Barcode Scan', desc: 'Force barcode verification before marking dispensed' },
            { key: 'twoStep', label: 'Two-Step Confirmation', desc: 'Require a second pharmacist to confirm high-risk drugs' },
            { key: 'auditLog', label: 'Automatic Audit Log', desc: 'Always auto-save a timestamped audit entry on every action' },
        ],
    },
    {
        title: 'System & Privacy',
        icon: 'lock',
        color: 'text-slate-600',
        items: [
            { key: 'autoLogout', label: 'Auto-logout After 15 min', desc: 'Sign out automatically after 15 minutes of inactivity' },
            { key: 'sessionAlert', label: 'Session Expiry Warning', desc: 'Show a warning 2 minutes before auto-logout' },
            { key: 'dataExport', label: 'Allow Data Export', desc: 'Enable CSV export in Medication Logs' },
        ],
    },
];

const SHIFT_OPTIONS = ['07:00 – 15:00', '08:00 – 16:00', '09:00 – 17:00', '15:00 – 23:00', 'Night Shift'];

export default function PharmacistSettingsPage() {
    const [prefs, setPrefs] = useState({
        highConflict: true, pendingQueue: true, refillAlert: true, batchExpiry: true,
        requireScan: true, twoStep: false, auditLog: true,
        autoLogout: true, sessionAlert: true, dataExport: true,
    });
    const [shift, setShift] = useState('08:00 – 16:00');
    const [displayName, setName] = useState('Dr. Sarah Chen');
    const [email, setEmail] = useState('s.chen@meditrack.health');
    const [saved, setSaved] = useState(false);

    const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const [dangerMsg, setDangerMsg] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleClearQueue = () => {
        if (!window.confirm('Are you sure you want to clear the entire pending dispense queue? This cannot be undone.')) return;
        setDangerMsg('Pending queue cleared successfully.');
        setTimeout(() => setDangerMsg(''), 3000);
    };

    const handleForceLogout = () => {
        if (!window.confirm('Force-logout all active sessions? All pharmacist sessions will be terminated immediately.')) return;
        setDangerMsg('All sessions terminated. Logging you out…');
        setTimeout(() => { logout(); navigate('/login'); }, 1800);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Configure your pharmacy portal preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl text-sm transition-all shadow-sm ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                        }`}
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
                        <h3 className="font-bold text-slate-900">Pharmacist Profile</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Display Name</label>
                            <input value={displayName} onChange={e => setName(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Work Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Default Shift</label>
                            <select value={shift} onChange={e => setShift(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30">
                                {SHIFT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Toggle sections */}
                {TOGGLE_SECTIONS.map(section => (
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
                    <p className="text-sm text-rose-600 mb-4">These actions affect the entire pharmacy system and cannot be undone.</p>
                    {dangerMsg && (
                        <div className="mb-4 px-4 py-2.5 bg-rose-100 border border-rose-300 rounded-xl text-sm font-semibold text-rose-800">
                            ⚠ {dangerMsg}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleClearQueue}
                            className="px-4 py-2 border border-rose-300 text-rose-700 font-bold rounded-xl text-sm hover:bg-rose-100 transition-colors"
                        >
                            Clear Pending Queue
                        </button>
                        <button
                            onClick={handleForceLogout}
                            className="px-4 py-2 border border-rose-300 text-rose-700 font-bold rounded-xl text-sm hover:bg-rose-100 transition-colors"
                        >
                            Force Logout All Sessions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

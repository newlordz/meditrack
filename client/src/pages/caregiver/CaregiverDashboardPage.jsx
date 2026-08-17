import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useApi } from '../../hooks/useApi';
import { getPatients, getMedicationLogs } from '../../api/api';

const STATUS_CFG = {
    done: { dot: 'bg-emerald-500', label: 'Taken' },
    warn: { dot: 'bg-rose-500', label: 'Missed' },
    info: { dot: 'bg-blue-400', label: 'Info' },
};

const ADHERENCE_CFG = {
    'on-track': { badge: 'bg-emerald-100 text-emerald-700', label: 'On Track', bar: 'bg-emerald-500' },
    missed: { badge: 'bg-rose-100 text-rose-700', label: 'Missed Dose', bar: 'bg-rose-500' },
};

const QUICK_ACTIONS = [
    { label: 'My Patients', icon: 'groups', to: '/caregiver/patients', from: 'from-blue-500', to_c: 'to-indigo-600' },
    { label: 'Alerts', icon: 'notifications_active', to: '/caregiver/alerts', from: 'from-rose-500', to_c: 'to-red-600' },
    { label: 'Settings', icon: 'settings', to: '/caregiver/settings', from: 'from-slate-500', to_c: 'to-slate-700' },
];

export default function CaregiverDashboardPage() {
    const { user } = useAuth();
    const [reminders, setReminders] = useState({});
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const { data: rawPatients } = useApi(getPatients);
    const { data: rawLogs } = useApi(getMedicationLogs);

    const patients = (rawPatients || []).map(p => ({
        id: p.id,
        name: p.name,
        initials: p.name.split(' ').map(n => n[0]).join(''),
        condition: p.conditions?.join(', ') || 'Under Care',
        adherence: p.adherence || 85,
        status: p.activeEscalations > 0 ? 'missed' : 'on-track',
        refill: 'Active Prescriptions'
    }));

    const liveActivity = (rawLogs || []).slice(0, 6).map(l => ({
        id: l.id,
        time: new Date(l.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        patient: l.patient,
        event: `${l.action === 'TAKEN' ? 'Logged dose:' : 'Dose alert:'} ${l.drug} (${l.dosage})`,
        type: l.action === 'TAKEN' ? 'done' : 'warn'
    }));

    const sendReminder = (patientId) => {
        setReminders(r => ({ ...r, [patientId]: true }));
        setTimeout(() => setReminders(r => ({ ...r, [patientId]: false })), 2500);
    };

    const avgAdherence = patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.adherence, 0) / patients.length) : 0;
    const missedCount = patients.filter(p => p.status === 'missed').length;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 mb-20 lg:mb-0 space-y-6 animate-fade-in max-w-7xl mx-auto w-full">

                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white rounded-full" />
                        <div className="absolute -bottom-12 -left-6 w-56 h-56 bg-white rounded-full" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{today}</p>
                            <h2 className="text-2xl sm:text-3xl font-black mb-1">Good day, {user?.name || 'Caregiver'}! 👋</h2>
                            <p className="text-white/80 text-sm">
                                {missedCount > 0
                                    ? `⚠️ ${missedCount} patient${missedCount > 1 ? 's have' : ' has'} an active escalation alert.`
                                    : '✅ All monitored patients are currently stable.'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-white/15 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-black">{avgAdherence}%</p>
                                <p className="text-[11px] text-white/70 uppercase tracking-wide">Avg Adherence</p>
                            </div>
                            <div className="bg-white/15 rounded-2xl px-5 py-3 text-center">
                                <p className="text-2xl font-black">{patients.length}</p>
                                <p className="text-[11px] text-white/70 uppercase tracking-wide">Patients</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Patients Monitored', value: patients.length, icon: 'groups', from: 'from-blue-500', to: 'to-indigo-600', sub: 'live database panel' },
                        { label: 'Missed Alerts', value: missedCount, icon: 'medication_liquid', from: 'from-rose-500', to: 'to-red-600', sub: 'require attention' },
                        { label: 'Live Logs', value: rawLogs ? rawLogs.length : 0, icon: 'receipt_long', from: 'from-amber-500', to: 'to-orange-500', sub: 'medication logs' },
                        { label: 'Avg. Adherence', value: `${avgAdherence}%`, icon: 'analytics', from: 'from-emerald-500', to: 'to-teal-600', sub: 'all patients' },
                    ].map(k => (
                        <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.from} ${k.to} flex items-center justify-center mb-3 shadow-sm`}>
                                <span className="material-symbols-outlined text-white text-[20px]">{k.icon}</span>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{k.value}</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{k.label}</p>
                            <p className="text-[11px] text-slate-400">{k.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Patient Overview */}
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Patient Overview</h3>
                            <Link to="/caregiver/patients" className="text-xs text-primary font-bold hover:underline">View All →</Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {patients.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    No patients assigned in database.
                                </div>
                            ) : patients.map(p => {
                                const sent = reminders[p.id];
                                const cfg = ADHERENCE_CFG[p.status] || ADHERENCE_CFG['on-track'];
                                return (
                                    <div key={p.id} className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-4 ${p.status === 'missed' ? 'bg-rose-50/40' : ''}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${p.adherence >= 80 ? 'bg-emerald-500' : p.adherence >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                                                {p.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{p.condition}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${p.adherence}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{p.adherence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                            {p.status === 'missed' && (
                                                <button onClick={() => sendReminder(p.id)}
                                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${sent ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                                    {sent ? '✓ Sent' : 'Remind'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Live Activity Feed */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Today's Live Activity</h3>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                            {liveActivity.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    No live medication logs recorded yet today.
                                </div>
                            ) : liveActivity.map((a, i) => {
                                const cfg = STATUS_CFG[a.type] || STATUS_CFG.info;
                                return (
                                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{a.patient}</p>
                                                <p className="text-[11px] text-slate-400 flex-shrink-0">{a.time}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{a.event}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-3 gap-4">
                    {QUICK_ACTIONS.map(a => (
                        <Link key={a.label} to={a.to}
                            className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all group">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.from} ${a.to_c} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                                <span className="material-symbols-outlined text-white">{a.icon}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{a.label}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

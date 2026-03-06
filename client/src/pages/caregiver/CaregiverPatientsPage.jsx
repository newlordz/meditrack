import { useState } from 'react';
import { CAREGIVER_PATIENTS, TODAY_SCHEDULE } from '../../data/mockData';

const TABS = [
    { key: 'all', label: 'All Patients' },
    { key: 'missed', label: 'Missed Dose' },
    { key: 'refill', label: 'Refill Soon' },
];

const STATUS_CFG = {
    'on-track': { badge: 'bg-emerald-100 text-emerald-700', label: 'On Track', dot: 'bg-emerald-500' },
    missed: { badge: 'bg-rose-100 text-rose-700', label: 'Missed Dose', dot: 'bg-rose-500' },
};

const REFILL_CFG = {
    urgent: 'text-danger font-bold',
    warning: 'text-amber-600 font-semibold',
    normal: 'text-slate-500',
};

export default function CaregiverPatientsPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [viewPatient, setViewPatient] = useState(null);
    const [reminders, setReminders] = useState({});

    const sendReminder = (id) => {
        setReminders(r => ({ ...r, [id]: true }));
        setTimeout(() => setReminders(r => ({ ...r, [id]: false })), 2500);
    };

    const filtered = CAREGIVER_PATIENTS.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q) || p.condition.toLowerCase().includes(q);
        const matchTab =
            activeTab === 'all' ? true :
                activeTab === 'missed' ? p.status === 'missed' :
                    activeTab === 'refill' ? (p.refillStatus === 'urgent' || p.refillStatus === 'warning') :
                        true;
        return matchSearch && matchTab;
    });

    return (
        <div className="flex flex-col min-h-screen">

            {/* Patient Schedule Modal */}
            {viewPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative">
                        <button
                            onClick={() => setViewPatient(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${viewPatient.adherence >= 80 ? 'bg-success' : viewPatient.adherence >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                    {viewPatient.initials}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">{viewPatient.name}</h3>
                                    <p className="text-sm text-slate-500">{viewPatient.condition} · {viewPatient.caregiverRelationship}</p>
                                </div>
                            </div>
                        </div>

                        {/* Adherence bar */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Adherence</span>
                                <span className={`text-sm font-black ${viewPatient.adherence >= 80 ? 'text-success' : viewPatient.adherence >= 50 ? 'text-warning' : 'text-danger'}`}>
                                    {viewPatient.adherence}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${viewPatient.adherence >= 80 ? 'bg-success' : viewPatient.adherence >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                    style={{ width: `${viewPatient.adherence}%` }}
                                />
                            </div>
                        </div>

                        {/* Schedule */}
                        <div className="px-6 py-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Today's Schedule</p>
                            <div className="space-y-2">
                                {(TODAY_SCHEDULE[viewPatient.id] || []).map((s, i) => (
                                    <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${s.taken ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined text-[20px] ${s.taken ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                {s.taken ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{s.drug}</p>
                                                <p className="text-xs text-slate-400">{s.time}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${s.taken ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {s.taken ? 'Taken' : 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setViewPatient(null)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { sendReminder(viewPatient.id); setViewPatient(null); }}
                                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors"
                            >
                                Send Reminder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 px-4 sm:px-6 py-6 mb-20 lg:mb-0 animate-fade-in space-y-5">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Caregiver › <span className="text-primary font-semibold">Patients</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">My Patients</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Monitor schedules, adherence, and refill status.</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or condition…"
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all" />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total Patients', value: CAREGIVER_PATIENTS.length, icon: 'groups', from: 'from-blue-500', to: 'to-indigo-600', sub: 'under care' },
                        { label: 'Missed Dose', value: CAREGIVER_PATIENTS.filter(p => p.status === 'missed').length, icon: 'medication_liquid', from: 'from-rose-500', to: 'to-red-600', sub: 'need attention' },
                        { label: 'Refill Due Soon', value: CAREGIVER_PATIENTS.filter(p => p.refillStatus === 'urgent' || p.refillStatus === 'warning').length, icon: 'autorenew', from: 'from-amber-500', to: 'to-orange-500', sub: 'action required' },
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

                {/* Tabs */}
                <div className="flex gap-0 border-b border-slate-200">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Patient Cards */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">person_search</span>
                        <p className="text-sm font-semibold">No patients found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(p => {
                            const sent = reminders[p.id];
                            const cfg = STATUS_CFG[p.status];
                            const adh = p.adherence;
                            const barColor = adh >= 80 ? 'bg-success' : adh >= 50 ? 'bg-warning' : 'bg-danger';
                            const avatarColor = adh >= 80 ? 'bg-success' : adh >= 50 ? 'bg-warning' : 'bg-danger';
                            return (
                                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${avatarColor}`}>
                                                {p.initials}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                                <p className="text-xs text-slate-400">{p.caregiverRelationship} · {p.condition}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                                    </div>

                                    {/* Adherence */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adherence</span>
                                            <span className={`text-sm font-black ${adh >= 80 ? 'text-success' : adh >= 50 ? 'text-warning' : 'text-danger'}`}>{adh}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${adh}%` }} />
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-1.5 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                                            Next dose: <span className="font-semibold text-slate-800">{p.nextDose}</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${REFILL_CFG[p.refillStatus]}`}>
                                            <span className="material-symbols-outlined text-[16px]">autorenew</span>
                                            {p.refillText}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => setViewPatient(p)}
                                            className="flex-1 py-2 text-sm font-bold text-primary border border-primary/20 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
                                        >
                                            View Schedule
                                        </button>
                                        {p.status === 'missed' && (
                                            <button
                                                onClick={() => sendReminder(p.id)}
                                                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-colors ${sent ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary-dark'}`}
                                            >
                                                {sent ? '✓ Sent' : 'Remind'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

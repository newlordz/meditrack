import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SHARED_PATIENTS } from '../../data/mockData';
import { useAuth } from '../../context/useAuth';
import { useApi } from '../../hooks/useApi';
import { getPatients, getEscalations, getRefillRequests } from '../../api/api';

// STATS moved inside component to use live data

const PENDING_REFILLS = [
    { id: 'RX-041', patient: 'Nana Ama Boateng', drug: 'Atenolol 25mg', urgency: 'urgent', daysLeft: 2 },
    { id: 'RX-039', patient: 'Kwesi Ofori', drug: 'Glibenclamide 5mg', urgency: 'normal', daysLeft: 7 },
    { id: 'RX-038', patient: 'Akua Sarpong', drug: 'Clopidogrel 75mg', urgency: 'urgent', daysLeft: 1 },
];

const RECENT_ACTIVITY = [
    { time: '10:15 AM', event: 'Escalation raised for John Doe', type: 'warn', icon: 'warning' },
    { time: '9:47 AM', event: 'Refill approved — Alice Smith (Lisinopril)', type: 'done', icon: 'check_circle' },
    { time: '9:30 AM', event: 'New patient onboarded: Michael Wilson', type: 'info', icon: 'person_add' },
    { time: '9:12 AM', event: 'Adherence alert: Sarah Green device offline', type: 'warn', icon: 'device_unknown' },
    { time: '8:58 AM', event: 'Refill request — Kwesi Ofori (Glibenclamide)', type: 'info', icon: 'medication' },
    { time: '8:40 AM', event: 'Weekly summary report generated', type: 'done', icon: 'summarize' },
];

const QUICK_LINKS = [
    { label: 'Patient Roster', icon: 'groups', to: '/clinician/roster', desc: 'View all patients', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'Refill Requests', icon: 'medication', to: '/clinician/refills', desc: '8 pending', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { label: 'Escalations', icon: 'notifications_active', to: '/clinician/escalations', desc: '3 active', color: 'text-rose-600 bg-rose-50 border-rose-100' },
    { label: 'Analytics', icon: 'analytics', to: '/clinician/analytics', desc: 'View trends', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
];

const URGENCY_CFG = {
    urgent: { pill: 'bg-rose-100 text-rose-700 border-rose-200', bar: 'bg-rose-400', days: 'text-rose-600' },
    normal: { pill: 'bg-slate-100 text-slate-600 border-slate-200', bar: 'bg-slate-400', days: 'text-slate-500' },
};

const ACTIVITY_CFG = {
    done: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    warn: { dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
    info: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
};

// Adherence buckets for mini chart
const ADHERENCE_DATA = [
    { label: 'Mon', value: 72 },
    { label: 'Tue', value: 68 },
    { label: 'Wed', value: 74 },
    { label: 'Thu', value: 71 },
    { label: 'Fri', value: 78 },
    { label: 'Sat', value: 75 },
    { label: 'Sun', value: 76 },
];

export default function ClinicianDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [approvedRefills, setApprovedRefills] = useState(new Set());

    // Live API Data for Summary Cards
    const { data: rawPatients } = useApi(() => getPatients(user?.userId || user?.id), [user?.userId, user?.id]);
    const { data: rawEscalations } = useApi(() => getEscalations(user?.userId || user?.id), [user?.userId, user?.id]);
    const { data: rawRefills } = useApi(() => getRefillRequests(user?.userId || user?.id), [user?.userId, user?.id]);

    const patientsCount = rawPatients ? rawPatients.length : 0;
    const escalationsCount = rawEscalations ? rawEscalations.filter(e => e.status === 'ACTIVE').length : 0;
    const criticalEscalations = rawEscalations ? rawEscalations.filter(e => e.status === 'ACTIVE' && e.severity === 'CRITICAL').length : 0;
    const refillsCount = rawRefills ? rawRefills.filter(r => r.pharmacyStatus === 'PENDING').length : 0;

    const stats = [
        { label: 'Active Patients', value: patientsCount, icon: 'groups', trend: 'Live', trendUp: true, sub: 'total assigned', gradient: 'from-blue-500 to-blue-600', to: '/clinician/roster' },
        { label: 'Active Alerts', value: escalationsCount, icon: 'notifications_active', trend: `${criticalEscalations} critical`, trendUp: false, sub: 'require action', gradient: 'from-rose-500 to-rose-600', to: '/clinician/escalations' },
        { label: 'Refill Requests', value: refillsCount, icon: 'medication', trend: 'Pending', trendUp: false, sub: 'awaiting approval', gradient: 'from-amber-500 to-orange-500', to: '/clinician/refills' },
        { label: 'Avg. Adherence', value: '76%', icon: 'analytics', trend: '+5%', trendUp: true, sub: 'mock data', gradient: 'from-emerald-500 to-teal-500', to: '/clinician/analytics' },
    ];

    // Live derived lists replacing mock constant arrays
    const highRiskPatients = (rawPatients || [])
        .filter(p => p.activeEscalations > 0)
        .map(p => ({
            ...p,
            adherence: 75, // static mockup for now until logs module is completed
            alertType: 'critical' // all escalations are treated as critical in UI for now
        }))
        .slice(0, 4);

    const livePendingRefills = (rawRefills || [])
        .filter(r => r.pharmacyStatus === 'PENDING')
        .slice(0, 4);

    const approveRefill = (id) => {
        setApprovedRefills(prev => new Set([...prev, id]));
        setTimeout(() => setApprovedRefills(prev => { const s = new Set(prev); s.delete(id); return s; }), 1200);
    };

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const maxBar = Math.max(...ADHERENCE_DATA.map(d => d.value));

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">

            {/* ── Hero Banner ───────────────────────────────────────── */}
            <header className="relative bg-gradient-to-br from-[#1a2f5a] via-[#1d3a6b] to-[#1e4a80] px-6 pt-7 pb-10 overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

                <div className="max-w-7xl mx-auto w-full">
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-1">{today}</p>
                        <h2 className="text-3xl font-black text-white tracking-tight">Clinical Dashboard</h2>
                        <p className="text-blue-200 mt-1">Good morning, <span className="text-white font-bold">{user?.name || 'Doctor'}</span> — here's your daily overview.</p>
                    </div>
                    <Link
                        to="/clinician/escalations"
                        className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 border border-rose-400 text-white font-bold rounded-xl text-sm transition-colors shadow-lg"
                    >
                        <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                        3 Active Escalations
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </Link>
                </div>

                {/* Stat Cards — overlapping the banner bottom */}
                <div className="relative mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(s => (
                        <Link key={s.label} to={s.to} className="block bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}>
                                    <span className="material-symbols-outlined text-white text-[20px]">{s.icon}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                    {s.trend}
                                </span>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{s.label}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
                        </Link>
                    ))}
                </div>
                </div>
            </header>

            <div className="flex-1 w-full px-4 sm:px-6 py-6 mb-20 lg:mb-0 animate-fade-in -mt-2">
                <div className="max-w-7xl mx-auto w-full space-y-6">

                {/* ── Row 2: High-Risk + Activity ──────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* High-Risk Patients */}
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-rose-600 text-[18px]">person_alert</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-sm">High-Risk Patients</h3>
                                    <p className="text-[11px] text-slate-400">{highRiskPatients.length} requiring attention</p>
                                </div>
                            </div>
                            <Link to="/clinician/roster" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                                Full Roster <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {highRiskPatients.map(p => {
                                const adh = p.adherence;
                                const barColor = adh >= 80 ? 'bg-emerald-500' : adh >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                                const avatarColor = adh >= 80 ? 'from-emerald-400 to-emerald-600' : adh >= 50 ? 'from-amber-400 to-orange-500' : 'from-rose-400 to-rose-600';
                                const isCritical = p.alertType === 'critical';
                                return (
                                    <div key={p.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/80 transition-colors gap-4">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-sm`}>
                                                {p.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                                                    {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                                                </div>
                                                <p className="text-xs text-slate-400">{p.pid} · {p.queueStatus === 'completed' ? p.condition : 'Pending Diagnosis'}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${adh}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{adh}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-bold uppercase border px-2.5 py-0.5 rounded-full ${isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {p.alertType}
                                            </span>
                                            <button
                                                onClick={() => navigate('/clinician/roster')}
                                                className="text-[11px] font-bold text-primary hover:text-primary-dark flex items-center gap-0.5"
                                            >
                                                Consult <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 text-[18px]">timeline</span>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-sm">Today's Activity</h3>
                                <p className="text-[11px] text-slate-400">{RECENT_ACTIVITY.length} events logged</p>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                            {RECENT_ACTIVITY.map((a, i) => {
                                const cfg = ACTIVITY_CFG[a.type];
                                return (
                                    <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                                        <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <span className={`material-symbols-outlined text-[14px] ${cfg.text}`}>{a.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 leading-snug">{a.event}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{a.time}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Row 3: Refills + Adherence Chart + Quick Actions ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Pending Refills */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-600 text-[18px]">medication</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-sm">Pending Refills</h3>
                                    <p className="text-[11px] text-slate-400">{livePendingRefills.length} awaiting approval</p>
                                </div>
                            </div>
                            <Link to="/clinician/refills" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                                View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {livePendingRefills.map(rx => {
                                const approved = approvedRefills.has(rx.id);
                                // Simple mock logic to assign 'urgent' or 'routine' based on dummy dates for now
                                const urgency = 'urgent';
                                const daysLeft = 2;
                                const cfg = URGENCY_CFG[urgency];
                                return (
                                    <div key={rx.id} className={`flex items-center justify-between px-6 py-3.5 gap-3 transition-all ${approved ? 'opacity-40 bg-emerald-50' : 'hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-primary text-[16px]">medication</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{rx.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{rx.medication} {rx.dosage}</p>
                                                <p className={`text-[11px] font-bold mt-0.5 ${cfg.days}`}>{daysLeft}d remaining</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full ${cfg.pill}`}>{urgency}</span>
                                            <button
                                                onClick={() => approveRefill(rx.id)}
                                                disabled={approved}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${approved ? 'bg-emerald-400 text-white cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                                            >
                                                {approved ? '✓' : 'Approve'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Weekly Adherence Mini Chart */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">area_chart</span>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-sm">Weekly Adherence Trend</h3>
                                <p className="text-[11px] text-slate-400">Avg across all active patients</p>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            {/* Bar chart */}
                            <div className="flex items-end gap-2 h-24 mb-2">
                                {ADHERENCE_DATA.map((d, i) => {
                                    const heightPct = Math.round((d.value / maxBar) * 100);
                                    const isLast = i === ADHERENCE_DATA.length - 1;
                                    const barCol = d.value >= 75 ? 'bg-emerald-500' : d.value >= 65 ? 'bg-amber-400' : 'bg-rose-400';
                                    return (
                                        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-bold text-slate-600">{d.value}%</span>
                                            <div className="w-full rounded-t-lg relative" style={{ height: '56px' }}>
                                                <div
                                                    className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${isLast ? barCol + ' ring-2 ring-offset-1 ring-emerald-300' : barCol + '/70'}`}
                                                    style={{ height: `${heightPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2">
                                {ADHERENCE_DATA.map(d => (
                                    <div key={d.label} className="flex-1 text-center">
                                        <span className="text-[10px] text-slate-400 font-semibold">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                <span className="material-symbols-outlined text-emerald-600 text-[16px]">trending_up</span>
                                <span className="text-xs font-semibold text-emerald-800">Average up 5% from last week — keep it up!</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-1 flex flex-col gap-3">
                        <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-1">Quick Access</p>
                        {QUICK_LINKS.map(l => (
                            <Link
                                key={l.label}
                                to={l.to}
                                className={`flex items-center gap-3 px-4 py-3 bg-white border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all ${l.color}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{l.icon}</span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{l.label}</p>
                                    <p className="text-[11px] text-slate-400">{l.desc}</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-[16px] ml-auto">chevron_right</span>
                            </Link>
                        ))}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}

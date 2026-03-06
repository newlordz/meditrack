import { useState, useEffect } from 'react';
import { SHARED_PATIENTS } from '../../data/mockData';

const TIMEFRAMES = ['Last 7 Days', 'Last 30 Days', 'Year to Date'];

const MONTHLY_DATA = {
    'Last 7 Days': [
        { label: 'Mon', val: 79 }, { label: 'Tue', val: 82 }, { label: 'Wed', val: 80 },
        { label: 'Thu', val: 85 }, { label: 'Fri', val: 83 }, { label: 'Sat', val: 78 }, { label: 'Sun', val: 81 },
    ],
    'Last 30 Days': [
        { label: 'W1', val: 74 }, { label: 'W2', val: 77 }, { label: 'W3', val: 80 }, { label: 'W4', val: 83 },
    ],
    'Year to Date': [
        { label: 'Oct', val: 72 }, { label: 'Nov', val: 75 }, { label: 'Dec', val: 74 },
        { label: 'Jan', val: 78 }, { label: 'Feb', val: 81 }, { label: 'Mar', val: 84 },
    ],
};

const CONDITION_DIST = [
    { label: 'Type 2 Diabetes', count: 3, color: 'bg-blue-500' },
    { label: 'Hypertension', count: 3, color: 'bg-violet-500' },
    { label: 'Atrial Fibrillation', count: 1, color: 'bg-rose-500' },
    { label: 'Anxiety / Thyroid', count: 1, color: 'bg-amber-500' },
    { label: 'Post-OP / GERD', count: 1, color: 'bg-emerald-500' },
];

function MiniBar({ value, max = 100, color = 'bg-primary' }) {
    return (
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
        </div>
    );
}

export default function AnalyticsPage() {
    const [timeframe, setTimeframe] = useState('Last 30 Days');
    const [showTF, setShowTF] = useState(false);
    const [escalations, setEscalations] = useState([]);

    useEffect(() => {
        const load = () => {
            const saved = localStorage.getItem('meditrack_escalations_v3') || localStorage.getItem('meditrack_escalations_v2');
            if (saved) setEscalations(JSON.parse(saved));
        };
        load();
        window.addEventListener('localStorageUpdated', load);
        return () => window.removeEventListener('localStorageUpdated', load);
    }, []);

    const patients = SHARED_PATIENTS;
    const totalPatients = patients.length;
    const highRisk = patients.filter(p => p.adherence < 50);
    const modRisk = patients.filter(p => p.adherence >= 50 && p.adherence < 80);
    const lowRisk = patients.filter(p => p.adherence >= 80);
    const avgAdherence = Math.round(patients.reduce((s, p) => s + p.adherence, 0) / patients.length);
    const resolvedEsc = escalations.filter(e => e.status === 'dismissed').length;
    const activeEsc = escalations.filter(e => e.status !== 'dismissed').length;

    const chartData = MONTHLY_DATA[timeframe];
    const maxVal = Math.max(...chartData.map(d => d.val));

    const lowPct = Math.round((lowRisk.length / totalPatients) * 100);
    const modPct = Math.round((modRisk.length / totalPatients) * 100);
    const highPct = 100 - lowPct - modPct;
    const p2 = lowPct + modPct;
    const conicGradient = `conic-gradient(#10b981 0% ${lowPct}%, #f59e0b ${lowPct}% ${p2}%, #ef4444 ${p2}% 100%)`;

    const kpis = [
        { label: 'Avg Adherence', value: `${avgAdherence}%`, trend: '+2.1%', up: true, icon: 'trending_up', from: 'from-emerald-500', to: 'to-teal-600', sub: 'across all patients' },
        { label: 'Total Patients', value: totalPatients, trend: '+3', up: true, icon: 'groups', from: 'from-blue-500', to: 'to-indigo-600', sub: 'active panel' },
        { label: 'Active Escalations', value: activeEsc, trend: null, up: false, icon: 'warning', from: 'from-rose-500', to: 'to-red-600', sub: 'need attention' },
        { label: 'Interventions', value: resolvedEsc, trend: null, up: true, icon: 'check_circle', from: 'from-violet-500', to: 'to-purple-600', sub: 'resolved alerts' },
    ];

    return (
        <div className="flex flex-col min-h-screen relative bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Clinician › <span className="text-primary font-semibold">Analytics</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">Clinic Performance</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Live adherence metrics, risk stratification, and intervention outcomes.</p>
                    </div>
                    <div className="relative">
                        <button onClick={() => setShowTF(v => !v)} onBlur={() => setTimeout(() => setShowTF(false), 150)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                            <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                            {timeframe}
                            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                        </button>
                        {showTF && (
                            <div className="absolute top-full mt-1 right-0 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                                {TIMEFRAMES.map(opt => (
                                    <button key={opt} onClick={() => { setTimeframe(opt); setShowTF(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 hover:text-primary ${timeframe === opt ? 'text-primary font-bold' : 'text-slate-700'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map(k => (
                        <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.from} ${k.to} flex items-center justify-center mb-3 shadow-sm`}>
                                <span className="material-symbols-outlined text-white text-[20px]">{k.icon}</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-slate-900">{k.value}</p>
                                {k.trend && (
                                    <span className={`text-xs font-bold mb-1 flex items-center ${k.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        <span className="material-symbols-outlined text-[12px]">{k.up ? 'arrow_upward' : 'arrow_downward'}</span>
                                        {k.trend}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{k.label}</p>
                            <p className="text-[11px] text-slate-400">{k.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-slate-900">Adherence Trend</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{timeframe}</p>
                            </div>
                        </div>
                        <div className="flex items-end justify-between gap-2 h-48 pb-6 border-b border-slate-100 relative">
                            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-slate-400">
                                <span>100%</span><span>75%</span><span>50%</span>
                            </div>
                            {chartData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 ml-8 group cursor-pointer">
                                    <div className="w-full relative rounded-t-lg bg-primary/20 hover:bg-primary transition-colors"
                                        style={{ height: `${(d.val / maxVal) * 85}%` }}>
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {d.val}%
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{d.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            {[
                                { label: 'Peak', val: `${Math.max(...chartData.map(d => d.val))}%`, color: 'text-emerald-600' },
                                { label: 'Average', val: `${Math.round(chartData.reduce((s, d) => s + d.val, 0) / chartData.length)}%`, color: 'text-primary' },
                                { label: 'Low', val: `${Math.min(...chartData.map(d => d.val))}%`, color: 'text-amber-600' },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                                    <p className="text-[11px] text-slate-400">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Donut */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                        <h3 className="font-black text-slate-900 mb-1">Risk Stratification</h3>
                        <p className="text-xs text-slate-400 mb-5">Patient distribution by risk</p>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="w-36 h-36 mx-auto rounded-full mb-6 border-[14px] border-slate-100"
                                style={{ background: conicGradient }}>
                                <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
                                    <span className="text-xs text-slate-400">Total</span>
                                    <span className="text-2xl font-black text-slate-900">{totalPatients}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Low Risk (≥80%)', count: lowRisk.length, color: 'bg-emerald-500', pct: lowPct },
                                    { label: 'Moderate (50–79%)', count: modRisk.length, color: 'bg-amber-400', pct: modPct },
                                    { label: 'High Risk (<50%)', count: highRisk.length, color: 'bg-rose-500', pct: highPct },
                                ].map(r => (
                                    <div key={r.label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${r.color} flex-shrink-0`} />
                                                <span className="text-slate-600 text-xs">{r.label}</span>
                                            </div>
                                            <span className="font-black text-slate-900 text-xs">{r.count} <span className="text-slate-400 font-normal">({r.pct}%)</span></span>
                                        </div>
                                        <MiniBar value={r.pct} color={r.color} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Condition Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-black text-slate-900 mb-1">Condition Breakdown</h3>
                        <p className="text-xs text-slate-400 mb-5">Most prevalent diagnoses in the panel</p>
                        <div className="space-y-4">
                            {CONDITION_DIST.map(c => (
                                <div key={c.label}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-700 font-medium text-xs">{c.label}</span>
                                        <span className="font-bold text-slate-900 text-xs">{c.count} patients</span>
                                    </div>
                                    <MiniBar value={c.count} max={totalPatients} color={c.color} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Patient Adherence Ranking */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-black text-slate-900 mb-1">Adherence Ranking</h3>
                        <p className="text-xs text-slate-400 mb-4">Sorted by score, best to worst</p>
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            {[...patients].sort((a, b) => b.adherence - a.adherence).map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3">
                                    <span className="text-[11px] font-bold text-slate-400 w-4 text-right flex-shrink-0">{i + 1}</span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0
                                        ${p.adherence >= 80 ? 'bg-emerald-500' : p.adherence >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                                        {p.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-xs font-semibold text-slate-800 truncate">{p.name}</span>
                                            <span className={`text-xs font-black tabular-nums flex-shrink-0 ml-2 ${p.adherence >= 80 ? 'text-emerald-600' : p.adherence >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{p.adherence}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${p.adherence >= 80 ? 'bg-emerald-500' : p.adherence >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                                style={{ width: `${p.adherence}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

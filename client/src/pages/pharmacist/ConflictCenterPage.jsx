import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getEscalations, resolveEscalation, dismissEscalation } from '../../api/api';

const SEV_CFG = {
    high: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', border: 'border-l-rose-500', label: 'High Severity', icon: 'emergency', from: 'from-rose-500', to: 'to-red-600' },
    moderate: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', border: 'border-l-amber-400', label: 'Moderate', icon: 'warning', from: 'from-amber-500', to: 'to-orange-500' },
};

const TEMPLATES = [
    'Critical drug interaction detected — please review at your earliest convenience.',
    'Patient safety concern — interaction requires immediate prescriber review.',
    'Recommend an alternative medication — please confirm and update prescription.',
];

export default function ConflictCenterPage() {
    const { data: rawEscalations, refetch } = useApi(getEscalations);
    const [activeTab, setActiveTab] = useState('critical');
    const [searchQuery, setSearchQuery] = useState('');
    const [resolveTarget, setResolveTarget] = useState(null);
    const [resolveNote, setResolveNote] = useState('');
    const [notifyTarget, setNotifyTarget] = useState(null);
    const [notifyMsg, setNotifyMsg] = useState('');
    const [notifyUrgent, setNotifyUrgent] = useState(false);
    const [notifySent, setNotifySent] = useState(new Set());

    const conflicts = (rawEscalations || []).map(e => {
        const patientName = e.patient || e.patientName || 'Patient';
        const docName = e.doctor || e.doctorName || 'Dr. Mensah';
        const trig = e.trigger || e.reason || e.category || 'Clinical Contraindication Alert';
        return {
            id: e.id,
            patient: patientName,
            patientId: e.pid || '#P-001',
            doctor: docName,
            doctorEmail: 'physician@meditrack.health',
            title: trig,
            description: `Active clinical flag for patient ${patientName}. Prescriber intervention required.`,
            action: 'Review concurrent medications and confirm compatibility.',
            severity: e.severity?.toLowerCase() === 'critical' ? 'high' : 'moderate',
            tab: e.severity?.toLowerCase() === 'critical' ? 'critical' : 'moderate',
            status: e.status === 'ACTIVE' ? 'active' : 'resolved',
            timeAgo: new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        };
    });

    const activeCriticalCount = conflicts.filter(c => c.tab === 'critical' && c.status !== 'resolved').length;
    const activeModerateCount = conflicts.filter(c => c.tab === 'moderate' && c.status !== 'resolved').length;
    const resolvedCount = conflicts.filter(c => c.status === 'resolved').length;

    const filtered = conflicts.filter(c => {
        const matchesTab = activeTab === 'all' || (activeTab === 'resolved' ? c.status === 'resolved' : c.tab === activeTab && c.status !== 'resolved');
        const matchesSearch = c.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.doctor.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleResolve = async () => {
        if (!resolveTarget) return;
        try {
            await resolveEscalation(resolveTarget.id);
            refetch();
        } catch(err) {
            console.error(err);
        }
        setResolveTarget(null);
        setResolveNote('');
    };

    const handleSendNotification = () => {
        if (!notifyTarget) return;
        setNotifySent(prev => new Set([...prev, notifyTarget.id]));
        setNotifyTarget(null);
        setNotifyMsg('');
        setNotifyUrgent(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">

            {/* Resolve Modal */}
            {resolveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                            </div>
                            <div>
                                <h3 className="font-black text-emerald-950">Resolve Clinical Conflict</h3>
                                <p className="text-xs text-emerald-700">{resolveTarget.title} · {resolveTarget.patient}</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resolution Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Consulted with prescribing doctor. Regimen confirmed safe."
                                    value={resolveNote}
                                    onChange={e => setResolveNote(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                            <button onClick={() => setResolveTarget(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100">Cancel</button>
                            <button onClick={handleResolve} className="flex-[2] py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700">Confirm & Resolve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notify Modal */}
            {notifyTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 bg-primary/10 border-b border-primary/20 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">send</span>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900">Notify Prescribing Doctor</h3>
                                <p className="text-xs text-slate-500">{notifyTarget.doctor} · {notifyTarget.doctorEmail}</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</label>
                                <textarea
                                    rows={3}
                                    value={notifyMsg}
                                    onChange={e => setNotifyMsg(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Templates</p>
                                {TEMPLATES.map((t, idx) => (
                                    <button key={idx} onClick={() => setNotifyMsg(t)} className="w-full text-left text-xs p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors truncate block">
                                        "{t}"
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                            <button onClick={() => setNotifyTarget(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100">Cancel</button>
                            <button onClick={handleSendNotification} className="flex-[2] py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark">Send Alert</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Pharmacist › <span className="text-primary font-semibold">Conflict Center</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">Clinical Conflict Center</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Live automated clinical interaction checks and doctor alert triage.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Critical Alerts', value: activeCriticalCount, icon: 'emergency', from: 'from-rose-500', to: 'to-red-600', sub: 'high severity' },
                        { label: 'Moderate Alerts', value: activeModerateCount, icon: 'warning', from: 'from-amber-500', to: 'to-orange-500', sub: 'monitor closely' },
                        { label: 'Total Conflicts', value: conflicts.length, icon: 'shield', from: 'from-blue-500', to: 'to-indigo-600', sub: 'all logged' },
                        { label: 'Resolved', value: resolvedCount, icon: 'task_alt', from: 'from-emerald-500', to: 'to-teal-600', sub: 'addressed' },
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

                {/* Tabs & Search */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-4 pt-2 gap-3">
                        <div className="flex -mb-px space-x-2">
                            {[
                                { key: 'critical', label: 'Critical', count: activeCriticalCount },
                                { key: 'moderate', label: 'Moderate', count: activeModerateCount },
                                { key: 'all', label: 'All Active', count: activeCriticalCount + activeModerateCount },
                                { key: 'resolved', label: 'Resolved', count: resolvedCount },
                            ].map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t.label}
                                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{t.count}</span>
                                </button>
                            ))}
                        </div>
                        <div className="relative mb-2 sm:mb-0">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                placeholder="Filter conflicts…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
                            />
                        </div>
                    </div>

                    {/* Conflict List */}
                    <div className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center text-slate-400">
                                <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2 block">verified_user</span>
                                <p className="text-sm font-bold text-slate-700">No Conflict Alerts Detected</p>
                                <p className="text-xs text-slate-400 mt-0.5">All active prescriptions are free of severe clinical interactions.</p>
                            </div>
                        ) : filtered.map(c => {
                            const cfg = SEV_CFG[c.severity] || SEV_CFG.moderate;
                            const isNotified = notifySent.has(c.id);
                            return (
                                <div key={c.id} className={`p-5 border-l-4 ${cfg.border} hover:bg-slate-50/60 transition-colors ${c.status === 'resolved' ? 'opacity-60 bg-slate-50/40' : ''}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${cfg.badge}`}>
                                                    {cfg.label}
                                                </span>
                                                <span className="text-xs font-mono text-slate-400">{c.patientId}</span>
                                                <span className="text-xs font-bold text-slate-900">{c.patient}</span>
                                                <span className="text-xs text-slate-400">· Prescribed by {c.doctor}</span>
                                            </div>
                                            <h4 className="text-base font-black text-slate-900 pt-1">{c.title}</h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                                            <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl mt-2 flex items-start gap-2">
                                                <span className="material-symbols-outlined text-amber-600 text-[18px] flex-shrink-0 mt-0.5">recommend</span>
                                                <p className="text-xs text-amber-900 font-medium leading-relaxed">{c.action}</p>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-end gap-2 flex-shrink-0">
                                            {c.status !== 'resolved' ? (
                                                <>
                                                    <button onClick={() => setResolveTarget(c)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm">
                                                        Resolve
                                                    </button>
                                                    <button onClick={() => { setNotifyTarget(c); setNotifyMsg(TEMPLATES[0]); }}
                                                        className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-colors ${isNotified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                                                        {isNotified ? '✓ Alert Sent' : 'Notify Doctor'}
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                                                    ✓ Resolved
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

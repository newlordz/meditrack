import { useState, useEffect } from 'react';

const MOCK_CONFLICTS = [
    {
        id: 1, severity: 'high', timeAgo: '2 mins ago',
        patient: 'Yaw Darko', patientId: 'P-004',
        doctor: 'Dr. Frimpong', doctorEmail: 'j.frimpong@meditrack.health',
        title: 'Warfarin + Ibuprofen',
        description: 'Concurrent use significantly increases the risk of gastrointestinal bleeding and haemorrhage due to combined anticoagulant and antiplatelet effects. CYP2C9 inhibition documented in multiple clinical studies.',
        action: 'Discontinue Ibuprofen immediately. Consider Paracetamol as pain alternative.',
        interactionId: 'RX-CONTRA-99120-B', tab: 'critical',
    },
    {
        id: 2, severity: 'high', timeAgo: '18 mins ago',
        patient: 'Kofi Mensah', patientId: 'P-002',
        doctor: 'Dr. Mensah', doctorEmail: 'a.mensah@meditrack.health',
        title: 'Metronidazole + Alcohol (Flagged Rx)',
        description: 'Patient has an active Metronidazole prescription. Concurrent alcohol use causes a disulfiram-like reaction: severe nausea, vomiting, flushing, and tachycardia.',
        action: 'Counsel patient on strict alcohol abstinence during and 48h after Metronidazole course.',
        interactionId: 'RX-CONTRA-88271-A', tab: 'critical',
    },
    {
        id: 3, severity: 'high', timeAgo: '1 hr ago',
        patient: 'Kwame Bediako', patientId: 'P-006',
        doctor: 'Dr. Acheampong', doctorEmail: 'k.acheampong@meditrack.health',
        title: 'Codeine + Benzodiazepine',
        description: 'Combined CNS depression from concurrent opioid and benzodiazepine use creates dangerous risk of respiratory depression, sedation, and potentially fatal overdose. FDA Black Box Warning.',
        action: 'URGENT: Do not dispense until prescribing physician confirms necessity and documents risk.',
        interactionId: 'RX-CONTRA-72049-C', tab: 'critical',
    },
    {
        id: 4, severity: 'moderate', timeAgo: '1 hr ago',
        patient: 'Ama Johanson', patientId: 'P-001',
        doctor: 'Dr. Mensah', doctorEmail: 'a.mensah@meditrack.health',
        title: 'Lisinopril + Spironolactone',
        description: 'Risk of hyperkalemia (elevated serum potassium). Both agents reduce potassium excretion.',
        action: 'Schedule follow-up metabolic panel within 7 days. Monitor K⁺ levels.',
        interactionId: 'RX-MOD-44218-A', tab: 'moderate',
    },
    {
        id: 5, severity: 'moderate', timeAgo: '3 hrs ago',
        patient: 'Abena Owusu', patientId: 'P-003',
        doctor: 'Dr. Acheampong', doctorEmail: 'k.acheampong@meditrack.health',
        title: 'Omeprazole + Clopidogrel',
        description: 'Omeprazole significantly reduces the antiplatelet effect of Clopidogrel by inhibiting CYP2C19 activation.',
        action: 'Consider switching to Pantoprazole which has minimal CYP2C19 interaction.',
        interactionId: 'RX-MOD-31097-B', tab: 'moderate',
    },
    {
        id: 6, severity: 'moderate', timeAgo: 'Yesterday',
        patient: 'Efua Asante', patientId: 'P-005',
        doctor: 'Dr. Frimpong', doctorEmail: 'j.frimpong@meditrack.health',
        title: 'Levothyroxine + Calcium Supplement',
        description: 'Calcium can bind Levothyroxine in the gut and significantly reduce its absorption, leading to hypothyroid symptoms.',
        action: 'Advise patient to take Levothyroxine at least 4 hours apart from any calcium supplements.',
        interactionId: 'RX-MOD-19203-D', tab: 'moderate',
    },
];

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
    const [activeTab, setActiveTab] = useState('critical');
    const [searchQuery, setSearchQuery] = useState('');
    const [resolveTarget, setResolveTarget] = useState(null);
    const [resolveNote, setResolveNote] = useState('');
    const [notifyTarget, setNotifyTarget] = useState(null);
    const [notifyMsg, setNotifyMsg] = useState('');
    const [notifyUrgent, setNotifyUrgent] = useState(false);
    const [notifySent, setNotifySent] = useState(new Set());

    const [conflicts, setConflicts] = useState(() => {
        const saved = localStorage.getItem('meditrack_conflicts');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return MOCK_CONFLICTS.map(c => {
                    const s = parsed.find(p => p.id === c.id);
                    return s ? { ...c, status: s.status, resolveNote: s.resolveNote } : { ...c, status: 'active' };
                });
            } catch { /* fall through */ }
        }
        return MOCK_CONFLICTS.map(c => ({ ...c, status: 'active' }));
    });

    useEffect(() => {
        localStorage.setItem('meditrack_conflicts', JSON.stringify(conflicts));
        window.dispatchEvent(new Event('localStorageUpdated'));
    }, [conflicts]);

    const activeCriticalCount = conflicts.filter(c => c.tab === 'critical' && c.status !== 'resolved').length;
    const activeModerateCount = conflicts.filter(c => c.tab === 'moderate' && c.status !== 'resolved').length;
    const resolvedCount = conflicts.filter(c => c.status === 'resolved').length;
    const totalActive = activeCriticalCount + activeModerateCount;

    const TABS = [
        { key: 'critical', label: 'Critical', count: activeCriticalCount },
        { key: 'moderate', label: 'Moderate', count: activeModerateCount },
        { key: 'resolved', label: 'Resolved', count: resolvedCount },
    ];

    const filteredConflicts = conflicts.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
            || c.patient.toLowerCase().includes(searchQuery.toLowerCase())
            || c.interactionId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchTab = activeTab === 'resolved' ? c.status === 'resolved' : (c.tab === activeTab && c.status !== 'resolved');
        return matchSearch && matchTab;
    });

    const handleResolve = () => {
        if (!resolveTarget || !resolveNote.trim()) return;
        setConflicts(prev => prev.map(c => c.id === resolveTarget.id ? { ...c, status: 'resolved', resolveNote: resolveNote.trim() } : c));
        setResolveTarget(null);
        setResolveNote('');
    };

    const openNotify = (conflict) => {
        setNotifyTarget(conflict);
        setNotifyMsg(`Dear ${conflict.doctor},\n\nA ${conflict.severity}-severity drug interaction was detected for patient ${conflict.patient} (${conflict.patientId}):\n\n${conflict.title}\n\n${conflict.description}\n\nRecommended action: ${conflict.action}\n\nInteraction ID: ${conflict.interactionId}\n\n— Pharmacy Team`);
        setNotifyUrgent(conflict.severity === 'high');
    };

    const sendNotification = () => {
        setNotifySent(prev => new Set([...prev, notifyTarget.id]));
        setNotifyTarget(null);
    };

    return (
        <div className="flex flex-col min-h-screen relative bg-slate-50">

            {/* Resolve Modal */}
            {resolveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 border-b border-emerald-100 rounded-t-2xl">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-600">task_alt</span>
                            </div>
                            <div>
                                <p className="font-black text-emerald-900">Resolve Conflict</p>
                                <p className="text-xs text-emerald-700">{resolveTarget.title}</p>
                            </div>
                            <button onClick={() => setResolveTarget(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Resolution Note *</label>
                                <textarea
                                    value={resolveNote}
                                    onChange={e => setResolveNote(e.target.value)}
                                    rows={4}
                                    placeholder="Document the action taken to resolve this interaction…"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button onClick={() => setResolveTarget(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                            <button onClick={handleResolve} disabled={!resolveNote.trim()}
                                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">task_alt</span> Mark Resolved
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notify Doctor Modal */}
            {notifyTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
                        <div className="flex items-center gap-3 px-6 py-4 bg-blue-50 border-b border-blue-100 rounded-t-2xl flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600">send</span>
                            </div>
                            <div>
                                <p className="font-black text-blue-900">Notify Doctor</p>
                                <p className="text-xs text-blue-600">{notifyTarget.doctor} · {notifyTarget.doctorEmail}</p>
                            </div>
                            <button onClick={() => setNotifyTarget(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${notifyTarget.severity === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                <span className="material-symbols-outlined text-[18px]">warning</span>
                                {SEV_CFG[notifyTarget.severity].label} interaction detected
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Templates</p>
                                <div className="flex flex-wrap gap-2">
                                    {TEMPLATES.map((t, i) => (
                                        <button key={i} onClick={() => setNotifyMsg(t)}
                                            className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-left">
                                            {`Template ${i + 1}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Message</label>
                                <textarea value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)} rows={8}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                            </div>
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={notifyUrgent} onChange={e => setNotifyUrgent(e.target.checked)} className="accent-rose-600 w-4 h-4" />
                                <span className="text-sm font-semibold text-slate-800">Mark as URGENT — request immediate callback</span>
                            </label>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex-shrink-0">
                            <button onClick={() => setNotifyTarget(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                            <button onClick={sendNotification} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">send</span> Send to {notifyTarget.doctor.split(' ')[1]}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Content */}
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Pharmacy › <span className="text-primary font-semibold">Conflicts</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">Drug Interaction Center</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Real-time cross-interaction screening for all active prescriptions.</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Drug name, patient, or ID…"
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all" />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Active', value: totalActive, icon: 'notifications_active', from: 'from-slate-600', to: 'to-slate-800', sub: 'unresolved conflicts' },
                        { label: 'Critical', value: activeCriticalCount, icon: 'emergency', from: 'from-rose-500', to: 'to-red-600', sub: 'high severity' },
                        { label: 'Moderate', value: activeModerateCount, icon: 'warning', from: 'from-amber-500', to: 'to-orange-500', sub: 'requires monitoring' },
                        { label: 'Resolved', value: resolvedCount, icon: 'task_alt', from: 'from-emerald-500', to: 'to-teal-600', sub: 'actions taken' },
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
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap
                                ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            {tab.label}
                            <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Conflict Cards */}
                <div className="space-y-4">
                    {filteredConflicts.length === 0 && (
                        <div className="text-center py-14 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-3 block">check_circle</span>
                            <p className="text-sm font-semibold">No conflicts in this category.</p>
                        </div>
                    )}
                    {filteredConflicts.map((conflict, i) => {
                        const cfg = SEV_CFG[conflict.severity];
                        const alreadyNotified = notifySent.has(conflict.id);
                        return (
                            <div key={conflict.id}
                                className={`bg-white border border-slate-200 border-l-4 ${cfg.border} rounded-xl shadow-sm overflow-hidden animate-fade-in`}
                                style={{ animationDelay: `${i * 0.06}s` }}>
                                <div className="p-5 sm:p-6">
                                    {/* Badge Row */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${cfg.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${conflict.severity === 'high' ? 'bg-rose-500 animate-pulse' : cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        <span className="text-xs text-slate-400">Detected {conflict.timeAgo}</span>
                                        {conflict.status === 'resolved' && (
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Resolved</span>
                                        )}
                                        {alreadyNotified && (
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">📨 Doctor Notified</span>
                                        )}
                                    </div>

                                    {/* Title & Participants */}
                                    <h3 className="text-lg font-black text-slate-900 mb-0.5">{conflict.title}</h3>
                                    <p className="text-xs text-slate-400 mb-3">
                                        Patient: <span className="font-semibold text-slate-600">{conflict.patient}</span> ({conflict.patientId})
                                        &nbsp;·&nbsp; Prescriber: <span className="font-semibold text-slate-600">{conflict.doctor}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{conflict.description}</p>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Recommended Action</p>
                                            <p className={`text-sm font-bold leading-snug ${conflict.severity === 'high' ? 'text-rose-700' : 'text-amber-700'}`}>{conflict.action}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Interaction ID</p>
                                            <p className="text-sm font-mono font-medium text-slate-700">{conflict.interactionId}</p>
                                            <p className="text-[11px] text-slate-400 mt-1">Cross-referenced against WHO & MIMS formulary</p>
                                        </div>
                                    </div>

                                    {conflict.resolveNote && (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4">
                                            <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1">Resolution Note</p>
                                            <p className="text-sm text-emerald-800">{conflict.resolveNote}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {conflict.status !== 'resolved' && (
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => openNotify(conflict)} disabled={alreadyNotified}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${alreadyNotified
                                                    ? 'border-blue-200 bg-blue-50 text-blue-400 cursor-not-allowed'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'}`}>
                                                <span className="material-symbols-outlined text-[16px] text-blue-500">send</span>
                                                {alreadyNotified ? 'Notified ✓' : 'Notify Doctor'}
                                            </button>
                                            <button onClick={() => { setResolveTarget(conflict); setResolveNote(''); }}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">task_alt</span> Resolve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';

const TABS = [
    { key: 'active', label: 'Active Alerts' },
    { key: 'dismissed', label: 'Resolved' },
];

const INITIAL_ESCALATIONS = [
    {
        id: 1, patient: 'John Doe', pid: '#88291', initials: 'JD',
        trigger: 'Consecutive Missed Doses',
        severity: 'critical',
        category: 'Adherence',
        details: 'Patient missed 4 consecutive doses of Metformin 500mg. Blood sugar logs indicate elevated fasting levels — potential hyperglycaemia risk.',
        timeAgo: '10 mins ago', status: 'active',
        vitals: { bp: '138/85', hr: '72 bpm', sugar: '145 mg/dL (high)' },
        meds: ['Metformin 500mg (BID)', 'Lisinopril 10mg'],
        resolveNote: '',
    },
    {
        id: 2, patient: 'Sarah Green', pid: '#55209', initials: 'SG',
        trigger: 'Smart Dispenser Offline',
        severity: 'high',
        category: 'Device',
        details: 'Smart dispenser has been offline for >48 hours. Post-OP protocol requires daily verification — patient is non-compliant.',
        timeAgo: '1 hour ago', status: 'active',
        vitals: { bp: '110/70', hr: '88 bpm', sugar: 'N/A' },
        meds: ['Omeprazole 20mg', 'Tramadol 50mg PRN'],
        resolveNote: '',
    },
    {
        id: 3, patient: 'Robert Brown', pid: '#77410', initials: 'RB',
        trigger: 'Drug Interaction Flag',
        severity: 'high',
        category: 'Pharmacy',
        details: 'Pharmacist flagged concurrent prescription of Ibuprofen (NSAID) with previously prescribed Warfarin — increased bleeding risk.',
        timeAgo: '3 hours ago', status: 'active',
        vitals: { bp: '122/78', hr: '68 bpm', sugar: 'N/A' },
        meds: ['Warfarin 5mg', 'Atorvastatin 20mg'],
        resolveNote: '',
    },
    {
        id: 4, patient: 'Yaw Darko', pid: '#66311', initials: 'YD',
        trigger: 'Irregular Dosing Pattern',
        severity: 'medium',
        category: 'Adherence',
        details: 'Patient with Atrial Fibrillation is taking Warfarin at inconsistent times. INR levels may be affected — review needed.',
        timeAgo: '5 hours ago', status: 'active',
        vitals: { bp: '134/82', hr: '94 bpm', sugar: 'N/A' },
        meds: ['Warfarin 5mg', 'Bisoprolol 5mg'],
        resolveNote: '',
    },
];

const SEVERITY_MAP = {
    critical: { label: 'Critical', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-500', dot: 'bg-rose-500', icon: 'warning', iconColor: 'text-rose-600' },
    high: { label: 'High', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-400', dot: 'bg-orange-500', icon: 'flag', iconColor: 'text-orange-600' },
    medium: { label: 'Medium', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400', dot: 'bg-amber-400', icon: 'info', iconColor: 'text-amber-600' },
    dismissed: { label: 'Resolved', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400', dot: 'bg-emerald-500', icon: 'check_circle', iconColor: 'text-emerald-600' },
};

export default function EscalationsPage() {
    const [activeTab, setActiveTab] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [escalations, setEscalations] = useState(() => {
        const saved = localStorage.getItem('meditrack_escalations_v3');
        return saved ? JSON.parse(saved) : INITIAL_ESCALATIONS;
    });
    const [modal, setModal] = useState(null); // { type: 'chart' | 'contact' | 'resolve', esc }
    const [resolveNote, setResolveNote] = useState('');
    const [msgText, setMsgText] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        localStorage.setItem('meditrack_escalations_v3', JSON.stringify(escalations));
        window.dispatchEvent(new Event('localStorageUpdated'));
    }, [escalations]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openModal = (type, esc) => {
        setModal({ type, esc });
        setResolveNote('');
        setMsgText(`Hi ${esc.patient.split(' ')[0]},\n\nThis is Dr. Sarah Chen's office. We noticed an alert: "${esc.trigger}".\n\nPlease reply or call the office at your earliest convenience.\n\nRegards,\nDr. Sarah Chen`);
    };

    const closeModal = () => setModal(null);

    const handleResolve = (id, note) => {
        setEscalations(prev => prev.map(e => e.id === id ? { ...e, status: 'dismissed', resolveNote: note, resolvedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) } : e));
        showToast('Alert resolved successfully');
        closeModal();
    };

    const handleRestore = (id) => {
        setEscalations(prev => prev.map(e => e.id === id ? { ...e, status: 'active', resolveNote: '', resolvedAt: null } : e));
        showToast('Alert restored to active', 'warning');
    };

    const handleMarkAllResolved = () => {
        setEscalations(prev => prev.map(e => e.status === 'active' ? { ...e, status: 'dismissed', resolvedAt: 'Just now' } : e));
        showToast('All active alerts resolved');
    };

    const handleSendMessage = (id) => {
        handleResolve(id, 'Outreach message sent to patient.');
    };

    const activeEscalations = escalations.filter(e => e.status === 'active');
    const dismissedEscalations = escalations.filter(e => e.status === 'dismissed');
    const criticalCount = activeEscalations.filter(e => e.severity === 'critical').length;
    const highCount = activeEscalations.filter(e => e.severity === 'high').length;

    const displayList = (activeTab === 'active' ? activeEscalations : dismissedEscalations)
        .filter(e => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return e.patient.toLowerCase().includes(q) || e.trigger.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
        })
        .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2 };
            return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
        });

    return (
        <div className="flex flex-col min-h-screen relative bg-slate-50">

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-fade-in
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">{toast.type === 'success' ? 'check_circle' : 'info'}</span>
                    {toast.msg}
                </div>
            )}

            {/* ── Modals ── */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                    ${modal.type === 'chart' ? 'bg-primary/10' : modal.type === 'contact' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                                    <span className={`material-symbols-outlined
                                        ${modal.type === 'chart' ? 'text-primary' : modal.type === 'contact' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                        {modal.type === 'chart' ? 'folder_shared' : modal.type === 'contact' ? 'chat' : 'check_circle'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">
                                        {modal.type === 'chart' ? `Chart: ${modal.esc.patient}` : modal.type === 'contact' ? 'Secure Message' : 'Resolve Alert'}
                                    </h3>
                                    <p className="text-xs text-slate-500">{modal.esc.trigger} · {modal.esc.pid}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Chart View */}
                            {modal.type === 'chart' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Vitals</p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span className="text-slate-600">Blood Pressure</span><span className="font-bold">{modal.esc.vitals.bp}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-600">Heart Rate</span><span className="font-bold">{modal.esc.vitals.hr}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-600">Blood Sugar</span>
                                                    <span className={`font-bold ${modal.esc.vitals.sugar.includes('high') ? 'text-rose-600' : 'text-slate-900'}`}>{modal.esc.vitals.sugar}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Active Medications</p>
                                            <ul className="space-y-2">
                                                {modal.esc.meds.map((m, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />{m}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                                        <p className="text-xs font-bold text-rose-700 mb-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[15px]">warning</span> Alert Detail
                                        </p>
                                        <p className="text-sm text-slate-700">{modal.esc.details}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                                        <span className="material-symbols-outlined text-3xl text-indigo-300 mb-2 block animate-pulse">sync</span>
                                        <p className="text-sm font-bold text-slate-700 mb-1">Simulated EMR Integration</p>
                                        <p className="text-xs text-slate-500">In production, bridges to Epic/Cerner via HL7 FHIR for {modal.esc.patient}&apos;s full history.</p>
                                    </div>
                                </>
                            )}

                            {/* Contact / Message */}
                            {modal.type === 'contact' && (
                                <>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Template: Missed Dose', 'Template: Device Offline', 'Template: Drug Interaction'].map(t => (
                                            <button key={t} className="text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors">{t}</button>
                                        ))}
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={msgText}
                                        onChange={e => setMsgText(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                    />
                                </>
                            )}

                            {/* Resolve */}
                            {modal.type === 'resolve' && (
                                <>
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                                        <span className="material-symbols-outlined text-amber-600 flex-shrink-0">info</span>
                                        <p className="text-sm text-amber-800">{modal.esc.details}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Resolution Note *</label>
                                        <textarea
                                            rows={4}
                                            value={resolveNote}
                                            onChange={e => setResolveNote(e.target.value)}
                                            placeholder="e.g. Called patient, adherence counselling provided. Follow-up scheduled."
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button onClick={closeModal} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 text-sm transition-colors">
                                Cancel
                            </button>
                            {modal.type === 'chart' && (
                                <button onClick={() => openModal('resolve', modal.esc)} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-sm transition-colors">
                                    Resolve Alert
                                </button>
                            )}
                            {modal.type === 'contact' && (
                                <button onClick={() => handleSendMessage(modal.esc.id)} className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark text-sm transition-colors flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">send</span> Send & Resolve
                                </button>
                            )}
                            {modal.type === 'resolve' && (
                                <button
                                    onClick={() => handleResolve(modal.esc.id, resolveNote)}
                                    disabled={!resolveNote.trim()}
                                    className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Confirm Resolution
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page Content ── */}
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6">

                {/* Title Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Clinician › <span className="text-danger font-semibold">Triage</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-danger text-[26px]">error</span>
                            Escalations
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">High-priority alerts sorted by severity. Resolve all before end of shift.</p>
                    </div>
                    <button
                        onClick={handleMarkAllResolved}
                        disabled={activeEscalations.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[18px]">done_all</span>
                        Resolve All Active
                    </button>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Alerts', value: activeEscalations.length, icon: 'notifications_active', from: 'from-rose-500', to: 'to-red-600', sub: 'require action' },
                        { label: 'Critical', value: criticalCount, icon: 'warning', from: 'from-rose-600', to: 'to-red-700', sub: 'immediate response' },
                        { label: 'High Priority', value: highCount, icon: 'flag', from: 'from-orange-500', to: 'to-amber-500', sub: 'review by EOD' },
                        { label: 'Resolved', value: dismissedEscalations.length, icon: 'check_circle', from: 'from-emerald-500', to: 'to-teal-500', sub: 'this session' },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center mb-3 shadow-sm`}>
                                <span className="material-symbols-outlined text-white text-[18px]">{s.icon}</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{s.label}</p>
                            <p className="text-[11px] text-slate-400">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Search + Tabs + List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
                        <div className="relative flex-1 max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search patient, trigger, category..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-1">
                            {TABS.map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors
                                        ${activeTab === t.key
                                            ? t.key === 'active' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                            : 'text-slate-500 hover:bg-slate-100'}`}>
                                    {t.label}
                                    <span className="ml-1.5 text-[11px]">
                                        ({t.key === 'active' ? activeEscalations.length : dismissedEscalations.length})
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {displayList.length === 0 ? (
                            <div className="py-12 text-center">
                                <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">
                                    {activeTab === 'active' ? 'check_circle' : 'inbox'}
                                </span>
                                <p className="font-bold text-slate-500">
                                    {activeTab === 'active' ? 'All clear — no active alerts!' : 'No resolved alerts yet.'}
                                </p>
                            </div>
                        ) : displayList.map(esc => {
                            const sev = esc.status === 'dismissed' ? SEVERITY_MAP.dismissed : SEVERITY_MAP[esc.severity] || SEVERITY_MAP.medium;
                            return (
                                <div key={esc.id} className={`flex flex-col sm:flex-row gap-4 p-5 hover:bg-slate-50/60 transition-colors border-l-4 ${sev.border}`}>
                                    {/* Avatar */}
                                    <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm text-white
                                        bg-gradient-to-br ${esc.severity === 'critical' ? 'from-rose-500 to-red-600' : esc.severity === 'high' ? 'from-orange-500 to-amber-500' : 'from-amber-400 to-yellow-500'}`}>
                                        {esc.initials}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${sev.bg} ${sev.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot} ${esc.status === 'active' && esc.severity === 'critical' ? 'animate-pulse' : ''}`} />
                                                {sev.label}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{esc.category}</span>
                                            <span className="text-[11px] text-slate-400 ml-auto">{esc.resolvedAt ? `Resolved ${esc.resolvedAt}` : esc.timeAgo}</span>
                                        </div>
                                        <h3 className="font-black text-slate-900 text-sm">{esc.trigger}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{esc.patient} <span className="text-slate-300">·</span> {esc.pid}</p>
                                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{esc.details}</p>

                                        {esc.resolveNote && (
                                            <p className="mt-2 text-xs italic text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                                                ✓ {esc.resolveNote}
                                            </p>
                                        )}

                                        {esc.status === 'active' && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <button onClick={() => openModal('chart', esc)}
                                                    className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
                                                    Review Chart
                                                </button>
                                                <button onClick={() => openModal('contact', esc)}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                                                    Contact Patient
                                                </button>
                                                <button onClick={() => openModal('resolve', esc)}
                                                    className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors">
                                                    Resolve
                                                </button>
                                            </div>
                                        )}
                                        {esc.status === 'dismissed' && (
                                            <button onClick={() => handleRestore(esc.id)}
                                                className="mt-3 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                                                Reopen Alert
                                            </button>
                                        )}
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

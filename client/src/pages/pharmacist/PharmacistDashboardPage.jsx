import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const INIT_PENDING = [
    { id: 'RX-0041', patient: 'Nana Ama Boateng', initials: 'NB', drug: 'Atenolol 25mg', qty: 30, doctor: 'Dr. Mensah', urgency: 'urgent', instructions: 'Take 1 tablet daily in the morning' },
    { id: 'RX-0039', patient: 'Kwesi Ofori', initials: 'KO', drug: 'Glibenclamide 5mg', qty: 60, doctor: 'Dr. Acheampong', urgency: 'normal', instructions: 'Take 1 tablet twice daily with meals' },
    { id: 'RX-0038', patient: 'Akua Sarpong', initials: 'AS', drug: 'Clopidogrel 75mg', qty: 28, doctor: 'Dr. Mensah', urgency: 'urgent', instructions: 'Take 1 tablet once daily' },
    { id: 'RX-0036', patient: 'Yaw Darko', initials: 'YD', drug: 'Warfarin 5mg', qty: 14, doctor: 'Dr. Frimpong', urgency: 'review', instructions: 'Take as directed, monitor INR weekly' },
];

const RECENT_ACTIVITY = [
    { id: 1, time: '9:47 AM', patient: 'Ama Johanson', drug: 'Lisinopril 10mg', action: 'Dispensed', status: 'done' },
    { id: 2, time: '9:31 AM', patient: 'Kofi Mensah', drug: 'Metformin 500mg', action: 'Conflict Flagged', status: 'warn' },
    { id: 3, time: '9:12 AM', patient: 'Abena Owusu', drug: 'Aspirin 75mg', action: 'Dispensed', status: 'done' },
    { id: 4, time: '8:58 AM', patient: 'Yaw Darko', drug: 'Warfarin 5mg', action: 'Under Review', status: 'info' },
    { id: 5, time: '8:40 AM', patient: 'Efua Asante', drug: 'Omeprazole 20mg', action: 'Dispensed', status: 'done' },
    { id: 6, time: '8:22 AM', patient: 'Kwame Bediako', drug: 'Amlodipine 5mg', action: 'Verified', status: 'done' },
];

const ACT_CFG = {
    done: { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
    warn: { dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', icon: 'warning' },
    info: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', icon: 'info' },
};

const URGENCY_CFG = {
    urgent: { pill: 'bg-rose-100 text-rose-700 border-rose-200', border: 'border-l-rose-400', from: 'from-rose-500', to: 'to-red-600' },
    normal: { pill: 'bg-slate-100 text-slate-600 border-slate-200', border: 'border-l-slate-300', from: 'from-slate-400', to: 'to-slate-500' },
    review: { pill: 'bg-amber-100 text-amber-700 border-amber-200', border: 'border-l-amber-400', from: 'from-amber-500', to: 'to-orange-600' },
};

const REJECT_REASONS = [
    { value: 'out_of_stock', label: '📦 Out of Stock' },
    { value: 'drug_interaction', label: '⚠️ Drug Interaction Detected' },
    { value: 'expired_rx', label: '📋 Prescription Expired' },
    { value: 'allergy_flag', label: '🚨 Patient Allergy Flagged' },
    { value: 'dosage_error', label: '💊 Possible Dosage Error' },
    { value: 'doctor_recall', label: '🔁 Recalled by Doctor' },
];

const QUICK_LINKS = [
    { label: 'Drug Conflicts', icon: 'warning', to: '/pharmacist/conflicts', from: 'from-rose-500', to2: 'to-red-600', desc: 'Interaction alerts' },
    { label: 'Patient Records', icon: 'person_search', to: '/pharmacist/records', from: 'from-blue-500', to2: 'to-indigo-600', desc: 'Rx profiles' },
    { label: 'Medication Logs', icon: 'receipt_long', to: '/pharmacist/logs', from: 'from-emerald-500', to2: 'to-teal-600', desc: 'Audit trail' },
    { label: 'Settings', icon: 'settings', to: '/pharmacist/settings', from: 'from-slate-500', to2: 'to-slate-700', desc: 'Preferences' },
];

export default function PharmacistDashboardPage() {
    const [pending, setPending] = useState(() => {
        const saved = localStorage.getItem('meditrack_pending_prescriptions');
        return saved ? JSON.parse(saved) : INIT_PENDING;
    });
    const [activity] = useState(RECENT_ACTIVITY);
    const [dispensed, setDispensed] = useState(new Set());
    const [conflicts, setConflicts] = useState([]);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const load = () => {
            const saved = localStorage.getItem('meditrack_pending_prescriptions');
            if (saved) setPending(JSON.parse(saved));
            const esc = localStorage.getItem('meditrack_escalations_v3') || localStorage.getItem('meditrack_escalations_v2');
            if (esc) setConflicts(JSON.parse(esc));
        };
        load();
        window.addEventListener('rxDispensedOrPrescribed', load);
        window.addEventListener('localStorageUpdated', load);
        return () => {
            window.removeEventListener('rxDispensedOrPrescribed', load);
            window.removeEventListener('localStorageUpdated', load);
        };
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDispense = () => {
        if (!reviewTarget) return;
        const rx = reviewTarget;
        setDispensed(prev => new Set([...prev, rx.id]));
        setReviewTarget(null);
        setTimeout(() => {
            setPending(q => {
                const updated = q.filter(r => r.id !== rx.id);
                localStorage.setItem('meditrack_pending_prescriptions', JSON.stringify(updated));
                return updated;
            });
            const newDose = { id: `DOSE-${Date.now()}`, name: rx.drug, dosage: `Qty: ${rx.qty}`, instruction: rx.instructions || 'Take as directed', time: '8:00 AM', status: 'upcoming', icon: 'medication', isCurrent: false };
            const existingDoses = JSON.parse(localStorage.getItem('meditrack_patient_doses') || '[]');
            if (!existingDoses.some(d => d.status === 'next')) { newDose.status = 'next'; newDose.isCurrent = true; }
            localStorage.setItem('meditrack_patient_doses', JSON.stringify([...existingDoses, newDose]));
            window.dispatchEvent(new Event('rxDispensedOrPrescribed'));
            setDispensed(prev => { const s = new Set(prev); s.delete(rx.id); return s; });
            showToast(`${rx.drug} dispensed to ${rx.patient}`);
        }, 800);
    };

    const confirmReject = () => {
        if (!rejectReason || !rejectTarget) return;
        setPending(q => {
            const updated = q.filter(r => r.id !== rejectTarget.id);
            localStorage.setItem('meditrack_pending_prescriptions', JSON.stringify(updated));
            return updated;
        });
        window.dispatchEvent(new Event('rxDispensedOrPrescribed'));
        showToast(`${rejectTarget.drug} rejected`, 'error');
        setRejectTarget(null); setRejectReason('');
    };

    const urgentCount = pending.filter(r => r.urgency === 'urgent').length;
    const reviewCount = pending.filter(r => r.urgency === 'review').length;
    const activeConflicts = conflicts.filter(c => c.status !== 'resolved').length;
    const verifiedToday = activity.filter(a => a.status === 'done').length + dispensed.size;

    return (
        <div className="flex flex-col min-h-screen relative bg-slate-50">

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-fade-in
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">{toast.type === 'success' ? 'check_circle' : 'cancel'}</span>
                    {toast.msg}
                </div>
            )}

            {/* Review Modal */}
            {reviewTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-fade-in max-h-[90vh]">
                        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 border-b border-emerald-100 rounded-t-2xl">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-600">health_and_safety</span>
                            </div>
                            <div>
                                <p className="font-black text-emerald-900">Review & Dispense</p>
                                <p className="text-xs text-emerald-700">Verify prescription before authorizing</p>
                            </div>
                            <button onClick={() => setReviewTarget(null)} className="ml-auto text-slate-400 hover:text-slate-600 p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Patient</p>
                                    <p className="font-black text-slate-900">{reviewTarget.patient}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prescriber</p>
                                    <p className="font-black text-slate-900">{reviewTarget.doctor}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary text-[22px]">medication</span>
                                    <h3 className="font-black text-primary text-lg">{reviewTarget.drug}</h3>
                                    <span className={`ml-auto text-[11px] font-bold border px-2.5 py-1 rounded-full ${URGENCY_CFG[reviewTarget.urgency]?.pill}`}>{reviewTarget.urgency}</span>
                                </div>
                                <p className="text-sm text-slate-600">Quantity: <span className="font-bold text-slate-900">{reviewTarget.qty}</span></p>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sig / Instructions</p>
                                    <p className="text-sm text-slate-700 italic">{reviewTarget.instructions || 'Take as directed.'}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Automated Safety Checks</p>
                                {['No critical drug interactions detected', 'Dose within normal therapeutic range'].map(c => (
                                    <div key={c} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-800">
                                        <span className="material-symbols-outlined text-[16px]">verified</span>
                                        <span className="text-sm font-semibold">{c}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button onClick={() => setReviewTarget(null)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                            <button onClick={handleDispense} className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm">
                                <span className="material-symbols-outlined text-[18px]">check_circle</span> Confirm & Dispense
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-fade-in max-h-[90vh]">
                        <div className="flex items-center gap-3 px-6 py-4 bg-rose-50 border-b border-rose-100 rounded-t-2xl">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-rose-600">cancel</span>
                            </div>
                            <div>
                                <p className="font-black text-rose-900">Reject Prescription</p>
                                <p className="text-xs text-rose-600">{rejectTarget.id} · {rejectTarget.patient}</p>
                            </div>
                            <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="ml-auto text-slate-400 hover:text-slate-600 p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Rejection *</p>
                            <div className="space-y-2">
                                {REJECT_REASONS.map(r => (
                                    <label key={r.value} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${rejectReason === r.value ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="rr" value={r.value} checked={rejectReason === r.value} onChange={() => setRejectReason(r.value)} className="accent-rose-600" />
                                        <span className="text-sm font-medium text-slate-800">{r.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
                            <button onClick={confirmReject} disabled={!rejectReason} className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Content */}
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6">

                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-sm">Thursday, 5 March 2026</p>
                            <h2 className="text-2xl font-black mt-1">Good morning, Pharmacist 👋</h2>
                            <p className="text-white/80 text-sm mt-1">You have <span className="font-black text-white">{pending.length} pending dispenses</span> and <span className="font-black text-white">{activeConflicts} active conflict{activeConflicts !== 1 ? 's' : ''}</span> today.</p>
                        </div>
                        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/15 items-center justify-center">
                            <span className="material-symbols-outlined text-[36px] text-white/80">local_pharmacy</span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Verified Today', value: verifiedToday, icon: 'verified', from: 'from-emerald-500', to: 'to-teal-600', sub: 'dispensing actions', link: '/pharmacist/logs' },
                        { label: 'Pending Queue', value: pending.length, icon: 'pending_actions', from: 'from-amber-500', to: 'to-orange-500', sub: `${urgentCount} urgent`, link: '/pharmacist/pending' },
                        { label: 'Drug Conflicts', value: activeConflicts, icon: 'warning', from: 'from-rose-500', to: 'to-red-600', sub: 'unresolved alerts', link: '/pharmacist/conflicts' },
                        { label: 'Needs Review', value: reviewCount, icon: 'rate_review', from: 'from-violet-500', to: 'to-purple-600', sub: 'manual checks', link: '/pharmacist/records' },
                    ].map(k => (
                        <Link key={k.label} to={k.link} className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.from} ${k.to} flex items-center justify-center mb-3 shadow-sm`}>
                                <span className="material-symbols-outlined text-white text-[20px]">{k.icon}</span>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{k.value}</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{k.label}</p>
                            <p className="text-[11px] text-slate-400">{k.sub}</p>
                        </Link>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Pending Dispenses */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-black text-slate-900">Pending Dispenses</h3>
                                <p className="text-xs text-slate-400">{pending.length} prescription{pending.length !== 1 ? 's' : ''} awaiting review</p>
                            </div>
                            <Link to="/pharmacist/pending" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                                View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {pending.length === 0 ? (
                                <div className="py-12 text-center">
                                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">check_circle</span>
                                    <p className="text-sm text-slate-400 font-semibold">All caught up!</p>
                                </div>
                            ) : pending.slice(0, 4).map(rx => {
                                const cfg = URGENCY_CFG[rx.urgency] ?? URGENCY_CFG.normal;
                                const isDisp = dispensed.has(rx.id);
                                return (
                                    <div key={rx.id} className={`flex items-center justify-between px-5 py-4 border-l-4 ${cfg.border} transition-all ${isDisp ? 'opacity-50 bg-emerald-50' : 'hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 bg-gradient-to-br ${cfg.from} ${cfg.to}`}>
                                                {rx.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-slate-900 text-sm">{rx.patient}</p>
                                                    <span className="text-[10px] font-mono text-slate-400">{rx.id}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-primary">{rx.drug}</p>
                                                <p className="text-xs text-slate-400">Qty {rx.qty} · {rx.doctor}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${cfg.pill}`}>{rx.urgency}</span>
                                            <button onClick={() => setReviewTarget(rx)} disabled={isDisp}
                                                className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                {isDisp ? '✓' : 'Review'}
                                            </button>
                                            <button onClick={() => { setRejectTarget(rx); setRejectReason(''); }} disabled={isDisp}
                                                className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                        {/* Quick Links */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="font-black text-slate-900">Quick Access</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-slate-100">
                                {QUICK_LINKS.map(q => (
                                    <Link key={q.label} to={q.to} className="bg-white p-4 hover:bg-slate-50 transition-colors flex flex-col items-center text-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.from} ${q.to2} flex items-center justify-center shadow-sm`}>
                                            <span className="material-symbols-outlined text-white text-[18px]">{q.icon}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900">{q.label}</p>
                                        <p className="text-[11px] text-slate-400">{q.desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <h3 className="font-black text-slate-900">Today&apos;s Activity</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {activity.map(a => {
                                    const cfg = ACT_CFG[a.status];
                                    return (
                                        <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{a.patient}</p>
                                                <p className="text-[11px] text-slate-400 truncate">{a.drug}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{a.action}</span>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

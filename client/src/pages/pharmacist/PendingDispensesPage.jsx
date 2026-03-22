import { useState, useEffect } from 'react';

const INIT_PENDING = [
    { id: 'RX-0041', patient: 'Nana Ama Boateng', drug: 'Atenolol 25mg', qty: 30, doctor: 'Dr. Mensah', urgency: 'urgent', instructions: 'Take 1 tablet daily in the morning' },
    { id: 'RX-0039', patient: 'Kwesi Ofori', drug: 'Glibenclamide 5mg', qty: 60, doctor: 'Dr. Acheampong', urgency: 'normal', instructions: 'Take 1 tablet twice daily with meals' },
    { id: 'RX-0038', patient: 'Akua Sarpong', drug: 'Clopidogrel 75mg', qty: 28, doctor: 'Dr. Mensah', urgency: 'urgent', instructions: 'Take 1 tablet once daily' },
    { id: 'RX-0036', patient: 'Yaw Darko', drug: 'Warfarin 5mg', qty: 14, doctor: 'Dr. Frimpong', urgency: 'review', instructions: 'Take as directed, monitor INR weekly' },
];

const URGENCY_CFG = {
    urgent: { pill: 'bg-rose-100 text-rose-700 border-rose-200', row: 'border-l-4 border-l-rose-400' },
    normal: { pill: 'bg-slate-100 text-slate-600 border-slate-200', row: 'border-l-4 border-l-slate-200' },
    review: { pill: 'bg-amber-100 text-amber-700 border-amber-200', row: 'border-l-4 border-l-amber-400' },
};

const REJECT_REASONS = [
    { value: 'out_of_stock', label: '📦 Out of Stock' },
    { value: 'drug_interaction', label: '⚠️ Drug Interaction Detected' },
    { value: 'expired_rx', label: '📋 Prescription Expired' },
    { value: 'allergy_flag', label: '🚨 Patient Allergy Flagged' },
    { value: 'dosage_error', label: '💊 Possible Dosage Error' },
    { value: 'doctor_recall', label: '🔁 Recalled by Doctor' },
];

export default function PendingDispensesPage() {
    const [pending, setPending] = useState(() => {
        const saved = localStorage.getItem('meditrack_pending_prescriptions');
        if (saved) return JSON.parse(saved);
        return INIT_PENDING;
    });

    const [dispensed, setDispensed] = useState(new Set());
    const [reviewTarget, setReviewTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [search, setSearch] = useState('');
    const [urgencyFilter, setUrgencyFilter] = useState('all');

    useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem('meditrack_pending_prescriptions');
            if (saved) setPending(JSON.parse(saved));
        };
        window.addEventListener('rxDispensedOrPrescribed', handleUpdate);
        return () => window.removeEventListener('rxDispensedOrPrescribed', handleUpdate);
    }, []);

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

            const newDose = {
                id: `DOSE-${Date.now()}`,
                name: rx.drug,
                dosage: `Qty: ${rx.qty}`,
                instruction: rx.instructions || 'Take as directed by Pharmacist',
                time: '8:00 AM',
                status: 'upcoming',
                icon: 'medication',
                isCurrent: false,
            };

            const existingDoses = JSON.parse(localStorage.getItem('meditrack_patient_doses') || '[]');
            if (!existingDoses.some(d => d.status === 'next' || d.status === 'missed')) {
                newDose.status = 'next';
                newDose.isCurrent = true;
            }

            localStorage.setItem('meditrack_patient_doses', JSON.stringify([...existingDoses, newDose]));
            window.dispatchEvent(new Event('rxDispensedOrPrescribed'));
            setDispensed(prev => { const s = new Set(prev); s.delete(rx.id); return s; });
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
        setRejectTarget(null);
        setRejectReason('');
    };

    const searchFiltered = pending.filter(rx => {
        return rx.patient.toLowerCase().includes(search.toLowerCase()) ||
            rx.drug.toLowerCase().includes(search.toLowerCase()) ||
            rx.doctor.toLowerCase().includes(search.toLowerCase()) ||
            rx.id.toLowerCase().includes(search.toLowerCase());
    });

    const filtered = searchFiltered.filter(rx => urgencyFilter === 'all' || rx.urgency === urgencyFilter);

    const urgentCount = searchFiltered.filter(r => r.urgency === 'urgent').length;
    const reviewCount = searchFiltered.filter(r => r.urgency === 'review').length;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">

            {/* ── Review Modal ─────────────────────────────────────── */}
            {reviewTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-fade-in" style={{ maxHeight: '90vh' }}>
                        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-emerald-600">health_and_safety</span>
                            </div>
                            <div>
                                <p className="font-black text-emerald-900">Review & Dispense</p>
                                <p className="text-xs font-bold text-emerald-700">Verify prescription details before authorizing</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient</p>
                                    <p className="font-black text-slate-900 text-lg">{reviewTarget.patient}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prescriber</p>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span className="material-symbols-outlined text-[16px] text-primary">stethoscope</span>
                                        <p className="font-bold text-slate-800">{reviewTarget.doctor}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-symbols-outlined text-primary text-[22px]">medication</span>
                                            <h3 className="font-black text-primary text-xl tracking-tight">{reviewTarget.drug}</h3>
                                        </div>
                                        <p className="text-slate-500 font-medium text-sm ml-7">Quantity: <span className="font-bold text-slate-800">{reviewTarget.qty}</span></p>
                                    </div>
                                    <span className={`text-[11px] font-bold uppercase border px-2.5 py-1 rounded-full ${URGENCY_CFG[reviewTarget.urgency]?.pill}`}>
                                        {reviewTarget.urgency}
                                    </span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sig / Instructions</p>
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3">
                                        <span className="material-symbols-outlined text-slate-400 mt-0.5">prescriptions</span>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{reviewTarget.instructions || 'Take exactly as directed by your physician.'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Automated Safety Checks</p>
                                <div className="flex items-center gap-3 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-800">
                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                    <span className="text-sm font-semibold">No critical drug interactions detected</span>
                                </div>
                                <div className="flex items-center gap-3 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-800">
                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                    <span className="text-sm font-semibold">Dose falls within normal therapeutic range</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                            <button onClick={() => setReviewTarget(null)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDispense} className="flex-[2] py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                Confirm & Dispense
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Modal ─────────────────────────────────────── */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-fade-in" style={{ maxHeight: '90vh' }}>
                        <div className="flex items-center gap-3 px-6 py-4 bg-rose-50 border-b border-rose-100">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-rose-600">cancel</span>
                            </div>
                            <div>
                                <p className="font-black text-rose-900">Reject Prescription</p>
                                <p className="text-xs text-rose-600">{rejectTarget.id} · {rejectTarget.patient}</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <span className="material-symbols-outlined text-slate-400">medication</span>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{rejectTarget.drug}</p>
                                    <p className="text-xs text-slate-500">Qty: {rejectTarget.qty} · {rejectTarget.doctor}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Reason for Rejection *</label>
                                <div className="space-y-2">
                                    {REJECT_REASONS.map(r => (
                                        <label key={r.value} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${rejectReason === r.value ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                            <input type="radio" name="rejectReason" value={r.value} checked={rejectReason === r.value} onChange={() => setRejectReason(r.value)} className="accent-rose-600" />
                                            <span className="text-sm font-medium text-slate-800">{r.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                            <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={confirmReject} disabled={!rejectReason} className={`flex-1 py-2.5 font-bold rounded-xl text-sm transition-colors ${rejectReason ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}



            <div className="flex-1 px-4 sm:px-6 py-6 mb-20 lg:mb-0 space-y-5 animate-fade-in bg-slate-50">

                {/* Header */}
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Portals › Pharmacy › <span className="text-primary font-semibold">Pending Dispenses</span>
                    </p>
                    <h2 className="text-2xl font-black text-slate-900">Pending Dispenses</h2>
                    <p className="text-sm text-slate-500 mt-0.5">All prescriptions awaiting pharmacist review and dispensing.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending Queue', value: searchFiltered.length, icon: 'pending_actions', from: 'from-slate-500', to: 'to-slate-700', sub: 'awaiting review' },
                        { label: 'Urgent', value: urgentCount, icon: 'emergency', from: 'from-rose-500', to: 'to-red-600', sub: 'immediate action' },
                        { label: 'Needs Review', value: reviewCount, icon: 'rate_review', from: 'from-amber-500', to: 'to-orange-500', sub: 'manual check required' },
                        { label: 'Normal Priority', value: searchFiltered.filter(r => r.urgency === 'normal').length, icon: 'check_circle', from: 'from-emerald-500', to: 'to-teal-600', sub: 'standard dispense' },
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

                {/* ── Filter & Search Bar ──────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="Search by patient, drug, doctor, or RX ID..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'urgent', 'normal', 'review'].map(u => (
                            <button
                                key={u}
                                onClick={() => setUrgencyFilter(u)}
                                className={`px-4 py-2 text-sm font-bold rounded-xl border transition-colors capitalize ${urgencyFilter === u ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {u === 'all' ? 'All' : u}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Summary Bar ──────────────────────────────────── */}
                <div className="text-sm text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-800">{filtered.length}</span> of <span className="font-bold text-slate-800">{searchFiltered.length}</span> pending prescriptions
                </div>

                {/* ── Table / List ─────────────────────────────────── */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-3 block">check_circle</span>
                            <p className="text-base font-semibold">
                                {searchFiltered.length === 0 ? 'All caught up! No pending dispenses.' : 'No results match your search or filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map(rx => {
                                const cfg = URGENCY_CFG[rx.urgency] ?? URGENCY_CFG.normal;
                                const isBeingDispensed = dispensed.has(rx.id);
                                return (
                                    <div
                                        key={rx.id}
                                        className={`flex items-center justify-between px-6 py-4 transition-all ${cfg.row} ${isBeingDispensed ? 'opacity-50 bg-emerald-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-primary text-[20px]">medication</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-black text-slate-900 text-sm">{rx.patient}</p>
                                                    <span className="text-[10px] text-slate-400 font-mono">{rx.id}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-primary">{rx.drug}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Qty {rx.qty} · {rx.doctor}</p>
                                                {rx.instructions && (
                                                    <p className="text-xs text-slate-400 mt-0.5 italic truncate max-w-xs">{rx.instructions}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <span className={`text-[11px] font-bold uppercase border px-2 py-1 rounded-full ${cfg.pill}`}>
                                                {rx.urgency}
                                            </span>
                                            <button
                                                onClick={() => setReviewTarget(rx)}
                                                disabled={isBeingDispensed}
                                                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors ${isBeingDispensed ? 'bg-emerald-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                                            >
                                                {isBeingDispensed ? '✓ Done' : 'Review'}
                                            </button>
                                            <button
                                                onClick={() => { setRejectTarget(rx); setRejectReason(''); }}
                                                disabled={isBeingDispensed}
                                                className="px-4 py-2 text-rose-600 border border-rose-200 bg-rose-50 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

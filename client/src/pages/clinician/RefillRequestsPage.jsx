import { useState, useEffect } from 'react';

// ── Mock Data ──────────────────────────────────────────────────────────────────
// supplyDays drives urgency: 0 = critical, 1-3 = urgent, 4-7 = soon, 8+ = routine
const INITIAL_REFILLS = [
    {
        id: 1, name: 'John Doe', pid: '#88291', initials: 'JD',
        medication: 'Metformin 500mg', dose: '500mg twice daily',
        requestDate: 'Mar 5, 2026', status: 'pending',
        supplyDays: 2, adherence: 85, flag: null,
        lastFill: 'Feb 3, 2026', notes: '',
    },
    {
        id: 2, name: 'Alice Smith', pid: '#99312', initials: 'AS',
        medication: 'Lisinopril 10mg', dose: '10mg once daily',
        requestDate: 'Mar 4, 2026', status: 'pending',
        supplyDays: 5, adherence: 98, flag: null,
        lastFill: 'Feb 2, 2026', notes: '',
    },
    {
        id: 3, name: 'Robert Brown', pid: '#77410', initials: 'RB',
        medication: 'Atorvastatin 20mg', dose: '20mg at bedtime',
        requestDate: 'Mar 5, 2026', status: 'pending',
        supplyDays: 0, adherence: 65, flag: 'Low Adherence',
        lastFill: 'Feb 4, 2026', notes: '',
    },
    {
        id: 4, name: 'Michael Wilson', pid: '#44102', initials: 'MW',
        medication: 'Albuterol Inhaler', dose: '2 puffs as needed',
        requestDate: 'Mar 3, 2026', status: 'approved', approvedAt: 'Mar 3, 2026',
        supplyDays: 14, adherence: 92, flag: null,
        lastFill: 'Feb 1, 2026', notes: 'Patient requested early refill due to travel.',
    },
    {
        id: 5, name: 'Sarah Green', pid: '#55209', initials: 'SG',
        medication: 'Warfarin 5mg', dose: '5mg once daily',
        requestDate: 'Mar 1, 2026', status: 'denied', deniedAt: 'Mar 2, 2026',
        supplyDays: 10, adherence: 70, flag: 'Requires INR Blood Check',
        lastFill: 'Jan 30, 2026', notes: 'Hold until INR result comes back.',
    },
    {
        id: 6, name: 'Yaw Darko', pid: '#66311', initials: 'YD',
        medication: 'Warfarin 5mg', dose: '5mg once daily',
        requestDate: 'Mar 5, 2026', status: 'pending',
        supplyDays: 1, adherence: 76, flag: 'Irregular Dosing Pattern',
        lastFill: 'Feb 5, 2026', notes: '',
    },
];

const TABS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'denied', label: 'Denied / On Hold' },
];

// Urgency config based on supply days remaining
function getUrgency(supplyDays) {
    if (supplyDays === 0) return { label: 'Critical', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', order: 0 };
    if (supplyDays <= 3) return { label: 'Urgent', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', order: 1 };
    if (supplyDays <= 7) return { label: 'Soon', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', order: 2 };
    return { label: 'Routine', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', order: 3 };
}

function AdherenceBar({ value }) {
    const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-rose-500';
    const textColor = value >= 80 ? 'text-emerald-700' : value >= 50 ? 'text-amber-700' : 'text-rose-700';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
            </div>
            <span className={`text-xs font-bold tabular-nums ${textColor}`}>{value}%</span>
        </div>
    );
}

export default function RefillRequestsPage() {
    const [activeTab, setActiveTab] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [refills, setRefills] = useState(() => {
        const saved = localStorage.getItem('meditrack_refills_v2');
        return saved ? JSON.parse(saved) : INITIAL_REFILLS;
    });
    const [reviewTarget, setReviewTarget] = useState(null); // refill being reviewed
    const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'deny'
    const [reviewNote, setReviewNote] = useState('');
    const [toast, setToast] = useState(null);
    const [detailTarget, setDetailTarget] = useState(null);

    useEffect(() => {
        localStorage.setItem('meditrack_refills_v2', JSON.stringify(refills));
    }, [refills]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Open review modal before approving or denying
    const openReview = (refill, action) => {
        setReviewTarget(refill);
        setReviewAction(action);
        setReviewNote('');
    };

    const confirmAction = () => {
        if (!reviewTarget) return;
        setRefills(prev => prev.map(r => {
            if (r.id !== reviewTarget.id) return r;
            if (reviewAction === 'approve') {
                return { ...r, status: 'approved', approvedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), notes: reviewNote };
            }
            return { ...r, status: 'denied', deniedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), notes: reviewNote, flag: reviewNote ? `Denied: ${reviewNote}` : 'Clinician Denied' };
        }));
        showToast(reviewAction === 'approve' ? `Refill approved for ${reviewTarget.name}` : `Refill denied for ${reviewTarget.name}`, reviewAction === 'approve' ? 'success' : 'error');
        setReviewTarget(null);
        setReviewAction(null);
    };

    // Sorted: pending sorted by urgency (most critical first), others by date
    const filteredRefills = refills
        .filter(r => {
            const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.medication.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.pid.includes(searchQuery);
            return matchSearch && r.status === activeTab;
        })
        .sort((a, b) => {
            if (activeTab === 'pending') return getUrgency(a.supplyDays).order - getUrgency(b.supplyDays).order;
            return 0;
        });

    const pendingCount = refills.filter(r => r.status === 'pending').length;
    const approvedCount = refills.filter(r => r.status === 'approved').length;
    const criticalCount = refills.filter(r => r.status === 'pending' && r.supplyDays === 0).length;
    const flaggedCount = refills.filter(r => r.status === 'pending' && r.flag).length;

    return (
        <div className="flex flex-col min-h-screen relative bg-slate-50">

            {/* ── Toast ──────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-fade-in
                    ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">{toast.type === 'success' ? 'check_circle' : 'cancel'}</span>
                    {toast.msg}
                </div>
            )}

            {/* ── Review Modal ──────────────────────────────────── */}
            {reviewTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className={`p-5 flex items-center justify-between border-b border-slate-100 ${reviewAction === 'approve' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reviewAction === 'approve' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                    <span className={`material-symbols-outlined ${reviewAction === 'approve' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {reviewAction === 'approve' ? 'check_circle' : 'cancel'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">
                                        {reviewAction === 'approve' ? 'Approve Refill' : 'Deny / Hold Refill'}
                                    </h3>
                                    <p className="text-xs text-slate-500">Review before confirming</p>
                                </div>
                            </div>
                            <button onClick={() => setReviewTarget(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Patient + med summary */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</p>
                                    <p className="text-sm font-bold text-slate-900">{reviewTarget.name}</p>
                                    <p className="text-xs text-slate-500">{reviewTarget.pid}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medication</p>
                                    <p className="text-sm font-bold text-slate-900">{reviewTarget.medication}</p>
                                    <p className="text-xs text-slate-500">{reviewTarget.dose}</p>
                                </div>
                            </div>

                            {/* Clinical snapshot */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Clinical Snapshot</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Supply Remaining</span>
                                    <span className={`font-bold ${reviewTarget.supplyDays === 0 ? 'text-rose-600' : reviewTarget.supplyDays <= 3 ? 'text-orange-600' : 'text-slate-800'}`}>
                                        {reviewTarget.supplyDays === 0 ? 'OUT OF STOCK' : `${reviewTarget.supplyDays} days`}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-600">Adherence Rate</span>
                                    </div>
                                    <AdherenceBar value={reviewTarget.adherence} />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Last Fill Date</span>
                                    <span className="font-bold text-slate-800">{reviewTarget.lastFill}</span>
                                </div>
                                {reviewTarget.flag && (
                                    <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                                        <span className="material-symbols-outlined text-rose-500 text-[16px]">flag</span>
                                        <span className="text-xs font-bold text-rose-700">{reviewTarget.flag}</span>
                                    </div>
                                )}
                            </div>

                            {/* Clinician note */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                    {reviewAction === 'approve' ? 'Note (optional)' : 'Reason for denial *'}
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                    placeholder={reviewAction === 'approve' ? 'e.g. Patient travelling, early fill approved.' : 'e.g. Awaiting INR result before reauthorising.'}
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex gap-3 justify-end">
                            <button onClick={() => setReviewTarget(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={reviewAction === 'deny' && !reviewNote.trim()}
                                className={`px-5 py-2 font-black rounded-xl text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                    ${reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                {reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Denial'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ──────────────────────────────────── */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold
                                    ${detailTarget.status === 'approved' ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                                    <span className={`material-symbols-outlined ${detailTarget.status === 'approved' ? 'text-emerald-700' : 'text-slate-600'}`}>
                                        {detailTarget.status === 'approved' ? 'check_circle' : 'info'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">Request Details</h3>
                                    <p className="text-xs text-slate-500 capitalize">{detailTarget.name} · {detailTarget.medication}</p>
                                </div>
                            </div>
                            <button onClick={() => setDetailTarget(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Patient</p>
                                    <p className="font-bold text-slate-900 text-sm">{detailTarget.name}</p>
                                    <p className="text-xs text-slate-400">{detailTarget.pid}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                    <p className={`text-sm font-black capitalize ${detailTarget.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {detailTarget.status}
                                    </p>
                                    <p className="text-xs text-slate-400">{detailTarget.approvedAt || detailTarget.deniedAt || detailTarget.requestDate}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Medication</span>
                                    <span className="font-bold text-slate-900">{detailTarget.medication}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Supply Remaining</span>
                                    <span className="font-bold text-slate-900">{detailTarget.supplyDays} days</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Request Date</span>
                                    <span className="font-bold text-slate-900">{detailTarget.requestDate}</span>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Adherence</p>
                                    <AdherenceBar value={detailTarget.adherence} />
                                </div>
                                {detailTarget.notes && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-500 mb-1">Clinician Note</p>
                                        <p className="text-sm text-slate-700 italic">&ldquo;{detailTarget.notes}&rdquo;</p>
                                    </div>
                                )}
                                {detailTarget.flag && (
                                    <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                                        <span className="material-symbols-outlined text-rose-500 text-[15px]">flag</span>
                                        <span className="text-xs font-bold text-rose-700">{detailTarget.flag}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 pb-5 flex justify-end">
                            <button onClick={() => setDetailTarget(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Content ───────────────────────────────────────── */}
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6">

                {/* Page Title */}
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Portals › Clinician › <span className="text-primary font-semibold">Refills</span>
                    </p>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Refill Requests</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Review and authorise medication renewal requests. Pending requests are sorted by urgency.</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending', value: pendingCount, icon: 'pending_actions', from: 'from-amber-500', to: 'to-orange-500', sub: 'awaiting review' },
                        { label: 'Approved Today', value: approvedCount, icon: 'check_circle', from: 'from-emerald-500', to: 'to-teal-500', sub: 'authorised' },
                        { label: 'Critical (0-day)', value: criticalCount, icon: 'emergency', from: 'from-rose-500', to: 'to-red-600', sub: 'out of supply' },
                        { label: 'Flagged', value: flaggedCount, icon: 'flag', from: 'from-violet-500', to: 'to-purple-600', sub: 'needs attention' },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center shadow-sm`}>
                                    <span className="material-symbols-outlined text-white text-[20px]">{s.icon}</span>
                                </div>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{s.value}</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{s.label}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Search + Tabs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
                        <div className="relative flex-1 max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search patient or medication..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-1">
                            {TABS.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === t.key ? 'bg-primary text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {t.label}
                                    {t.key === 'pending' && pendingCount > 0 && (
                                        <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md ${activeTab === 'pending' ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Patient</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Medication</th>
                                    {activeTab === 'pending' && (
                                        <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Urgency</th>
                                    )}
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Adherence</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notices</th>
                                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRefills.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-12 text-center">
                                            <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">inbox</span>
                                            <p className="text-slate-400 text-sm font-semibold">No {activeTab} refill requests</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRefills.map(refill => {
                                        const urgency = getUrgency(refill.supplyDays);
                                        return (
                                            <tr key={refill.id} className={`hover:bg-slate-50/60 transition-colors ${refill.supplyDays === 0 && activeTab === 'pending' ? 'border-l-4 border-rose-500' : ''}`}>

                                                {/* Patient */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                                                            {refill.initials}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{refill.name}</p>
                                                            <p className="text-xs text-slate-400">{refill.pid} · Req: {refill.requestDate}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Medication */}
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold text-slate-800">{refill.medication}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{refill.dose}</p>
                                                </td>

                                                {/* Urgency (pending only) */}
                                                {activeTab === 'pending' && (
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${urgency.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot} ${refill.supplyDays === 0 ? 'animate-pulse' : ''}`} />
                                                            {urgency.label}
                                                        </span>
                                                        <p className="text-[11px] text-slate-400 mt-1 pl-0.5">
                                                            {refill.supplyDays === 0 ? 'Out of supply' : `${refill.supplyDays}d remaining`}
                                                        </p>
                                                    </td>
                                                )}

                                                {/* Adherence */}
                                                <td className="px-5 py-4 min-w-[140px]">
                                                    <AdherenceBar value={refill.adherence} />
                                                </td>

                                                {/* Notices */}
                                                <td className="px-5 py-4">
                                                    {refill.flag ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                                                            <span className="material-symbols-outlined text-[13px]">flag</span>
                                                            {refill.flag}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-300">—</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    {activeTab === 'pending' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openReview(refill, 'deny')}
                                                                className="px-3 py-1.5 text-xs font-bold border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                                            >
                                                                Deny
                                                            </button>
                                                            <button
                                                                onClick={() => openReview(refill, 'approve')}
                                                                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                                                            >
                                                                Approve
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDetailTarget(refill)}
                                                            className="text-primary text-xs font-bold hover:underline flex items-center gap-0.5 ml-auto"
                                                        >
                                                            Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

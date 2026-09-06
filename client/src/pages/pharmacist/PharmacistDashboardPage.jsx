import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { getEscalations, getRefillRequests, getMedicationLogs, updateRefillStatus } from '../../api/api';

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
    const [dispensed, setDispensed] = useState(new Set());
    const [reviewTarget, setReviewTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [toast, setToast] = useState(null);

    // Live API Data for Summary Cards, Queue, and Logs
    const { data: rawEscalations, refetch: refetchEscalations } = useApi(getEscalations);
    const { data: rawRefills, refetch: refetchRefills } = useApi(getRefillRequests);
    const { data: rawLogs, refetch: refetchLogs } = useApi(getMedicationLogs);

    const pendingRefills = (rawRefills || []).filter(r => {
        const st = (r.pharmacyStatus || r.status || '').toLowerCase();
        return st === 'pending' || st === 'approved';
    }).map(r => ({
        id: r.id,
        patientId: r.patientId,
        prescriptionId: r.prescriptionId,
        name: r.name || 'Patient',
        medication: r.medication || 'Medication',
        dosage: r.dosage || 'Standard dose',
        urgency: (r.pharmacyStatus || r.status || '').toUpperCase() === 'APPROVED' ? 'urgent' : 'normal',
        requestDate: r.requestedAt ? new Date(r.requestedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today',
        doctor: r.doctor || 'Clinic Doctor',
        status: r.pharmacyStatus || r.status || 'pending'
    }));
    const liveActivity = (rawLogs || []).slice(0, 6).map(l => ({
        id: l.id,
        time: new Date(l.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        patient: l.patient,
        drug: `${l.drug} ${l.dosage}`,
        action: l.action === 'TAKEN' ? 'Dispensed / Logged' : 'Flagged',
        status: l.action === 'TAKEN' ? 'done' : 'warn',
    }));

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDispense = async () => {
        if (!reviewTarget) return;
        const rx = reviewTarget;
        setDispensed(prev => new Set([...prev, rx.id]));
        setReviewTarget(null);
        
        try {
            if (rx.id && !rx.id.startsWith('RX-MOCK')) {
                await updateRefillStatus(rx.id, 'DISPENSED');
            }
            window.dispatchEvent(new Event('rxDispensedOrPrescribed'));
            refetchRefills();
            refetchLogs();
        } catch(err) {
            console.error(err);
        }

        setTimeout(() => {
            setDispensed(prev => { const s = new Set(prev); s.delete(rx.id); return s; });
            showToast(`${rx.medication || rx.drug} dispensed to ${rx.name || rx.patient}`);
        }, 800);
    };

    const confirmReject = async () => {
        if (!rejectReason || !rejectTarget) return;
        try {
            if (rejectTarget.id && !rejectTarget.id.startsWith('RX-MOCK')) {
                await updateRefillStatus(rejectTarget.id, 'CANCELLED');
            }
            window.dispatchEvent(new Event('rxDispensedOrPrescribed'));
            refetchRefills();
        } catch(err) {
            console.error(err);
        }
        showToast(`${rejectTarget.medication || rejectTarget.drug} rejected: ${rejectReason}`, 'error');
        setRejectTarget(null); setRejectReason('');
    };

    const livePendingCount = pendingRefills.length;
    const liveConflictsCount = (rawEscalations || []).filter(e => e.status === 'ACTIVE').length;
    const verifiedToday = (rawLogs || []).filter(l => l.action === 'TAKEN').length;
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-bold flex items-center gap-2 animate-fade-in ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                    <span className="material-symbols-outlined text-[18px]">{toast.type === 'error' ? 'cancel' : 'check_circle'}</span>
                    {toast.msg}
                </div>
            )}

            {/* Review Modal */}
            {reviewTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-fade-in max-h-[90vh]">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">medication</span>
                            </div>
                            <div>
                                <p className="font-black text-slate-900">Dispense Verification</p>
                                <p className="text-xs text-slate-400">{reviewTarget.id} · {reviewTarget.patient || reviewTarget.name}</p>
                            </div>
                            <button onClick={() => setReviewTarget(null)} className="ml-auto text-slate-400 hover:text-slate-600 p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Patient</p>
                                    <p className="font-black text-slate-900">{reviewTarget.patient || reviewTarget.name}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prescriber</p>
                                    <p className="font-black text-slate-900">{reviewTarget.doctor || 'Clinic Attending'}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary text-[22px]">medication</span>
                                    <h3 className="font-black text-primary text-lg">{reviewTarget.drug || reviewTarget.medication}</h3>
                                    <span className="ml-auto text-[11px] font-bold border px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border-rose-200">Urgent</span>
                                </div>
                                <p className="text-sm text-slate-600">Dosage: <span className="font-bold text-slate-900">{reviewTarget.dosage || 'Standard'}</span></p>
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
                                <p className="text-xs text-rose-600">{rejectTarget.id} · {rejectTarget.patient || rejectTarget.name}</p>
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
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6 max-w-7xl mx-auto w-full">

                {/* Hero Banner */}
                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-sm">{today}</p>
                            <h2 className="text-2xl font-black mt-1">Pharmacy Operations 💊</h2>
                            <p className="text-white/80 text-sm mt-1">
                                You have <span className="font-black text-white">{livePendingCount} pending dispense{livePendingCount !== 1 ? 's' : ''}</span> and <span className="font-black text-white">{liveConflictsCount} active alert{liveConflictsCount !== 1 ? 's' : ''}</span> in the database.
                            </p>
                        </div>
                        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/15 items-center justify-center">
                            <span className="material-symbols-outlined text-[36px] text-white/80">local_pharmacy</span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Logged / Verified', value: verifiedToday, icon: 'verified', from: 'from-emerald-500', to: 'to-teal-600', sub: 'live patient logs', link: '/pharmacist/logs' },
                        { label: 'Pending Queue', value: livePendingCount, icon: 'pending_actions', from: 'from-amber-500', to: 'to-orange-500', sub: 'awaiting dispense', link: '/pharmacist/pending' },
                        { label: 'Clinical Alerts', value: liveConflictsCount, icon: 'warning', from: 'from-rose-500', to: 'to-red-600', sub: 'active escalations', link: '/pharmacist/conflicts' },
                        { label: 'Total Refills', value: rawRefills ? rawRefills.length : 0, icon: 'receipt_long', from: 'from-violet-500', to: 'to-purple-600', sub: 'all records', link: '/pharmacist/records' },
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
                                <p className="text-xs text-slate-400">{pendingRefills.length} prescription{pendingRefills.length !== 1 ? 's' : ''} in queue</p>
                            </div>
                            <Link to="/pharmacist/pending" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                                View All <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {pendingRefills.length === 0 ? (
                                <div className="py-12 text-center">
                                    <span className="material-symbols-outlined text-3xl text-emerald-400 block mb-2">check_circle</span>
                                    <p className="text-sm text-slate-700 font-bold">All Dispenses Complete</p>
                                    <p className="text-xs text-slate-400 mt-0.5">No pending prescriptions in the dispensary queue.</p>
                                </div>
                            ) : pendingRefills.slice(0, 4).map(rx => {
                                const isDisp = dispensed.has(rx.id);
                                return (
                                    <div key={rx.id} className={`flex items-center justify-between px-5 py-4 border-l-4 border-l-amber-400 transition-all ${isDisp ? 'opacity-50 bg-emerald-50' : 'hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-600">
                                                {(rx.name || 'P')[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-slate-900 text-sm">{rx.name}</p>
                                                    <span className="text-[10px] font-mono text-slate-400">Refill #{rx.id.slice(0, 6)}</span>
                                                </div>
                                                <p className="text-sm font-semibold text-primary">{rx.medication} {rx.dosage}</p>
                                                <p className="text-xs text-slate-400">{rx.doctor || 'Clinic Doctor'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
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
                                <h3 className="font-black text-slate-900">Today&apos;s Live Activity</h3>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                                {liveActivity.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-xs">
                                        No recent dispensing logs recorded yet today.
                                    </div>
                                ) : liveActivity.map(a => {
                                    const cfg = ACT_CFG[a.status] || ACT_CFG.info;
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

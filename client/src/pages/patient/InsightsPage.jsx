import { useState, useEffect } from 'react';


// Each dose carries a prescribingDoctor field — in production this comes from the DB.
// We enrich the mock doses with this field for the Share feature.
const DOCTOR_MAP = {
    'Aspirin': { name: 'Dr. Amara Mensah', specialty: 'Cardiologist', email: 'a.mensah@clinic.gh' },
    'Omega-3': { name: 'Dr. Amara Mensah', specialty: 'Cardiologist', email: 'a.mensah@clinic.gh' },
    'Vitamin D3': { name: 'Dr. Kofi Acheampong', specialty: 'Endocrinologist', email: 'k.acheampong@clinic.gh' },
    'Metformin': { name: 'Dr. Kofi Acheampong', specialty: 'Endocrinologist', email: 'k.acheampong@clinic.gh' },
    'Lisinopril': { name: 'Dr. Amara Mensah', specialty: 'Cardiologist', email: 'a.mensah@clinic.gh' },
};

function readDoses() {
    const saved = localStorage.getItem('meditrack_patient_doses');
    if (!saved) return { taken: 0, missed: 0, upcoming: 0, pct: 0, doses: [] };
    const parsed = JSON.parse(saved);
    const takenCount = parsed.filter(d => d.status === 'taken').length;
    const missedCount = parsed.filter(d => d.status === 'missed').length;
    const totalPast = takenCount + missedCount;
    return {
        taken: takenCount,
        missed: missedCount,
        upcoming: parsed.filter(d => d.status === 'upcoming' || d.status === 'next').length,
        pct: totalPast === 0 ? 0 : Math.round((takenCount / totalPast) * 100),
        doses: parsed,
    };
}

export default function InsightsPage() {
    const [shareModal, setShareModal] = useState(false);
    const [sentDoctors, setSentDoctors] = useState([]);

    // Derive adherence stats — re-reads on focus so data stays fresh after
    // returning from Daily Dose / Pill Verification
    const [adherenceStats, setAdherenceStats] = useState(readDoses);

    useEffect(() => {
        const refresh = () => setAdherenceStats(readDoses());
        window.addEventListener('focus', refresh);
        // Also listen for the custom event fired by PillVerification
        window.addEventListener('rxDispensedOrPrescribed', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('rxDispensedOrPrescribed', refresh);
        };
    }, []);

    // Today's bar derives from live data; historical days use illustrative values
    const dayIdx = new Date().getDay(); // 0=Sun … 6=Sat
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mockWeeklyData = dayLabels.map((label, i) => ({
        label,
        val: i === dayIdx ? adherenceStats.pct : (i < dayIdx ? [100, 100, 80, 100, 100, 75][i] ?? 90 : 0),
    }));

    /* ── Download Report ─────────────────────────────────────── */
    const handleDownload = () => {
        const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const lines = [
            '=== MediTrack — Patient Adherence Report ===',
            `Generated: ${today}`,
            '',
            `Adherence Score : ${adherenceStats.pct}%`,
            `Doses Taken     : ${adherenceStats.taken}`,
            `Doses Missed    : ${adherenceStats.missed}`,
            `Upcoming        : ${adherenceStats.upcoming}`,
            '',
            '--- Dose Log ---',
            ...adherenceStats.doses.map(d => {
                const status = d.status === 'taken' ? `Taken at ${d.loggedAt}` : d.status.toUpperCase();
                return `  [${d.time}]  ${d.name}  ${d.dosage}  —  ${status}`;
            }),
            '',
            '--- Timing Accuracy ---',
            '  On Time (< 1 hr)  : 82%',
            '  Late   (> 1 hr)  : 12%',
            '  Missed            : 6%',
            '',
            'Powered by MediTrack Health Systems',
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MediTrack_Report_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ── Share with Doctor ───────────────────────────────────── */
    // Group medications by their prescribing doctor
    const doctorGroups = (() => {
        const groups = {};
        adherenceStats.doses.forEach(d => {
            const doc = DOCTOR_MAP[d.name];
            if (!doc) return;
            if (!groups[doc.name]) groups[doc.name] = { ...doc, meds: [] };
            groups[doc.name].meds.push(d);
        });
        return Object.values(groups);
    })();

    const handleSendToDoctor = (doctorName) => {
        setSentDoctors(prev => [...new Set([...prev, doctorName])]);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 space-y-6 lg:space-y-8 animate-fade-in mb-20 lg:mb-0">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Patient › <span className="text-primary font-semibold">Insights</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">Health Insights</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Your adherence trends and clinical snapshots.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Download
                        </button>
                        <button onClick={() => setShareModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">
                            <span className="material-symbols-outlined text-[18px]">share</span>
                            Share with Doctor
                        </button>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {[
                        { label: 'Dose Adherence', value: `${adherenceStats.pct}%`, sub: adherenceStats.pct >= 90 ? 'Excellent' : 'Needs attention', subColor: adherenceStats.pct >= 90 ? 'text-emerald-500' : 'text-amber-500', icon: 'monitoring', from: 'from-primary', to: 'to-blue-600' },
                        { label: 'Doses Taken', value: adherenceStats.taken, sub: 'this week', subColor: 'text-slate-400', icon: 'check_circle', from: 'from-emerald-500', to: 'to-teal-600' },
                        { label: 'Doses Missed', value: adherenceStats.missed, sub: 'this week', subColor: 'text-slate-400', icon: 'cancel', from: 'from-rose-500', to: 'to-red-600' },
                    ].map(k => (
                        <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.from} ${k.to} flex items-center justify-center mb-3 shadow-sm`}>
                                <span className="material-symbols-outlined text-white text-[20px]">{k.icon}</span>
                            </div>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">{k.value}</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5">{k.label}</p>
                            <p className={`text-xs font-semibold mt-0.5 ${k.subColor}`}>{k.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Weekly Chart */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Weekly Adherence Trend</h3>
                        <div className="h-64 flex items-end gap-2 sm:gap-4 justify-between">
                            {mockWeeklyData.map((data, i) => (
                                <div key={i} className="flex flex-col items-center flex-1 gap-3 h-full">
                                    <div className="w-full bg-slate-100 rounded-t-xl relative flex items-end justify-center h-full">
                                        <div
                                            className={`w-full rounded-t-xl absolute bottom-0 transition-all duration-1000 ${data.val >= 90 ? 'bg-primary' : data.val > 0 ? 'bg-amber-400' : 'bg-slate-200'}`}
                                            style={{ height: `${data.val}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{data.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timing Snapshot */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Timing Accuracy</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-emerald-700">On Time (&lt; 1hr)</span>
                                    <span className="font-bold text-slate-900">82%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-amber-700">Late (&gt; 1hr)</span>
                                    <span className="font-bold text-slate-900">12%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full w-[12%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-bold text-rose-700">Missed</span>
                                    <span className="font-bold text-slate-900">6%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full w-[6%]" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-sm font-semibold text-primary mb-1">Clinical Note</p>
                            <p className="text-xs text-slate-600 leading-relaxed">You tend to miss doses more frequently on weekends. Consider setting an extra reminder or syncing your dose with a weekend routine.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Share with Doctor Modal ────────────────────────────── */}
            {shareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Share Report</h3>
                                <p className="text-sm text-slate-500 mt-0.5">Select a prescribing doctor to send your adherence report to.</p>
                            </div>
                            <button
                                onClick={() => { setShareModal(false); setSentDoctors([]); }}
                                className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-500">close</span>
                            </button>
                        </div>

                        {/* Report preview pill */}
                        <div className="mx-6 mt-5 flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-primary">description</span>
                            <div>
                                <p className="text-sm font-bold text-slate-800">MediTrack Adherence Report</p>
                                <p className="text-xs text-slate-500">Adherence: {adherenceStats.pct}% · Taken: {adherenceStats.taken} · Missed: {adherenceStats.missed}</p>
                            </div>
                        </div>

                        {/* Doctor cards */}
                        <div className="p-6 space-y-4">
                            {doctorGroups.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-6">No prescribing doctor data found for your medications.</p>
                            )}
                            {doctorGroups.map((doc) => {
                                const sent = sentDoctors.includes(doc.name);
                                return (
                                    <div key={doc.name} className={`border rounded-2xl p-4 transition-all ${sent ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="material-symbols-outlined text-primary text-xl">stethoscope</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500">{doc.specialty} · {doc.email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleSendToDoctor(doc.name)}
                                                disabled={sent}
                                                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${sent
                                                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                                    : 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">{sent ? 'check' : 'send'}</span>
                                                {sent ? 'Sent!' : 'Send'}
                                            </button>
                                        </div>

                                        {/* Medications this doctor prescribed */}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {doc.meds.map(med => (
                                                <span key={med.id} className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                                    {med.name} {med.dosage}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="px-6 pb-6">
                            <button
                                onClick={() => { setShareModal(false); setSentDoctors([]); }}
                                className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

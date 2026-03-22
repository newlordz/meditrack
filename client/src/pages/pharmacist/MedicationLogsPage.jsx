import { useState } from 'react';

const ALL_LOGS = [
    { id: 'LOG-1041', time: '09:47', date: '5 Mar 2026', patient: 'Ama Johanson', initials: 'AJ', drug: 'Lisinopril 10mg', qty: 30, pharmacist: 'Dr. Chen', action: 'Dispensed', batch: 'BT-20241', verified: true },
    { id: 'LOG-1040', time: '09:31', date: '5 Mar 2026', patient: 'Kofi Mensah', initials: 'KM', drug: 'Metformin 500mg', qty: 60, pharmacist: 'Dr. Chen', action: 'Flagged', batch: 'BT-19988', verified: false },
    { id: 'LOG-1039', time: '09:12', date: '5 Mar 2026', patient: 'Abena Owusu', initials: 'AO', drug: 'Aspirin 75mg', qty: 28, pharmacist: 'Dr. Chen', action: 'Dispensed', batch: 'BT-20105', verified: true },
    { id: 'LOG-1038', time: '08:58', date: '5 Mar 2026', patient: 'Yaw Darko', initials: 'YD', drug: 'Warfarin 5mg', qty: 14, pharmacist: 'Dr. Chen', action: 'Under Review', batch: 'BT-19901', verified: false },
    { id: 'LOG-1037', time: '08:40', date: '5 Mar 2026', patient: 'Efua Asante', initials: 'EA', drug: 'Omeprazole 20mg', qty: 14, pharmacist: 'Dr. Chen', action: 'Dispensed', batch: 'BT-20241', verified: true },
    { id: 'LOG-1036', time: '15:22', date: '4 Mar 2026', patient: 'Kwame Bediako', initials: 'KB', drug: 'Amlodipine 5mg', qty: 30, pharmacist: 'Dr. Chen', action: 'Dispensed', batch: 'BT-20099', verified: true },
    { id: 'LOG-1035', time: '14:10', date: '4 Mar 2026', patient: 'Nana Ama Boateng', initials: 'NB', drug: 'Levothyroxine 50mcg', qty: 30, pharmacist: 'Dr. Chen', action: 'Dispensed', batch: 'BT-19980', verified: true },
    { id: 'LOG-1034', time: '13:44', date: '4 Mar 2026', patient: 'Kwesi Ofori', initials: 'KO', drug: 'Glibenclamide 5mg', qty: 60, pharmacist: 'Dr. Chen', action: 'Dispensed', batch: 'BT-20033', verified: true },
    { id: 'LOG-1033', time: '11:05', date: '4 Mar 2026', patient: 'Akua Sarpong', initials: 'AS', drug: 'Clopidogrel 75mg', qty: 28, pharmacist: 'Dr. Chen', action: 'Refill', batch: 'BT-19966', verified: true },
    { id: 'LOG-1032', time: '10:30', date: '4 Mar 2026', patient: 'Ama Johanson', initials: 'AJ', drug: 'Metformin 500mg', qty: 60, pharmacist: 'Dr. Chen', action: 'Refill', batch: 'BT-19988', verified: true },
];

const ACTION_CFG = {
    'Dispensed': { badge: 'bg-emerald-100 text-emerald-700', icon: 'check_circle', dot: 'bg-emerald-500' },
    'Flagged': { badge: 'bg-rose-100 text-rose-700', icon: 'flag', dot: 'bg-rose-500' },
    'Under Review': { badge: 'bg-amber-100 text-amber-700', icon: 'rate_review', dot: 'bg-amber-500' },
    'Refill': { badge: 'bg-blue-100 text-blue-700', icon: 'autorenew', dot: 'bg-blue-500' },
};

const DATES = ['All Dates', '5 Mar 2026', '4 Mar 2026'];
const ACTIONS = ['All Actions', 'Dispensed', 'Flagged', 'Under Review', 'Refill'];

export default function MedicationLogsPage() {
    const [search, setSearch] = useState('');
    const [filterDate, setFilterDate] = useState('All Dates');
    const [filterAction, setFilterAction] = useState('All Actions');

    const baseFiltered = ALL_LOGS.filter(log => {
        const matchSearch = log.patient.toLowerCase().includes(search.toLowerCase())
            || log.drug.toLowerCase().includes(search.toLowerCase())
            || log.id.toLowerCase().includes(search.toLowerCase());
        const matchDate = filterDate === 'All Dates' || log.date === filterDate;
        return matchSearch && matchDate;
    });

    const filtered = baseFiltered.filter(log => filterAction === 'All Actions' || log.action === filterAction);

    const totalDispensed = baseFiltered.filter(l => l.action === 'Dispensed').length;
    const totalFlagged = baseFiltered.filter(l => l.action === 'Flagged' || l.action === 'Under Review').length;
    const totalRefills = baseFiltered.filter(l => l.action === 'Refill').length;
    const verified = filtered.filter(l => l.verified).length;

    const handleExport = () => {
        const header = ['Log ID', 'Date', 'Time', 'Patient', 'Drug', 'Qty', 'Action', 'Batch', 'Verified', 'Pharmacist'];
        const rows = filtered.map(l => [l.id, l.date, l.time, l.patient, l.drug, l.qty, l.action, l.batch, l.verified ? 'Yes' : 'No', l.pharmacist]);
        const content = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([content], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `MediTrack_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Pharmacy › <span className="text-primary font-semibold">Logs</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">Medication Logs</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Full audit trail of all dispensing and verification actions.</p>
                    </div>
                    <button onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors shadow-sm self-start">
                        <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Logged', value: baseFiltered.length, icon: 'receipt_long', from: 'from-slate-500', to: 'to-slate-600', sub: 'all entries' },
                        { label: 'Dispensed', value: totalDispensed, icon: 'check_circle', from: 'from-emerald-500', to: 'to-teal-600', sub: 'successful' },
                        { label: 'Flagged / Review', value: totalFlagged, icon: 'warning', from: 'from-rose-500', to: 'to-red-600', sub: 'needs attention' },
                        { label: 'Refills', value: totalRefills, icon: 'autorenew', from: 'from-blue-500', to: 'to-indigo-600', sub: 'renewals processed' },
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

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search patient, drug, or log ID…"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
                    </div>
                    <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-slate-700">
                        {DATES.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-slate-700">
                        {ACTIONS.map(a => <option key={a}>{a}</option>)}
                    </select>
                </div>

                {/* Log Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-500">{filtered.length} records · {verified} verified</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {['Log ID', 'Date / Time', 'Patient', 'Drug', 'Qty', 'Action', 'Batch', 'Verified'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(log => {
                                    const cfg = ACTION_CFG[log.action] || { badge: 'bg-slate-100 text-slate-500', icon: 'info', dot: 'bg-slate-400' };
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.id}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="font-semibold text-slate-800 text-xs">{log.date}</p>
                                                <p className="text-[11px] text-slate-400">{log.time}</p>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0">{log.initials}</div>
                                                    <span className="font-semibold text-slate-900 text-sm">{log.patient}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-sm">{log.drug}</td>
                                            <td className="px-4 py-3 text-center font-black text-slate-900">{log.qty}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.batch}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`material-symbols-outlined text-[20px] ${log.verified ? 'text-emerald-500' : 'text-slate-200'}`}>
                                                    {log.verified ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400">
                                            <span className="material-symbols-outlined text-3xl mb-2 block">search_off</span>
                                            <p className="text-sm font-semibold">No logs match your filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

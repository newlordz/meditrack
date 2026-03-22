import { useState, useEffect } from 'react';
import { SHARED_PATIENTS } from '../../data/mockData';

const REPORT_TEMPLATES = [
    {
        id: 'tpl-1',
        title: 'Monthly Adherence Summary',
        description: 'Overall clinic adherence rates, trends, and patient breakdown for the month.',
        icon: 'bar_chart',
        type: 'PDF',
        color: 'from-blue-500 to-indigo-600',
    },
    {
        id: 'tpl-2',
        title: 'High-Risk Patient Audit',
        description: 'All patients with adherence <50%, including flags and alerts.',
        icon: 'warning',
        type: 'CSV',
        color: 'from-rose-500 to-red-600',
    },
    {
        id: 'tpl-3',
        title: 'Refill & Prescription Log',
        description: 'History of all prescription approvals and denials for the period.',
        icon: 'medication',
        type: 'CSV',
        color: 'from-emerald-500 to-teal-600',
    },
    {
        id: 'tpl-4',
        title: 'Escalation & Triage Report',
        description: 'Summary of all escalation alerts, resolutions, and response times.',
        icon: 'notifications_active',
        type: 'PDF',
        color: 'from-orange-500 to-amber-600',
    },
];

const DEFAULT_REPORTS = [
    { id: 'hist-1', title: 'Monthly Clinic Adherence Summary', date: 'Mar 1, 2026', type: 'PDF', size: '2.4 MB', archived: true, template: 'tpl-1' },
    { id: 'hist-2', title: 'High-Risk Patient Audit Q1', date: 'Feb 28, 2026', type: 'CSV', size: '85 KB', archived: true, template: 'tpl-2' },
    { id: 'hist-3', title: 'Escalation & Triage Report', date: 'Feb 15, 2026', type: 'PDF', size: '1.1 MB', archived: true, template: 'tpl-4' },
];

function TypeBadge({ type }) {
    return (
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider
            ${type === 'PDF' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {type}
        </span>
    );
}

export default function ReportsPage() {
    const [reports, setReports] = useState(() => {
        const saved = localStorage.getItem('meditrack_clinician_reports_v2');
        return saved ? JSON.parse(saved) : DEFAULT_REPORTS;
    });
    const [isGenerating, setIsGenerating] = useState(null); // template id being generated
    const [previewReport, setPreviewReport] = useState(null);
    const [showArchive, setShowArchive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        localStorage.setItem('meditrack_clinician_reports_v2', JSON.stringify(reports));
    }, [reports]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleGenerate = (tpl) => {
        setIsGenerating(tpl.id);
        setTimeout(() => {
            const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const newReport = {
                id: Date.now().toString(),
                title: tpl.title,
                date: today,
                type: tpl.type,
                size: `${Math.round(Math.random() * 800 + 60)} KB`,
                archived: false,
                template: tpl.id,
            };
            setReports(prev => [newReport, ...prev]);
            setIsGenerating(null);
            showToast(`"${tpl.title}" generated successfully.`);
        }, 1400);
    };

    const handleDownload = (report) => {
        const patients = SHARED_PATIENTS;
        let content = 'Patient Name,MRN,Adherence Score,Risk Level,Condition\n';
        patients.forEach(p => {
            const risk = p.adherence < 50 ? 'High' : p.adherence < 80 ? 'Moderate' : 'Low';
            content += `"${p.name}","${p.pid}",${p.adherence}%,${risk},"${p.condition}"\n`;
        });
        if (patients.length === 0) content += 'System Data,Unavailable,0%,N/A,N/A\n';
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
        link.click();
        showToast(`Downloading "${report.title}"…`);
    };

    const handleDelete = (id) => setReports(prev => prev.filter(r => r.id !== id));
    const handleToggleArchive = (id) => setReports(prev => prev.map(r => r.id === id ? { ...r, archived: !r.archived } : r));

    const searchFiltered = reports.filter(r => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const displayReports = searchFiltered.filter(r => showArchive ? r.archived : !r.archived);

    const recentCount = searchFiltered.filter(r => !r.archived).length;
    const archivedCount = searchFiltered.filter(r => r.archived).length;

    return (
        <div className="flex flex-col min-h-screen relative bg-slate-50">

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg bg-slate-900 text-white text-sm font-bold flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                    {toast}
                </div>
            )}

            {/* Preview Modal */}
            {previewReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900">Data Preview</h3>
                                    <p className="text-xs text-slate-500">{previewReport.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewReport(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3">Patient</th>
                                        <th className="px-5 py-3">MRN</th>
                                        <th className="px-5 py-3">Adherence</th>
                                        <th className="px-5 py-3">Risk</th>
                                        <th className="px-5 py-3">Condition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {SHARED_PATIENTS.map((p, i) => {
                                        const risk = p.adherence < 50 ? 'High' : p.adherence < 80 ? 'Moderate' : 'Low';
                                        const riskColor = p.adherence < 50 ? 'text-rose-600 bg-rose-50' : p.adherence < 80 ? 'text-amber-600 bg-amber-50' : 'text-emerald-700 bg-emerald-50';
                                        return (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">{p.name}</td>
                                                <td className="px-5 py-3 text-slate-500">{p.pid}</td>
                                                <td className={`px-5 py-3 font-black ${p.adherence < 50 ? 'text-rose-600' : p.adherence < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{p.adherence}%</td>
                                                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${riskColor}`}>{risk}</span></td>
                                                <td className="px-5 py-3 text-slate-600 text-xs">{p.condition}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button onClick={() => setPreviewReport(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">Close</button>
                            <button onClick={() => handleDownload(previewReport)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm shadow-sm hover:bg-primary-dark transition-colors">
                                <span className="material-symbols-outlined text-[18px]">download</span> Download CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Content */}
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-6">

                {/* Header */}
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Portals › Clinician › <span className="text-primary font-semibold">Reports</span>
                    </p>
                    <h2 className="text-2xl font-black text-slate-900">Clinical Reports</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Generate, preview, and download standard clinic data exports.</p>
                </div>

                {/* Report Templates */}
                <div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">Generate New Report</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {REPORT_TEMPLATES.map(tpl => (
                            <div key={tpl.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center shadow-sm`}>
                                    <span className="material-symbols-outlined text-white text-[20px]">{tpl.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900 text-sm leading-tight">{tpl.title}</p>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tpl.description}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <TypeBadge type={tpl.type} />
                                    <button
                                        onClick={() => handleGenerate(tpl)}
                                        disabled={!!isGenerating}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {isGenerating === tpl.id ? (
                                            <><span className="material-symbols-outlined text-[14px] animate-spin">refresh</span> Generating…</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-[14px]">add_circle</span> Generate</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Report List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
                        <div className="relative flex-1 max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search reports…"
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setShowArchive(false)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${!showArchive ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                Recent <span className="ml-1 text-[11px] opacity-70">({recentCount})</span>
                            </button>
                            <button onClick={() => setShowArchive(true)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${showArchive ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                Archived <span className="ml-1 text-[11px] opacity-70">({archivedCount})</span>
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {displayReports.length === 0 ? (
                            <div className="py-12 text-center">
                                <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">inventory_2</span>
                                <p className="font-bold text-slate-500 text-sm">
                                    {showArchive ? 'No archived reports.' : 'No recent reports. Generate one above.'}
                                </p>
                            </div>
                        ) : displayReports.map(report => {
                            const tpl = REPORT_TEMPLATES.find(t => t.id === report.template);
                            return (
                                <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${tpl?.color || 'from-slate-400 to-slate-500'} shadow-sm`}>
                                            <span className="material-symbols-outlined text-white text-[18px]">{tpl?.icon || 'description'}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-bold text-slate-900">{report.title}</h4>
                                                <TypeBadge type={report.type} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[13px]">calendar_today</span> {report.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[13px]">hard_drive</span> {report.size}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto">
                                        <button onClick={() => setPreviewReport(report)}
                                            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors" title="Preview">
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button onClick={() => handleDownload(report)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                            <span className="material-symbols-outlined text-[15px]">download</span> Download
                                        </button>
                                        <button onClick={() => handleToggleArchive(report.id)}
                                            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors" title={showArchive ? 'Unarchive' : 'Archive'}>
                                            <span className="material-symbols-outlined text-[20px]">{showArchive ? 'unarchive' : 'archive'}</span>
                                        </button>
                                        <button onClick={() => handleDelete(report.id)}
                                            className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Delete">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
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

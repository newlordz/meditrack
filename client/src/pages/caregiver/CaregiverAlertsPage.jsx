import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getEscalations, resolveEscalation, dismissEscalation } from '../../api/api';

const SEV_CFG = {
    critical: { badge: 'bg-rose-100 text-rose-700', icon: 'error', iconColor: 'text-rose-500', border: 'border-l-rose-500', label: 'Critical', dot: 'bg-rose-500 animate-pulse', from: 'from-rose-500', to: 'to-red-600' },
    warning: { badge: 'bg-amber-100 text-amber-700', icon: 'warning', iconColor: 'text-amber-500', border: 'border-l-amber-400', label: 'Warning', dot: 'bg-amber-400', from: 'from-amber-500', to: 'to-orange-500' },
    info: { badge: 'bg-blue-100 text-blue-700', icon: 'info', iconColor: 'text-blue-400', border: 'border-l-blue-300', label: 'Info', dot: 'bg-blue-400', from: 'from-blue-400', to: 'to-sky-500' },
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active Alerts' },
    { key: 'critical', label: 'Critical' },
    { key: 'resolved', label: 'Resolved' },
];

export default function CaregiverAlertsPage() {
    const { data: rawEscalations, refetch } = useApi(getEscalations);
    const [activeTab, setActiveTab] = useState('all');
    const [notified, setNotified] = useState(new Set());

    const alerts = (rawEscalations || []).map(e => {
        const patientName = e.patient || e.patientName || 'Patient';
        const title = e.trigger || e.reason || e.category || 'Clinical Escalation Alert';
        return {
            id: e.id,
            patient: patientName,
            initials: patientName.split(' ').map(n => n[0]).join('').slice(0, 2),
            severity: e.severity?.toLowerCase() === 'critical' ? 'critical' : 'warning',
            title: title,
            desc: `Patient ${patientName} flagged: ${title}. Action required.`,
            time: new Date(e.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            resolved: e.status === 'RESOLVED' || e.status === 'dismissed' || e.status === 'DISMISSED',
            read: e.status === 'RESOLVED' || e.status === 'dismissed' || e.status === 'DISMISSED',
        };
    });

    const handleDismiss = async (id) => {
        try {
            await dismissEscalation(id);
            refetch();
        } catch(err) {
            console.error(err);
        }
    };

    const handleResolve = async (id) => {
        try {
            await resolveEscalation(id);
            refetch();
        } catch(err) {
            console.error(err);
        }
    };

    const notifyDoctor = (id) => {
        setNotified(prev => new Set([...prev, id]));
        setTimeout(() => setNotified(prev => { const s = new Set(prev); s.delete(id); return s; }), 2500);
    };

    const filtered = alerts.filter(a => {
        if (activeTab === 'active') return !a.resolved;
        if (activeTab === 'critical') return a.severity === 'critical' && !a.resolved;
        if (activeTab === 'resolved') return a.resolved;
        return true;
    });

    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const warningCount = alerts.filter(a => a.severity === 'warning' && !a.resolved).length;
    const activeCount = alerts.filter(a => !a.resolved).length;
    const resolvedCount = alerts.filter(a => a.resolved).length;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 mb-20 lg:mb-0 space-y-6 animate-fade-in">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Caregiver › <span className="text-primary font-semibold">Alerts</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">Patient Alerts</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Live clinical escalations and medication alerts from database.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Critical', value: criticalCount, icon: 'error', from: 'from-rose-500', to: 'to-red-600', sub: 'needs immediate action' },
                        { label: 'Warnings', value: warningCount, icon: 'warning', from: 'from-amber-500', to: 'to-orange-500', sub: 'review when possible' },
                        { label: 'Active Queue', value: activeCount, icon: 'notifications_active', from: 'from-blue-500', to: 'to-indigo-600', sub: 'unresolved' },
                        { label: 'Resolved', value: resolvedCount, icon: 'task_alt', from: 'from-emerald-500', to: 'to-teal-600', sub: 'actions completed' },
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

                {/* Alert List */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 px-2 pt-1">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap
                                    ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-14 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2 block text-emerald-400">check_circle</span>
                            <p className="text-sm font-semibold text-slate-700">No alerts in this category</p>
                            <p className="text-xs text-slate-400 mt-0.5">All monitored patients are in good standing.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map((alert, i) => {
                                const cfg = SEV_CFG[alert.severity] || SEV_CFG.warning;
                                const isNotified = notified.has(alert.id);
                                return (
                                    <div key={alert.id}
                                        className={`flex gap-4 px-5 py-4 border-l-4 transition-all ${cfg.border} ${alert.resolved ? 'opacity-50 bg-slate-50' : 'bg-white'}`}
                                        style={{ animationDelay: `${i * 0.05}s` }}>

                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 bg-gradient-to-br ${cfg.from} ${cfg.to}`}>
                                            {alert.initials}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                                                    {!alert.resolved && (
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-400 flex-shrink-0">{alert.time}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-600 mb-1">{alert.patient}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{alert.desc}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                                    {cfg.label}
                                                </span>
                                                {!alert.resolved && (
                                                    <>
                                                        <button onClick={() => handleResolve(alert.id)}
                                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors px-2 py-1 bg-emerald-50 rounded-lg">
                                                            ✓ Mark Resolved
                                                        </button>
                                                        <button onClick={() => handleDismiss(alert.id)}
                                                            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors px-2 py-1">
                                                            Dismiss
                                                        </button>
                                                        <button onClick={() => notifyDoctor(alert.id)}
                                                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${isNotified ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                                            {isNotified ? '✓ Notified' : 'Notify Doctor'}
                                                        </button>
                                                    </>
                                                )}
                                                {alert.resolved && <span className="text-xs font-bold text-emerald-600">✓ Resolved</span>}
                                            </div>
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

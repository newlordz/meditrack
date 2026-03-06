import { useState } from 'react';

const INIT_ALERTS = [
    {
        id: 1, patient: 'George Johnson', initials: 'GJ', severity: 'critical',
        title: 'Missed 3 consecutive doses',
        desc: 'Amlodipine 5mg has not been taken since yesterday morning. Blood pressure risk elevated.',
        time: '10 min ago', read: false, resolved: false,
    },
    {
        id: 2, patient: 'George Johnson', initials: 'GJ', severity: 'critical',
        title: 'Refill overdue',
        desc: 'Amlodipine 5mg prescription refill is due today. Stock may run out within 24 hours.',
        time: '1 hr ago', read: false, resolved: false,
    },
    {
        id: 3, patient: 'Margaret Johnson', initials: 'MJ', severity: 'warning',
        title: 'Refill due in 5 days',
        desc: 'Glipizide 5mg will need a refill in 5 days. Consider contacting the pharmacy.',
        time: '3 hrs ago', read: true, resolved: false,
    },
    {
        id: 4, patient: 'Linda Owusu', initials: 'LO', severity: 'info',
        title: 'Daily summary ready',
        desc: 'Linda maintained 100% adherence today. All scheduled doses taken on time.',
        time: '6 hrs ago', read: true, resolved: false,
    },
    {
        id: 5, patient: 'Margaret Johnson', initials: 'MJ', severity: 'warning',
        title: 'Afternoon dose pending',
        desc: 'Metformin 500mg (2:00 PM dose) has not been logged yet. Check with patient.',
        time: '8 hrs ago', read: false, resolved: false,
    },
    {
        id: 6, patient: 'George Johnson', initials: 'GJ', severity: 'info',
        title: 'Device sync complete',
        desc: "George's MedTrack device synced successfully. Last 7 days of data uploaded.",
        time: 'Yesterday', read: true, resolved: true,
    },
];

const SEV_CFG = {
    critical: { badge: 'bg-rose-100 text-rose-700', icon: 'error', iconColor: 'text-rose-500', border: 'border-l-rose-500', label: 'Critical', dot: 'bg-rose-500 animate-pulse', from: 'from-rose-500', to: 'to-red-600' },
    warning: { badge: 'bg-amber-100 text-amber-700', icon: 'warning', iconColor: 'text-amber-500', border: 'border-l-amber-400', label: 'Warning', dot: 'bg-amber-400', from: 'from-amber-500', to: 'to-orange-500' },
    info: { badge: 'bg-blue-100 text-blue-700', icon: 'info', iconColor: 'text-blue-400', border: 'border-l-blue-300', label: 'Info', dot: 'bg-blue-400', from: 'from-blue-400', to: 'to-sky-500' },
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'critical', label: 'Critical' },
    { key: 'resolved', label: 'Resolved' },
];

export default function CaregiverAlertsPage() {
    const [alerts, setAlerts] = useState(INIT_ALERTS);
    const [activeTab, setActiveTab] = useState('all');
    const [escalated, setEscalated] = useState(new Set());

    const dismiss = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, read: true } : a));
    const markRead = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));

    const escalate = (id) => {
        setEscalated(prev => new Set([...prev, id]));
        markRead(id);
        setTimeout(() => setEscalated(prev => { const s = new Set(prev); s.delete(id); return s; }), 2500);
    };

    const filtered = alerts.filter(a => {
        if (activeTab === 'unread') return !a.read && !a.resolved;
        if (activeTab === 'critical') return a.severity === 'critical' && !a.resolved;
        if (activeTab === 'resolved') return a.resolved;
        return true;
    });

    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const warningCount = alerts.filter(a => a.severity === 'warning' && !a.resolved).length;
    const unreadCount = alerts.filter(a => !a.read && !a.resolved).length;
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
                        <p className="text-sm text-slate-500 mt-0.5">Stay on top of medication events across all your patients.</p>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors self-start">
                            <span className="material-symbols-outlined text-[18px]">done_all</span> Mark all read
                        </button>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Critical', value: criticalCount, icon: 'error', from: 'from-rose-500', to: 'to-red-600', sub: 'needs immediate action' },
                        { label: 'Warnings', value: warningCount, icon: 'warning', from: 'from-amber-500', to: 'to-orange-500', sub: 'review when possible' },
                        { label: 'Unread', value: unreadCount, icon: 'notifications', from: 'from-blue-500', to: 'to-indigo-600', sub: 'not yet seen' },
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
                            <span className="material-symbols-outlined text-4xl mb-2 block">notifications_off</span>
                            <p className="text-sm font-semibold">No alerts in this category.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map((alert, i) => {
                                const cfg = SEV_CFG[alert.severity];
                                const isEscalated = escalated.has(alert.id);
                                return (
                                    <div key={alert.id} onClick={() => markRead(alert.id)}
                                        className={`flex gap-4 px-5 py-4 border-l-4 transition-all cursor-pointer ${cfg.border} ${alert.resolved ? 'opacity-50 bg-slate-50' : !alert.read ? 'bg-slate-50/80' : 'bg-white'}`}
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
                                                    {!alert.read && !alert.resolved && (
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-400 flex-shrink-0">{alert.time}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-500 mb-1">{alert.patient}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{alert.desc}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                                    {cfg.label}
                                                </span>
                                                {!alert.resolved && (
                                                    <>
                                                        <button onClick={e => { e.stopPropagation(); dismiss(alert.id); }}
                                                            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
                                                            Dismiss
                                                        </button>
                                                        {alert.severity !== 'info' && (
                                                            <button onClick={e => { e.stopPropagation(); escalate(alert.id); }}
                                                                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${isEscalated ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
                                                                {isEscalated ? '✓ Notified' : 'Notify Doctor'}
                                                            </button>
                                                        )}
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

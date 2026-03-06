import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useLiveBadgeCount } from '../hooks/useLiveBadgeCount';
import { PORTAL_USERS } from '../data/mockData';

const NAV_ITEMS = {
    patient: [
        { label: 'Schedule', icon: 'calendar_today', path: '/patient/schedule' },
        { label: 'Insights', icon: 'analytics', path: '/patient/insights' },
        { label: 'Rewards', icon: 'emoji_events', path: '/patient/rewards' },
        { label: 'Verify Pill', icon: 'photo_camera', path: '/patient/verify' },
        { label: 'Profile', icon: 'person', path: '/patient/profile' },
    ],
    doctor: [
        { label: 'Dashboard', icon: 'dashboard', path: '/clinician/dashboard' },
        { label: 'Patient Roster', icon: 'groups', path: '/clinician/roster' },
        { label: 'Refill Requests', icon: 'medication', path: '/clinician/refills' },
        { label: 'Escalations', icon: 'notifications_active', path: '/clinician/escalations', badgeKey: 'escalations' },
        { label: 'Analytics', icon: 'analytics', path: '/clinician/analytics' },
        { label: 'Reports', icon: 'description', path: '/clinician/reports' },
    ],
    pharmacist: [
        { label: 'Dashboard', icon: 'dashboard', path: '/pharmacist/dashboard' },
        { label: 'Patient Records', icon: 'groups', path: '/pharmacist/records' },
        { label: 'Interaction Center', icon: 'warning', path: '/pharmacist/conflicts' },
        { label: 'Medication Logs', icon: 'medication', path: '/pharmacist/logs' },
        { label: 'Settings', icon: 'settings', path: '/pharmacist/settings' },
    ],
    caregiver: [
        { label: 'Dashboard', icon: 'dashboard', path: '/caregiver/dashboard' },
        { label: 'My Patients', icon: 'groups', path: '/caregiver/patients' },
        { label: 'Alerts', icon: 'notifications', path: '/caregiver/alerts' },
        { label: 'Settings', icon: 'settings', path: '/caregiver/settings' },
    ],
};

const ROLE_LABELS = {
    patient: 'Patient Portal',
    doctor: 'Clinician Portal',
    pharmacist: 'Pharmacy Portal',
    caregiver: 'Caregiver Portal',
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const role = user?.role || 'patient';
    const items = NAV_ITEMS[role] || [];
    const roleLabel = ROLE_LABELS[role] || 'Portal';
    const mockUser = PORTAL_USERS[role];
    const initials = mockUser.name.split(' ').map(n => n[0]).join('');

    const liveEscalations = useLiveBadgeCount(
        'meditrack_escalations_v2',
        (data) => data.filter(e => e.status === 'active' || !e.status).length,
        3
    );

    const liveConflicts = useLiveBadgeCount(
        'meditrack_conflicts',
        (data) => data.filter(c => c.severity === 'high' && c.status !== 'resolved').length,
        3
    );

    const displayItems = items.map(item => {
        if (item.badgeKey === 'escalations') {
            return { ...item, badge: liveEscalations };
        }
        return item;
    });

    return (
        <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-30 max-lg:hidden">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-xl">medical_services</span>
                </div>
                <div className="min-w-0">
                    <h1 className="text-base font-bold leading-tight text-slate-900">MediTrack</h1>
                    <p className="text-xs text-slate-400 leading-tight">{roleLabel}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {displayItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                            ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                            <span className="absolute right-3 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-auto">
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Alert (pharmacist only) */}
            {role === 'pharmacist' && (
                <div className="px-3 pb-2">
                    <div className="bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mb-2">
                        <p className="text-[10px] font-bold text-danger uppercase tracking-wider">Active Alerts</p>
                        <p className="text-xs font-semibold text-danger">{liveConflicts} High Severity Conflicts</p>
                    </div>
                </div>
            )}

            {/* User info */}
            <div className="px-3 py-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{mockUser.name}</p>
                        <p className="text-xs text-slate-400 truncate">{mockUser.subtitle}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="text-slate-400 hover:text-danger transition-colors flex-shrink-0"
                        title="Logout"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

export function MobileNav() {
    const { user } = useAuth();
    const role = user?.role || 'patient';
    const items = NAV_ITEMS[role] || [];

    const liveEscalations = useLiveBadgeCount(
        'meditrack_escalations_v2',
        (data) => data.filter(e => e.status === 'active' || !e.status).length,
        3
    );

    // On mobile, only show top 4-5 items to prevent crowding
    const mobileItems = items.slice(0, 5).map(item => {
        if (item.badgeKey === 'escalations') {
            return { ...item, badge: liveEscalations };
        }
        return item;
    });

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 pb-safe-area pt-1 lg:hidden">
            {mobileItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-colors relative
                        ${isActive
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-900'
                        }`
                    }
                >
                    <span className="material-symbols-outlined text-[24px] mb-0.5">{item.icon}</span>
                    <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.label.split(' ')[0]}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute top-1 right-2 bg-danger text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {item.badge}
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>
    );
}

export function MobileHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const role = user?.role || 'patient';
    const items = NAV_ITEMS[role] || [];
    const roleLabel = ROLE_LABELS[role] || 'Portal';
    const mockUser = PORTAL_USERS[role];
    const initials = mockUser.name.split(' ').map(n => n[0]).join('');

    const liveEscalations = useLiveBadgeCount(
        'meditrack_escalations_v2',
        (data) => data.filter(e => e.status === 'active' || !e.status).length,
        3
    );

    const displayItems = items.map(item => {
        if (item.badgeKey === 'escalations') {
            return { ...item, badge: liveEscalations };
        }
        return item;
    });

    return (
        <>
            <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 lg:hidden">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-[18px]">medical_services</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-black leading-none text-slate-900 tracking-tight">MediTrack</h1>
                        <p className="text-[10px] text-primary font-bold mt-0.5">{roleLabel}</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>
            </header>

            {/* Mobile Drawer Menu */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)} />

                    {/* Drawer */}
                    <div className="absolute top-0 right-0 w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col animate-fade-in" style={{ animationDuration: '0.2s' }}>
                        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{mockUser.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{mockUser.subtitle}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm border border-slate-200 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Navigation Menu</p>
                            {displayItems.map(item => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative
                                        ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                                    <span>{item.label}</span>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                                            {item.badge}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                            <button
                                onClick={() => { setIsOpen(false); logout(); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-danger hover:text-danger hover:bg-danger/5 text-slate-700 font-bold rounded-xl text-sm transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                Secure Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

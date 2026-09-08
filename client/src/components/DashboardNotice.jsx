import { useState } from 'react';
import { useSiteContent } from '../context/SiteContentContext';

export default function DashboardNotice({ role }) {
    const { content } = useSiteContent();
    const [dismissed, setDismissed] = useState(false);

    const notice = content?.dashboard_notices?.[role];

    if (!notice || !notice.enabled || dismissed || !notice.message) {
        return null;
    }

    const roleStyles = {
        patient: {
            bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            iconColor: 'text-emerald-600',
            badgeBg: 'bg-emerald-200/60 text-emerald-800',
            icon: 'health_and_safety',
        },
        doctor: {
            bg: 'bg-blue-50 border-blue-200 text-blue-900',
            iconColor: 'text-blue-600',
            badgeBg: 'bg-blue-200/60 text-blue-800',
            icon: 'clinical_notes',
        },
        pharmacist: {
            bg: 'bg-purple-50 border-purple-200 text-purple-900',
            iconColor: 'text-purple-600',
            badgeBg: 'bg-purple-200/60 text-purple-800',
            icon: 'medication',
        },
        caregiver: {
            bg: 'bg-rose-50 border-rose-200 text-rose-900',
            iconColor: 'text-rose-600',
            badgeBg: 'bg-rose-200/60 text-rose-800',
            icon: 'volunteer_activism',
        },
    };

    const style = roleStyles[role] || roleStyles.patient;

    return (
        <div className={`p-4 rounded-2xl border ${style.bg} flex items-start justify-between gap-3 shadow-xs mb-6 animate-fade-in`}>
            <div className="flex items-start gap-3 min-w-0">
                <span className={`material-symbols-outlined text-[24px] flex-shrink-0 mt-0.5 ${style.iconColor}`}>
                    {style.icon}
                </span>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${style.badgeBg}`}>
                            Hospital Bulletin
                        </span>
                        {notice.title && (
                            <h4 className="text-xs font-bold truncate">{notice.title}</h4>
                        )}
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{notice.message}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss bulletin"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    );
}

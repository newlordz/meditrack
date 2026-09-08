import { useState } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { useAuth } from '../context/useAuth';

export default function BroadcastBanner() {
    const { content } = useSiteContent();
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    const banner = content?.broadcast_banner;

    if (!banner || !banner.enabled || dismissed) {
        return null;
    }

    // Role filtering check
    const currentRole = user?.role || 'anonymous';
    if (banner.audience && banner.audience !== 'all') {
        if (banner.audience === 'patient' && currentRole !== 'patient') return null;
        if (banner.audience === 'doctor' && currentRole !== 'doctor') return null;
        if (banner.audience === 'pharmacist' && currentRole !== 'pharmacist') return null;
        if (banner.audience === 'caregiver' && currentRole !== 'caregiver') return null;
    }

    const typeConfig = {
        info: {
            bg: 'bg-blue-600',
            border: 'border-blue-700',
            text: 'text-white',
            icon: 'info',
            accent: 'bg-white/20 text-white',
        },
        warning: {
            bg: 'bg-amber-500',
            border: 'border-amber-600',
            text: 'text-slate-900',
            icon: 'warning',
            accent: 'bg-slate-900/10 text-slate-900',
        },
        critical: {
            bg: 'bg-rose-600',
            border: 'border-rose-700',
            text: 'text-white',
            icon: 'campaign',
            accent: 'bg-white/20 text-white',
        },
        success: {
            bg: 'bg-emerald-600',
            border: 'border-emerald-700',
            text: 'text-white',
            icon: 'check_circle',
            accent: 'bg-white/20 text-white',
        },
    };

    const cfg = typeConfig[banner.type] || typeConfig.info;

    return (
        <div className={`relative z-50 ${cfg.bg} ${cfg.text} border-b ${cfg.border} shadow-sm px-4 py-2.5 transition-all animate-fade-in`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px] flex-shrink-0 animate-pulse">
                        {cfg.icon}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                        {banner.title && (
                            <span className="font-black uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-md bg-black/10">
                                {banner.title}
                            </span>
                        )}
                        <span className="truncate sm:whitespace-normal font-semibold">
                            {banner.message}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {banner.linkUrl && banner.linkText && (
                        <a
                            href={banner.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:opacity-80 font-bold transition-opacity text-xs"
                        >
                            {banner.linkText} →
                        </a>
                    )}
                    {banner.dismissible && (
                        <button
                            type="button"
                            onClick={() => setDismissed(true)}
                            className="p-1 rounded-lg hover:bg-black/10 transition-colors flex items-center justify-center"
                            aria-label="Dismiss announcement"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

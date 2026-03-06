import { useLocation } from 'react-router-dom';

export default function PlaceholderPage() {
    const location = useLocation();

    // Convert path to title (e.g. /clinician/refills -> Refills)
    const pathParts = location.pathname.split('/');
    const title = pathParts[pathParts.length - 1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <div className="p-8 h-full flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-slate-400">construction</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{title}</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                This page is currently under implementation. The routing is successful, and the UI layout for this specific view will be built shortly.
            </p>
            <div className="mt-8 px-4 py-2 bg-primary/10 text-primary font-mono text-sm rounded-lg">
                Current Route: {location.pathname}
            </div>
        </div>
    );
}

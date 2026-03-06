import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { isAuthenticated, getDefaultRoute } = useAuth();

    const handleGoHome = () => {
        if (isAuthenticated) {
            navigate(getDefaultRoute());
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="text-center max-w-md w-full animate-fade-in">

                {/* Big 404 */}
                <div className="relative mb-8">
                    <p className="text-[120px] sm:text-[160px] font-black text-slate-100 leading-none select-none">
                        404
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-5xl">
                                search_off
                            </span>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                    Page Not Found
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    The page you're looking for doesn't exist or you don't have
                    permission to view it.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Go Back
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">home</span>
                        {isAuthenticated ? 'My Dashboard' : 'Back to Login'}
                    </button>
                </div>

                {/* Footer hint */}
                <p className="text-xs text-slate-400 mt-8">
                    MediTrack · If you believe this is an error, contact your system administrator.
                </p>
            </div>
        </div>
    );
}

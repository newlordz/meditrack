import { useState, useEffect } from 'react';
import { enableMfa, confirmMfa, disableMfa } from '../api/api';

export default function MFASettingsCard({ user, updateUser }) {
    const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
    const [setupSecret, setSetupSecret] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [code, setCode] = useState('');
    const [showSetup, setShowSetup] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (user) {
            setMfaEnabled(user.mfaEnabled || false);
        }
    }, [user]);

    const handleEnableClick = async () => {
        setError('');
        setSuccessMsg('');
        setLoading(true);
        try {
            const data = await enableMfa(user.userId || user.id);
            setSetupSecret(data.secret);
            setQrCodeUrl(data.qrCodeUrl);
            setShowSetup(true);
        } catch (err) {
            setError(err.message || 'Failed to start MFA setup.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSetup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await confirmMfa(user.userId || user.id, setupSecret, code);
            setMfaEnabled(true);
            updateUser({ mfaEnabled: true });
            setShowSetup(false);
            setSuccessMsg('MFA has been successfully enabled for your account!');
            setCode('');
        } catch (err) {
            setError(err.message || 'Verification failed. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!window.confirm('Are you sure you want to disable Multi-Factor Authentication? This reduces your account security.')) return;
        setError('');
        setSuccessMsg('');
        setLoading(true);
        try {
            await disableMfa(user.userId || user.id);
            setMfaEnabled(false);
            updateUser({ mfaEnabled: false });
            setSuccessMsg('MFA has been disabled.');
        } catch (err) {
            setError(err.message || 'Failed to disable MFA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary text-[20px]">security</span>
                <h3 className="font-bold text-slate-900">Multi-Factor Authentication (MFA)</h3>
            </div>
            <div className="p-6">
                {successMsg && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        {successMsg}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {error}
                    </div>
                )}

                {mfaEnabled ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-emerald-600">shield</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">MFA is Active</p>
                                <p className="text-xs text-slate-400 mt-0.5">Your account is secured with secondary verification codes.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDisableMfa}
                            disabled={loading}
                            className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-xl text-sm transition-colors"
                        >
                            Disable MFA
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined">gpp_maybe</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">MFA is Not Configured</p>
                                <p className="text-xs text-slate-400 mt-0.5">Secure your account by adding verification codes via Google Authenticator.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleEnableClick}
                            disabled={loading}
                            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-colors shadow-sm animate-pulse-subtle"
                        >
                            Setup MFA
                        </button>
                    </div>
                )}

                {showSetup && (
                    <div className="mt-6 border-t border-slate-100 pt-6 animate-fade-in">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Setup MFA Authenticator</h4>
                        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 items-center">
                            <div className="flex justify-center">
                                <img src={qrCodeUrl} alt="Scan QR Code" className="w-40 h-40 border p-2 bg-white rounded-xl shadow-sm animate-fade-in" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    1. Scan the QR code with your authenticator app (like Google Authenticator or Microsoft Authenticator).<br />
                                    2. If you cannot scan, enter this key manually: <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border text-[11px] block mt-1 select-all max-w-max">{setupSecret}</span>
                                </p>
                                <form onSubmit={handleConfirmSetup} className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={code}
                                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="6-digit code"
                                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-primary/20 w-32"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || code.length !== 6}
                                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-colors"
                                    >
                                        Verify &amp; Activate
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowSetup(false)}
                                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { changeMyPassword } from '../api/api';

export default function ForcePasswordResetPage() {
    const { user, updateUser, getDefaultRoute, logout } = useAuth();
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Complexity checks
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const allSatisfied = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

    // Strength score (0 to 5)
    const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    
    const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const STRENGTH_COLORS = [
        'bg-slate-200 text-slate-400',
        'bg-rose-500 text-rose-600',
        'bg-orange-500 text-orange-600',
        'bg-amber-500 text-amber-600',
        'bg-blue-500 text-blue-600',
        'bg-emerald-500 text-emerald-600',
    ];

    // Password Match State
    const hasConfirm = confirmPassword.length > 0;
    const isMatching = hasConfirm && newPassword === confirmPassword;
    const isMismatch = hasConfirm && newPassword !== confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (!allSatisfied) {
            setError('New password does not meet complexity requirements');
            return;
        }

        setLoading(true);
        try {
            await changeMyPassword(user.userId || user.id, oldPassword, newPassword);
            
            // Success! Update local context to clear the flag
            updateUser({ mustChangePassword: false });
            
            // If patient has not completed their emergency contacts & vitals profile, route to onboarding
            if (user?.role === 'patient' && !user?.profileCompleted) {
                navigate('/patient/onboarding', { replace: true });
            } else {
                // Redirect to their dashboard
                navigate(getDefaultRoute(), { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Failed to change password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center sm:px-6 lg:px-8 py-12">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
                        <span className="material-symbols-outlined text-white text-[32px]">shield_person</span>
                    </div>
                    <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">Security Update</h2>
                    <p className="text-center text-sm text-slate-500 mt-2">
                        For security reasons, you must change your temporary password before accessing the Meditrack portal.
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    
                    {error && (
                        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-rose-500 text-[20px] mt-0.5">error</span>
                            <p className="text-sm font-semibold text-rose-700">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Current / Temporary Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Current/Temporary Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showOldPassword ? 'text' : 'password'} required
                                    value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="block w-full pl-4 pr-11 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showOldPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-slate-700">New Password</label>
                                {newPassword.length > 0 && (
                                    <span className={`text-xs font-bold ${STRENGTH_COLORS[strengthScore].split(' ')[1]}`}>
                                        {STRENGTH_LABELS[strengthScore]}
                                    </span>
                                )}
                            </div>
                            
                            <div className="relative flex items-center mb-2">
                                <input
                                    type={showNewPassword ? 'text' : 'password'} required
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Create strong new password"
                                    className="block w-full pl-4 pr-11 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showNewPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>

                            {/* Live Strength Meter Bar */}
                            {newPassword.length > 0 && (
                                <div className="grid grid-cols-5 gap-1.5 mb-3">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                level <= strengthScore ? STRENGTH_COLORS[strengthScore].split(' ')[0] : 'bg-slate-100'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {/* Complexity checklist */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs font-semibold text-slate-600">
                                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">New Password Requirements</p>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] transition-colors ${hasMinLength ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasMinLength ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasMinLength ? 'text-slate-800 font-bold' : ''}>At least 8 characters</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] transition-colors ${hasUppercase ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasUppercase ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasUppercase ? 'text-slate-800 font-bold' : ''}>At least 1 uppercase letter</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] transition-colors ${hasLowercase ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasLowercase ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasLowercase ? 'text-slate-800 font-bold' : ''}>At least 1 lowercase letter</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] transition-colors ${hasNumber ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasNumber ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasNumber ? 'text-slate-800 font-bold' : ''}>At least 1 numeric digit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] transition-colors ${hasSpecial ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasSpecial ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasSpecial ? 'text-slate-800 font-bold' : ''}>At least 1 special character</span>
                                </div>
                            </div>
                        </div>

                        {/* Confirm New Password with Match Effect & Status Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-slate-700">Confirm New Password</label>
                                {isMatching && (
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                                        <span className="material-symbols-outlined text-[14px]">check_circle</span> Match
                                    </span>
                                )}
                            </div>

                            <div className="relative flex items-center">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'} required
                                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className={`block w-full pl-4 pr-16 h-12 rounded-xl border bg-slate-50 focus:bg-white outline-none transition-all text-sm font-medium text-slate-900 ${
                                        isMatching
                                            ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/20 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]'
                                            : isMismatch
                                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/20'
                                            : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                                    }`}
                                />
                                
                                <div className="absolute right-3 flex items-center gap-1.5">
                                    {/* Match Status Icon */}
                                    {isMatching && (
                                        <span className="material-symbols-outlined text-emerald-500 text-[20px] animate-scale-in">
                                            check_circle
                                        </span>
                                    )}
                                    {isMismatch && (
                                        <span className="material-symbols-outlined text-rose-500 text-[20px] animate-scale-in">
                                            cancel
                                        </span>
                                    )}

                                    {/* Show/Hide Button */}
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Match Progress Bar & Visual Feedback Box */}
                            {hasConfirm && (
                                <div className="mt-2.5 space-y-2 animate-fade-in">
                                    {/* Progress indicator bar */}
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                isMatching
                                                    ? 'w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-sm shadow-emerald-500/50'
                                                    : 'w-1/3 bg-rose-500'
                                            }`}
                                        />
                                    </div>

                                    {/* Status Pill */}
                                    {isMatching ? (
                                        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold shadow-sm">
                                            <span className="material-symbols-outlined text-emerald-600 text-[18px] flex-shrink-0">
                                                verified_user
                                            </span>
                                            <span>Passwords match! Ready to update.</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                                            <span className="material-symbols-outlined text-rose-500 text-[18px] flex-shrink-0">
                                                error
                                            </span>
                                            <span>Passwords do not match yet. Please double-check.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !allSatisfied || !isMatching}
                                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                        Updating Password...
                                    </>
                                ) : (
                                    <>
                                        <span>Update Password &amp; Continue</span>
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </>
                                )}
                            </button>
                            
                            <button 
                                type="button" 
                                onClick={logout}
                                className="w-full mt-3 text-sm font-semibold text-slate-500 hover:text-rose-600 py-2 transition-colors"
                            >
                                Sign Out Instead
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

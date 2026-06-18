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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const allSatisfied = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

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
            
            // Redirect to their dashboard
            navigate(getDefaultRoute(), { replace: true });
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
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Current/Temporary Password</label>
                            <input
                                type="password" required
                                value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                                className="block w-full px-4 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                            <input
                                type="password" required
                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                className="block w-full px-4 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900 mb-3"
                            />
                            
                            {/* Complexity checklist */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs font-semibold text-slate-600">
                                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">New Password Requirements</p>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] ${hasMinLength ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasMinLength ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasMinLength ? 'text-slate-800 font-bold' : ''}>At least 8 characters</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] ${hasUppercase ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasUppercase ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasUppercase ? 'text-slate-800 font-bold' : ''}>At least 1 uppercase letter</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] ${hasLowercase ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasLowercase ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasLowercase ? 'text-slate-800 font-bold' : ''}>At least 1 lowercase letter</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] ${hasNumber ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasNumber ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasNumber ? 'text-slate-800 font-bold' : ''}>At least 1 numeric digit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[16px] ${hasSpecial ? 'text-emerald-500 font-bold' : 'text-slate-300'}`}>
                                        {hasSpecial ? 'check' : 'circle'}
                                    </span>
                                    <span className={hasSpecial ? 'text-slate-800 font-bold' : ''}>At least 1 special character</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                            <input
                                type="password" required
                                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                className="block w-full px-4 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !allSatisfied || newPassword !== confirmPassword}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none transition-all"
                            >
                                {loading ? 'Updating...' : 'Update Password & Continue'}
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

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">New Password <span className="text-xs text-slate-400 font-normal ml-2">(Min 6 characters)</span></label>
                            <input
                                type="password" required
                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                className="block w-full px-4 h-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                            />
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
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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

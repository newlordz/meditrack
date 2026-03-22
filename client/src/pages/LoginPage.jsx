import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ROLE_ROUTES } from '../context/authConstants';
import MFAInput from '../components/MFAInput';
import { loginUser } from '../api/api';

const MAIN_ROLE_CARDS = [
    { key: 'patient', label: 'Patient', desc: 'View records & appointments', icon: 'person' },
    { key: 'doctor', label: 'Doctor', desc: 'Manage patients & charts', icon: 'stethoscope' },
    { key: 'pharmacist', label: 'Pharmacist', desc: 'Fill prescriptions & inventory', icon: 'medication' },
    { key: 'caregiver', label: 'Caregiver', desc: 'Coordinated care tools', icon: 'favorite' },
];

export default function LoginPage() {
    const { selectedRole, setSelectedRole, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const isAdminCredentials = email.trim() === '@admin';

        // Admin credentials only work when Admin role card is selected
        if (isAdminCredentials && selectedRole !== 'admin') {
            setError('Please select the Admin role to use admin credentials.');
            setIsLoading(false);
            return;
        }

        if (isAdminCredentials && selectedRole === 'admin') {
            if (password !== 'admin123') {
                setError('Invalid admin credentials. Please try again.');
                setIsLoading(false);
                return;
            }
            login({ email: '@admin', name: 'Admin (Receptionist)', id: 'ADMIN-001', role: 'admin' });
            setIsLoading(false);
            navigate('/admin/dashboard');
            return;
        }

        try {
            const userData = await loginUser(email, password);
            
            // Validate role if it's not admin
            if (userData.role !== selectedRole && userData.role) {
                const displayRole = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
                setError(`This account is registered as a ${displayRole}. Please select the ${displayRole} role card.`);
                setIsLoading(false);
                return;
            }

            if (userData.status === 'inactive') {
                setError('This account has been deactivated by an admin.');
                setIsLoading(false);
                return;
            }

            login({
                email: userData.email,
                name: userData.name,
                id: userData.id,
                userId: userData.userId,
                role: userData.role || selectedRole,
                mfaVerified: mfaCode.length === 6,
                mustChangePassword: userData.mustChangePassword,
            });
            setIsLoading(false);
            navigate(ROLE_ROUTES[selectedRole]);
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
            <div className="max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8 lg:gap-16 items-start">

                {/* Left: Branding & Role Selection */}
                <div className="flex flex-col gap-4 py-2 animate-fade-in">
                    {/* Logo and Admin */}
                    <div className="flex items-center justify-between pr-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2.5 rounded-xl shadow-sm">
                                <span className="material-symbols-outlined text-white text-[28px]">medical_services</span>
                            </div>
                            <h1 className="text-[34px] font-bold tracking-tight text-primary">MediTrack</h1>
                        </div>
                        
                        {/* Admin Access Button */}
                        <button
                            onClick={() => setSelectedRole('admin')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all border ${
                                selectedRole === 'admin'
                                    ? 'bg-[#e8f0fe] text-primary border-primary shadow-sm'
                                    : 'text-slate-500 bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm hover:text-primary'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                            <span className="hidden sm:inline">Admin Access</span>
                            <span className="sm:hidden">Admin</span>
                        </button>
                    </div>

                    {/* Welcome */}
                    <div className="space-y-1.5 mt-2">
                        <h2 className="text-[26px] font-bold text-slate-900">Welcome back</h2>
                        <p className="text-[15px] text-slate-500 leading-relaxed pr-8">
                            Please select your clinical role to access your personalized healthcare dashboard.
                        </p>
                    </div>

                    {/* Role Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {MAIN_ROLE_CARDS.map((role) => {
                            const isSelected = selectedRole === role.key;
                            return (
                                <button
                                    key={role.key}
                                    onClick={() => setSelectedRole(role.key)}
                                    className={`flex items-start gap-3 p-3 rounded-xl text-left relative overflow-hidden transition-all duration-200 group
                                        ${isSelected
                                            ? 'bg-white border-2 border-primary shadow-md'
                                            : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg tracking-wider">
                                            SELECTED
                                        </div>
                                    )}
                                    <div className={`p-2.5 rounded-lg transition-colors mt-0.5 whitespace-nowrap
                                        ${isSelected
                                            ? 'bg-[#e8f0fe] text-primary'  /* solid fallback for bg-primary-light */
                                            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-primary'
                                        }`}>
                                        <span className="material-symbols-outlined text-[20px] block">{role.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-0.5">{role.label}</h3>
                                        <p className="text-[11px] text-slate-500 leading-tight pr-2">{role.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Decorative Image Container */}
                    <div className="hidden lg:block relative mt-6 rounded-2xl overflow-hidden shadow-sm border border-slate-200 h-[220px]">
                        {/* Placeholder gradient mimicking the image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-100 to-slate-50 opacity-80" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[url('https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-multiply"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 shadow-sm border border-white">
                                <span className="material-symbols-outlined text-primary/60 text-2xl">local_hospital</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-600 tracking-wide uppercase bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white">Secure Healthcare Platform</p>
                        </div>
                    </div>
                </div>

                {/* Right: Login Form Wrapper */}
                <div className="w-full flex flex-col gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {/* Main Auth Card */}
                    <div className="bg-white p-5 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 relative overflow-hidden">
                        {/* Form Header */}
                        <div className="mb-4">
                            <h2 className="text-[24px] font-bold text-slate-900 mb-1 leading-tight">Secure Sign In</h2>
                            <p className="text-[14px] text-slate-500 leading-normal">Enter your credentials to continue.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-[14px] font-semibold text-slate-700 mb-1.5" htmlFor="login-email">
                                    Email or Medical ID
                                </label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px] pointer-events-none">
                                        alternate_email
                                    </span>
                                    <input
                                        id="login-email"
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="e.g. dr.smith@meditrack.com"
                                        className="w-full pl-10 pr-4 h-[42px] rounded-xl border border-slate-200 bg-slate-50
                                            focus:bg-white focus:ring-2 focus:ring-[#e8f0fe] focus:border-primary transition-all text-[14px] outline-none placeholder:text-slate-400 leading-normal"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[14px] font-semibold text-slate-700" htmlFor="login-password">Password</label>
                                    <button type="button" className="text-[13px] text-primary font-bold hover:underline transition-all">Forgot password?</button>
                                </div>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px] pointer-events-none">
                                        lock
                                    </span>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 h-[42px] rounded-xl border border-slate-200 bg-slate-50
                                            focus:bg-white focus:ring-2 focus:ring-[#e8f0fe] focus:border-primary transition-all text-[14px] outline-none tracking-widest placeholder:tracking-normal placeholder:text-slate-400 leading-normal"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-2 rounded-lg"
                                    >
                                        <span className="material-symbols-outlined text-[18px] block">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* MFA Section */}
                            <div className="pt-2">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                                    <span className="text-[14px] font-bold text-slate-900 leading-normal">Multi-Factor Authentication</span>
                                </div>
                                <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
                                    Enter the 6-digit code from your authenticator app or SMS.
                                </p>
                                <div className="flex items-center">
                                    <MFAInput length={6} onComplete={(code) => setMfaCode(code)} />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                                    <span className="material-symbols-outlined text-rose-500 text-[18px] flex-shrink-0">error</span>
                                    <p className="text-[13px] text-rose-700 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#0056b2] hover:bg-[#004494] text-white font-bold h-[44px] px-4 rounded-xl
                                    transition-all shadow-lg shadow-[#0056b2]/25 mt-3 flex items-center justify-center gap-2 text-[15px]
                                    disabled:opacity-70 disabled:cursor-not-allowed leading-normal"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Secure Access
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Auth Form Footer Links */}
                        <div className="mt-5 text-center">
                            <p className="text-[11px] text-slate-400 mb-2 leading-normal">© 2024 MediTrack Solutions. All rights reserved.</p>
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                                <a href="#" className="hover:text-slate-600 transition-colors font-medium">Privacy Policy</a>
                                <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                                <a href="#" className="hover:text-slate-600 transition-colors font-medium">Terms of Service</a>
                                <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                                <a href="#" className="hover:text-slate-600 transition-colors font-medium">Contact Support</a>
                            </div>
                        </div>
                    </div>

                    {/* External Security Note */}
                    <div className="px-4 py-3 bg-[#f8fafc] rounded-2xl border border-slate-200 flex items-start sm:items-center gap-3">
                        <span className="material-symbols-outlined text-[#0056b2] text-[20px] flex-shrink-0">info</span>
                        <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                            This portal uses 256-bit encryption. For security reasons, please log out after your session.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useSiteContent } from '../context/SiteContentContext';
import { ROLE_ROUTES } from '../context/authConstants';
import MFAInput from '../components/MFAInput';
import ContentModal from '../components/ContentModal';
import { loginUser, verifyMfa, submitPasswordResetRequest } from '../api/api';

const MAIN_ROLE_CARDS = [
    { key: 'patient', label: 'Patient', desc: 'View records & appointments', icon: 'person' },
    { key: 'doctor', label: 'Doctor', desc: 'Manage patients & charts', icon: 'stethoscope' },
    { key: 'pharmacist', label: 'Pharmacist', desc: 'Fill prescriptions & inventory', icon: 'medication' },
    { key: 'caregiver', label: 'Caregiver', desc: 'Coordinated care tools', icon: 'favorite' },
];

export default function LoginPage() {
    const { selectedRole, setSelectedRole, login } = useAuth();
    const { content } = useSiteContent();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Content Modals
    const [activeModal, setActiveModal] = useState(null);

    const branding = content?.branding || {};
    const loginExp = content?.login_experience || {};
    const policies = content?.policies || {};
    const roleCards = (loginExp.roleCards && loginExp.roleCards.length > 0) ? loginExp.roleCards : MAIN_ROLE_CARDS;
    const hero = loginExp.hero || {};
    
    // MFA States
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaUserId, setMfaUserId] = useState('');

    const [error, setError] = useState('');
    
    // Forgot Password Flow
    const [isForgotOpen, setIsForgotOpen] = useState(false);
    const [forgotForm, setForgotForm] = useState({ name: '', username: '', role: 'patient' });
    const [forgotStatus, setForgotStatus] = useState({ loading: false, msg: '', error: '' });

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotStatus({ loading: true, msg: '', error: '' });
        try {
            await submitPasswordResetRequest(forgotForm);
            setForgotStatus({ loading: false, msg: 'Request submitted successfully. An admin will review it.', error: '' });
            setTimeout(() => {
                setIsForgotOpen(false);
                setForgotStatus({ loading: false, msg: '', error: '' });
                setForgotForm({ name: '', username: '', role: 'patient' });
            }, 3000);
        } catch (err) {
            setForgotStatus({ loading: false, msg: '', error: err.message || 'Failed to submit request.' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (mfaRequired) {
            try {
                const userData = await verifyMfa(mfaUserId, mfaCode);
                login({
                    email: userData.email,
                    name: userData.name,
                    id: userData.id,
                    userId: userData.userId,
                    role: userData.role || selectedRole,
                    mfaVerified: true,
                    mustChangePassword: userData.mustChangePassword,
                    profileCompleted: userData.profileCompleted,
                });
                setIsLoading(false);
                if (userData.mustChangePassword) {
                    navigate('/force-password-reset');
                } else if ((userData.role || selectedRole) === 'patient' && !userData.profileCompleted) {
                    navigate('/patient/onboarding');
                } else {
                    navigate(ROLE_ROUTES[selectedRole]);
                }
            } catch (err) {
                setError(err.message || 'Invalid MFA code. Please try again.');
                setIsLoading(false);
            }
            return;
        }

        let loginIdentifier = email.trim();
        // If identifier does not contain an '@' sign (i.e. not an email), treat it as a medical ID and prepend '@'
        if (!loginIdentifier.includes('@') && loginIdentifier.length > 0) {
            loginIdentifier = '@' + loginIdentifier;
        }

        const isAdminCredentials = loginIdentifier === '@admin';

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
            login({ email: '@admin', name: 'Admin (Receptionist)', id: 'ADMIN-001', role: 'admin', profileCompleted: true });
            setIsLoading(false);
            navigate('/admin/dashboard');
            return;
        }

        try {
            const userData = await loginUser(loginIdentifier, password);
            
            if (userData.requireMfa) {
                setMfaUserId(userData.userId);
                setMfaRequired(true);
                setIsLoading(false);
                return;
            }
            
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
                mfaVerified: false,
                mustChangePassword: userData.mustChangePassword,
                profileCompleted: userData.profileCompleted,
            });
            setIsLoading(false);
            if (userData.mustChangePassword) {
                navigate('/force-password-reset');
            } else if ((userData.role || selectedRole) === 'patient' && !userData.profileCompleted) {
                navigate('/patient/onboarding');
            } else {
                navigate(ROLE_ROUTES[selectedRole]);
            }
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
                            <div className="bg-primary p-2.5 rounded-xl shadow-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[28px]">
                                    {branding.logoIcon || 'medical_services'}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-[34px] font-bold tracking-tight text-primary leading-none">
                                    {branding.siteName || 'MediTrack'}
                                </h1>
                                {branding.hospitalName && (
                                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{branding.hospitalName}</p>
                                )}
                            </div>
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
                        <h2 className="text-[26px] font-bold text-slate-900">
                            {loginExp.welcomeTitle || 'Welcome back'}
                        </h2>
                        <p className="text-[15px] text-slate-500 leading-relaxed pr-8">
                            {loginExp.welcomeSubtitle || 'Please select your clinical role to access your personalized healthcare dashboard.'}
                        </p>
                    </div>

                    {/* Role Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {roleCards.map((role) => {
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
                                            ? 'bg-[#e8f0fe] text-primary'
                                            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-primary'
                                        }`}>
                                        <span className="material-symbols-outlined text-[20px] block">{role.icon || 'person'}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 mb-0.5 truncate">{role.label}</h3>
                                        <p className="text-[11px] text-slate-500 leading-tight pr-2 line-clamp-2">{role.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Decorative Showcase Hero Banner */}
                    <div className="hidden lg:block relative mt-6 rounded-2xl overflow-hidden shadow-sm border border-slate-200 h-[220px]">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-slate-900/20 z-10" />
                        <img
                            src={hero.imageUrl || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop'}
                            alt="MediTrack Security"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-2.5 shadow-sm border border-white/30 text-white">
                                <span className="material-symbols-outlined text-2xl">
                                    {branding.logoIcon || 'local_hospital'}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-white tracking-wide uppercase bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                {hero.badgeText || 'Secure Healthcare Platform'}
                            </span>
                            <p className="text-sm font-bold text-white mt-2 drop-shadow-sm max-w-xs">
                                {hero.headline || 'End-to-end intelligent medication tracking'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Login Form Wrapper */}
                <div className="w-full flex flex-col gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {/* Main Auth Card */}
                    <div className="bg-white p-5 sm:p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 relative overflow-hidden">
                        {/* Form Header */}
                        <div className="mb-4">
                            <h2 className="text-[24px] font-bold text-slate-900 mb-1 leading-tight">
                                {mfaRequired ? 'Security Verification' : 'Secure Sign In'}
                            </h2>
                            <p className="text-[14px] text-slate-500 leading-normal">
                                {mfaRequired ? 'Enter the verification code to continue.' : 'Enter your credentials to continue.'}
                            </p>
                        </div>

                        {mfaRequired ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <button type="button" onClick={() => setMfaRequired(false)} className="text-slate-400 hover:text-slate-600 mr-2 flex items-center transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                        </button>
                                        <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                                        <span className="text-[14px] font-bold text-slate-900 leading-normal">Multi-Factor Authentication</span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
                                        A 6-digit verification code is required. Enter the code from your authenticator app to authorize your session.
                                    </p>
                                    <div className="flex items-center justify-center py-2 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
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
                                    disabled={isLoading || mfaCode.length !== 6}
                                    className="w-full bg-[#0056b2] hover:bg-[#004494] text-white font-bold h-[44px] px-4 rounded-xl
                                        transition-all shadow-lg shadow-[#0056b2]/25 mt-3 flex items-center justify-center gap-2 text-[15px]
                                        disabled:opacity-70 disabled:cursor-not-allowed leading-normal"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify &amp; Sign In
                                            <span className="material-symbols-outlined text-[18px]">login</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-[14px] font-semibold text-slate-700 mb-1.5" htmlFor="login-email">
                                        Email, Medical ID, or Staff Number
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
                                        <button type="button" onClick={() => setIsForgotOpen(true)} className="text-[13px] text-primary font-bold hover:underline transition-all">Forgot password?</button>
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
                        )}

                        {/* Auth Form Footer Links */}
                        <div className="mt-5 text-center">
                            <p className="text-[11px] text-slate-400 mb-2 leading-normal">
                                {loginExp.footerCopyright || '© 2024 MediTrack Solutions. All rights reserved.'}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal('privacy')}
                                    className="hover:text-primary transition-colors font-semibold"
                                >
                                    Privacy Policy
                                </button>
                                <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                                <button
                                    type="button"
                                    onClick={() => setActiveModal('terms')}
                                    className="hover:text-primary transition-colors font-semibold"
                                >
                                    Terms of Service
                                </button>
                                <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                                <button
                                    type="button"
                                    onClick={() => setActiveModal('support')}
                                    className="hover:text-primary transition-colors font-semibold"
                                >
                                    Contact Support
                                </button>
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

            {/* Forgot Password Modal */}
            {isForgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-[18px] font-bold text-slate-900">Request Password Reset</h3>
                            <button onClick={() => setIsForgotOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-[14px] text-slate-500 mb-5 leading-relaxed">
                                Enter your details below. An administrator will review your request and issue a temporary password if approved.
                            </p>
                            
                            {forgotStatus.msg && (
                                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-700 text-[13px] font-medium">
                                    <span className="material-symbols-outlined text-[16px] mt-0.5">check_circle</span>
                                    {forgotStatus.msg}
                                </div>
                            )}
                            {forgotStatus.error && (
                                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-[13px] font-medium">
                                    <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
                                    {forgotStatus.error}
                                </div>
                            )}

                            <form onSubmit={handleForgotSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Full Name</label>
                                    <input required type="text" value={forgotForm.name} onChange={(e) => setForgotForm({ ...forgotForm, name: e.target.value })} 
                                        className="w-full h-[40px] px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#e8f0fe] focus:border-primary transition-all text-[14px] outline-none" 
                                        placeholder="e.g. John Doe" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email, Medical ID, or Staff Number</label>
                                    <input required type="text" value={forgotForm.username} onChange={(e) => setForgotForm({ ...forgotForm, username: e.target.value })} 
                                        className="w-full h-[40px] px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#e8f0fe] focus:border-primary transition-all text-[14px] outline-none" 
                                        placeholder="e.g. john@email.com, @johndoe, or MDT123456" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Your Role</label>
                                    <select required value={forgotForm.role} onChange={(e) => setForgotForm({ ...forgotForm, role: e.target.value })}
                                        className="w-full h-[40px] px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#e8f0fe] focus:border-primary transition-all text-[14px] outline-none">
                                        <option value="patient">Patient</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="pharmacist">Pharmacist</option>
                                        <option value="caregiver">Caregiver</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={forgotStatus.loading} className="w-full h-[44px] bg-[#0056b2] hover:bg-[#004494] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {forgotStatus.loading ? (
                                        <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Submitting...</>
                                    ) : 'Submit Request'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Policy Modal */}
            <ContentModal
                isOpen={activeModal === 'privacy'}
                onClose={() => setActiveModal(null)}
                title={policies.privacyPolicy?.title || 'Privacy Policy & HIPAA Compliance'}
                subtitle={`Last updated: ${policies.privacyPolicy?.lastUpdated || 'September 2024'}`}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0">verified_user</span>
                        <p className="text-xs text-blue-950 font-medium">
                            MediTrack operates under strict HIPAA compliance rules and end-to-end cryptographic data protection standards.
                        </p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {policies.privacyPolicy?.content || 'No privacy policy details provided.'}
                    </p>
                </div>
            </ContentModal>

            {/* Terms of Service Modal */}
            <ContentModal
                isOpen={activeModal === 'terms'}
                onClose={() => setActiveModal(null)}
                title={policies.termsOfService?.title || 'Terms of Service & Clinical Guidelines'}
                subtitle={`Last updated: ${policies.termsOfService?.lastUpdated || 'September 2024'}`}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-600 text-[22px] flex-shrink-0">gavel</span>
                        <p className="text-xs text-amber-950 font-medium">
                            Please review our standard medical protocols, patient consent procedures, and physician responsibility guidelines.
                        </p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {policies.termsOfService?.content || 'No terms of service details provided.'}
                    </p>
                </div>
            </ContentModal>

            {/* Help & Support Modal */}
            <ContentModal
                isOpen={activeModal === 'support'}
                onClose={() => setActiveModal(null)}
                title={policies.contactSupport?.title || 'Help & Clinical Support Center'}
                subtitle={branding.siteName ? `${branding.siteName} Patient & Provider Assistance` : 'Assistance'}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-rose-500 text-[22px] flex-shrink-0">emergency</span>
                        <div>
                            <p className="text-xs font-bold text-rose-950">Emergency Notice</p>
                            <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                                {policies.contactSupport?.emergencyNotice || 'If you are experiencing a life-threatening medical emergency, please dial emergency services (911) immediately.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                            <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Support Hotline</p>
                            <p className="text-sm font-black text-slate-900">{branding.supportPhone || '+1 (800) 555-MEDI'}</p>
                        </div>
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                            <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Clinical Email</p>
                            <p className="text-sm font-black text-slate-900 truncate">{branding.supportEmail || 'support@meditrack.gov.gh'}</p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold">Operational Hours:</span>
                        <span className="font-bold text-slate-900">{branding.operationalHours || 'Mon - Sun: 24/7 Support'}</span>
                    </div>
                </div>
            </ContentModal>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useSiteContent } from '../../context/SiteContentContext';

const TABS = [
    { id: 'branding', label: 'Brand & Hospital Info', icon: 'branding_watermark', desc: 'Platform name, logo icon, support hotline & hours' },
    { id: 'login', label: 'Login & Welcome Portal', icon: 'login', desc: 'Welcome headlines, role cards, and hero showcase banner' },
    { id: 'broadcast', label: 'Broadcast Announcement', icon: 'campaign', desc: 'Global alert banner across portal and logins' },
    { id: 'policies', label: 'Legal & Support Pages', icon: 'gavel', desc: 'Privacy policy, terms of service, and support directory' },
    { id: 'dashboards', label: 'Dashboard Notices', icon: 'view_quilt', desc: 'Custom banners shown on role-specific dashboards' },
];

export default function PageManagerView({ showToast }) {
    const { content, updateSection, resetSection, resetAll, isLoading } = useSiteContent();
    const [activeTab, setActiveTab] = useState('branding');
    const [isSaving, setIsSaving] = useState(false);
    const [showLivePreview, setShowLivePreview] = useState(true);

    // Local form states per tab
    const [brandingForm, setBrandingForm] = useState(content?.branding || {});
    const [loginForm, setLoginForm] = useState(content?.login_experience || {});
    const [broadcastForm, setBroadcastForm] = useState(content?.broadcast_banner || {});
    const [policiesForm, setPoliciesForm] = useState(content?.policies || {});
    const [dashboardsForm, setDashboardsForm] = useState(content?.dashboard_notices || {});

    // Sync form state when remote content loads or changes
    useEffect(() => {
        if (content?.branding) setBrandingForm(content.branding);
        if (content?.login_experience) setLoginForm(content.login_experience);
        if (content?.broadcast_banner) setBroadcastForm(content.broadcast_banner);
        if (content?.policies) setPoliciesForm(content.policies);
        if (content?.dashboard_notices) setDashboardsForm(content.dashboard_notices);
    }, [content]);

    const handleSave = async (key, formData) => {
        setIsSaving(true);
        try {
            await updateSection(key, formData);
            showToast?.(`"${TABS.find(t => t.id === key)?.label || key}" saved successfully!`, 'success');
        } catch (err) {
            console.error(err);
            showToast?.(`Failed to save: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = async (key) => {
        if (!window.confirm(`Reset "${TABS.find(t => t.id === key)?.label}" back to factory defaults?`)) return;
        setIsSaving(true);
        try {
            await resetSection(key);
            showToast?.(`Section reset to defaults!`, 'success');
        } catch (err) {
            console.error(err);
            showToast?.(`Failed to reset: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetEntireSite = async () => {
        if (!window.confirm('WARNING: Are you sure you want to restore ALL website sections back to factory defaults? Any custom branding, banners, and text will be reverted.')) return;
        setIsSaving(true);
        try {
            await resetAll();
            showToast?.('All website sections restored to factory defaults!', 'success');
        } catch (err) {
            console.error(err);
            showToast?.(`Failed to reset website: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const updateRoleCard = (index, field, value) => {
        setLoginForm(prev => {
            const updatedCards = [...(prev.roleCards || [])];
            updatedCards[index] = { ...updatedCards[index], [field]: value };
            return { ...prev, roleCards: updatedCards };
        });
    };

    const updateHeroField = (field, value) => {
        setLoginForm(prev => ({
            ...prev,
            hero: {
                ...(prev.hero || {}),
                [field]: value,
            },
        }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                <span className="material-symbols-outlined text-4xl animate-spin text-amber-500">progress_activity</span>
                <p className="text-sm font-semibold">Loading Page Manager...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Admin Portal</span>
                        <span className="text-slate-300">›</span>
                        <span className="text-xs font-semibold text-slate-500">Page Manager</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">Page &amp; Content Manager</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Customize branding, hero sections, role cards, announcements, and legal policies in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowLivePreview(!showLivePreview)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                            showLivePreview
                                ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {showLivePreview ? 'visibility' : 'visibility_off'}
                        </span>
                        {showLivePreview ? 'Hide Preview' : 'Show Live Preview'}
                    </button>

                    <button
                        type="button"
                        onClick={handleResetEntireSite}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                        title="Reset all sections to factory default"
                    >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        Reset All
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-3.5 rounded-2xl text-left border transition-all duration-200 flex flex-col gap-1.5 ${
                                isActive
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                    : 'bg-white text-slate-600 border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/40'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-amber-600'}`}>
                                    {tab.icon}
                                </span>
                                {isActive && (
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                )}
                            </div>
                            <span className="font-bold text-xs leading-tight line-clamp-1">{tab.label}</span>
                            <span className={`text-[10px] line-clamp-1 ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>
                                {tab.desc}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Body & Live Preview Layout */}
            <div className={`grid grid-cols-1 ${showLivePreview ? 'lg:grid-cols-12' : ''} gap-6 items-start`}>
                
                {/* Form Editor Area */}
                <div className={showLivePreview ? 'lg:col-span-7' : 'w-full'}>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        
                        {/* TAB 1: BRANDING */}
                        {activeTab === 'branding' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave('branding', brandingForm);
                                }}
                                className="space-y-5"
                            >
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Brand Identity &amp; Clinic Information</h3>
                                        <p className="text-xs text-slate-500">General platform name, logo icon, and support contact details.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleReset('branding')}
                                        className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 font-semibold"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                        Reset
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Platform Name</label>
                                        <input
                                            type="text"
                                            value={brandingForm.siteName || ''}
                                            onChange={(e) => setBrandingForm(b => ({ ...b, siteName: e.target.value }))}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="e.g. MediTrack"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Material Symbol Logo Icon</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={brandingForm.logoIcon || ''}
                                                onChange={(e) => setBrandingForm(b => ({ ...b, logoIcon: e.target.value }))}
                                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                                placeholder="e.g. medical_services, local_hospital"
                                            />
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                <span className="material-symbols-outlined text-[22px]">{brandingForm.logoIcon || 'medical_services'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Organization Network Name</label>
                                    <input
                                        type="text"
                                        value={brandingForm.hospitalName || ''}
                                        onChange={(e) => setBrandingForm(b => ({ ...b, hospitalName: e.target.value }))}
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="e.g. MediTrack Health Network"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Brand Tagline / Header Badge</label>
                                    <input
                                        type="text"
                                        value={brandingForm.tagline || ''}
                                        onChange={(e) => setBrandingForm(b => ({ ...b, tagline: e.target.value }))}
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="e.g. Intelligent Medication Adherence & Clinical Coordination"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Emergency / Support Hotline</label>
                                        <input
                                            type="text"
                                            value={brandingForm.supportPhone || ''}
                                            onChange={(e) => setBrandingForm(b => ({ ...b, supportPhone: e.target.value }))}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="+1 (800) 555-MEDI"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Support Email</label>
                                        <input
                                            type="email"
                                            value={brandingForm.supportEmail || ''}
                                            onChange={(e) => setBrandingForm(b => ({ ...b, supportEmail: e.target.value }))}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="support@meditrack.gov.gh"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Operational Support Hours</label>
                                    <input
                                        type="text"
                                        value={brandingForm.operationalHours || ''}
                                        onChange={(e) => setBrandingForm(b => ({ ...b, operationalHours: e.target.value }))}
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="Mon - Sun: 24/7 Clinical Support"
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Save Brand Changes
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB 2: LOGIN & WELCOME PORTAL */}
                        {activeTab === 'login' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave('login_experience', loginForm);
                                }}
                                className="space-y-6"
                            >
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Login &amp; Welcome Portal Customization</h3>
                                        <p className="text-xs text-slate-500">Edit greeting text, role selection cards, and the right showcase banner.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleReset('login_experience')}
                                        className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 font-semibold"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                        Reset
                                    </button>
                                </div>

                                {/* Greeting section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Welcome Text</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Welcome Headline</label>
                                            <input
                                                type="text"
                                                value={loginForm.welcomeTitle || ''}
                                                onChange={(e) => setLoginForm(l => ({ ...l, welcomeTitle: e.target.value }))}
                                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                                placeholder="e.g. Welcome back"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Footer Copyright Line</label>
                                            <input
                                                type="text"
                                                value={loginForm.footerCopyright || ''}
                                                onChange={(e) => setLoginForm(l => ({ ...l, footerCopyright: e.target.value }))}
                                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                                placeholder="© 2024 MediTrack Solutions. All rights reserved."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Instruction Subtitle</label>
                                        <textarea
                                            rows={2}
                                            value={loginForm.welcomeSubtitle || ''}
                                            onChange={(e) => setLoginForm(l => ({ ...l, welcomeSubtitle: e.target.value }))}
                                            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="Please select your clinical role to access your personalized healthcare dashboard."
                                        />
                                    </div>
                                </div>

                                {/* Role Cards customizer */}
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Role Selection Cards</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(loginForm.roleCards || []).map((card, idx) => (
                                            <div key={card.key || idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                                                        {card.key} Card
                                                    </span>
                                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">{card.icon}</span>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Label</label>
                                                    <input
                                                        type="text"
                                                        value={card.label || ''}
                                                        onChange={(e) => updateRoleCard(idx, 'label', e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Description</label>
                                                    <input
                                                        type="text"
                                                        value={card.desc || ''}
                                                        onChange={(e) => updateRoleCard(idx, 'desc', e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">Material Icon Name</label>
                                                    <input
                                                        type="text"
                                                        value={card.icon || ''}
                                                        onChange={(e) => updateRoleCard(idx, 'icon', e.target.value)}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Feature Showcase Hero */}
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Feature Showcase Banner (Right Card)</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Headline Badge</label>
                                            <input
                                                type="text"
                                                value={loginForm.hero?.badgeText || ''}
                                                onChange={(e) => updateHeroField('badgeText', e.target.value)}
                                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                                placeholder="e.g. Secure Healthcare Platform"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Background Image URL</label>
                                            <input
                                                type="text"
                                                value={loginForm.hero?.imageUrl || ''}
                                                onChange={(e) => updateHeroField('imageUrl', e.target.value)}
                                                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Hero Title</label>
                                        <input
                                            type="text"
                                            value={loginForm.hero?.headline || ''}
                                            onChange={(e) => updateHeroField('headline', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="e.g. Secure Healthcare Platform"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                                        <textarea
                                            rows={2}
                                            value={loginForm.hero?.description || ''}
                                            onChange={(e) => updateHeroField('description', e.target.value)}
                                            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="Overview of platform benefits..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Save Portal Layout
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB 3: BROADCAST ANNOUNCEMENT */}
                        {activeTab === 'broadcast' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave('broadcast_banner', broadcastForm);
                                }}
                                className="space-y-5"
                            >
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Global Broadcast Announcement</h3>
                                        <p className="text-xs text-slate-500">Display top notification banners for scheduled maintenance, emergency updates, or announcements.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleReset('broadcast_banner')}
                                        className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 font-semibold"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                        Reset
                                    </button>
                                </div>

                                {/* Enable / Disable Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <span className={`material-symbols-outlined text-2xl ${broadcastForm.enabled ? 'text-amber-500' : 'text-slate-400'}`}>
                                            campaign
                                        </span>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">Banner Visibility</p>
                                            <p className="text-xs text-slate-500">Toggle whether this broadcast banner is displayed across the platform.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!broadcastForm.enabled}
                                            onChange={(e) => setBroadcastForm(b => ({ ...b, enabled: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Banner Type / Severity</label>
                                        <select
                                            value={broadcastForm.type || 'info'}
                                            onChange={(e) => setBroadcastForm(b => ({ ...b, type: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none bg-white"
                                        >
                                            <option value="info">Informational (Blue)</option>
                                            <option value="warning">Warning / Alert (Amber)</option>
                                            <option value="critical">Critical / Emergency (Rose / Red)</option>
                                            <option value="success">Success / Operational (Green)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                                        <select
                                            value={broadcastForm.audience || 'all'}
                                            onChange={(e) => setBroadcastForm(b => ({ ...b, audience: e.target.value }))}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none bg-white"
                                        >
                                            <option value="all">Everyone (All Visitors &amp; Roles)</option>
                                            <option value="patient">Patients Only</option>
                                            <option value="doctor">Doctors / Clinicians Only</option>
                                            <option value="pharmacist">Pharmacists Only</option>
                                            <option value="caregiver">Caregivers Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Banner Tag / Title</label>
                                    <input
                                        type="text"
                                        value={broadcastForm.title || ''}
                                        onChange={(e) => setBroadcastForm(b => ({ ...b, title: e.target.value }))}
                                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="e.g. Scheduled Maintenance, Health Alert"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Message</label>
                                    <textarea
                                        rows={2}
                                        value={broadcastForm.message || ''}
                                        onChange={(e) => setBroadcastForm(b => ({ ...b, message: e.target.value }))}
                                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="Enter the broadcast message here..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Call to Action Link Text</label>
                                        <input
                                            type="text"
                                            value={broadcastForm.linkText || ''}
                                            onChange={(e) => setBroadcastForm(b => ({ ...b, linkText: e.target.value }))}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="e.g. Read Advisory"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Call to Action URL</label>
                                        <input
                                            type="text"
                                            value={broadcastForm.linkUrl || ''}
                                            onChange={(e) => setBroadcastForm(b => ({ ...b, linkUrl: e.target.value }))}
                                            className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="dismissible"
                                        checked={!!broadcastForm.dismissible}
                                        onChange={(e) => setBroadcastForm(b => ({ ...b, dismissible: e.target.checked }))}
                                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                                    />
                                    <label htmlFor="dismissible" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                        Allow users to dismiss the banner during their session
                                    </label>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">campaign</span>
                                        Publish Announcement
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB 4: POLICIES & LEGAL */}
                        {activeTab === 'policies' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave('policies', policiesForm);
                                }}
                                className="space-y-6"
                            >
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Legal Policies &amp; Help Guides</h3>
                                        <p className="text-xs text-slate-500">Edit content rendered in modals when clicking Privacy Policy, Terms, or Support.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleReset('policies')}
                                        className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 font-semibold"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                        Reset
                                    </button>
                                </div>

                                {/* Privacy Policy */}
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Privacy Policy</h4>
                                        <span className="material-symbols-outlined text-amber-600 text-[18px]">security</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={policiesForm.privacyPolicy?.title || ''}
                                                onChange={(e) => setPoliciesForm(p => ({ ...p, privacyPolicy: { ...p.privacyPolicy, title: e.target.value } }))}
                                                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Last Updated</label>
                                            <input
                                                type="text"
                                                value={policiesForm.privacyPolicy?.lastUpdated || ''}
                                                onChange={(e) => setPoliciesForm(p => ({ ...p, privacyPolicy: { ...p.privacyPolicy, lastUpdated: e.target.value } }))}
                                                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Content</label>
                                        <textarea
                                            rows={3}
                                            value={policiesForm.privacyPolicy?.content || ''}
                                            onChange={(e) => setPoliciesForm(p => ({ ...p, privacyPolicy: { ...p.privacyPolicy, content: e.target.value } }))}
                                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                {/* Terms of Service */}
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Terms of Service</h4>
                                        <span className="material-symbols-outlined text-amber-600 text-[18px]">gavel</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={policiesForm.termsOfService?.title || ''}
                                                onChange={(e) => setPoliciesForm(p => ({ ...p, termsOfService: { ...p.termsOfService, title: e.target.value } }))}
                                                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">Last Updated</label>
                                            <input
                                                type="text"
                                                value={policiesForm.termsOfService?.lastUpdated || ''}
                                                onChange={(e) => setPoliciesForm(p => ({ ...p, termsOfService: { ...p.termsOfService, lastUpdated: e.target.value } }))}
                                                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Content</label>
                                        <textarea
                                            rows={3}
                                            value={policiesForm.termsOfService?.content || ''}
                                            onChange={(e) => setPoliciesForm(p => ({ ...p, termsOfService: { ...p.termsOfService, content: e.target.value } }))}
                                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                {/* Support Center */}
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider">Help &amp; Support Modal Content</h4>
                                        <span className="material-symbols-outlined text-amber-600 text-[18px]">contact_support</span>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Hospital Notice</label>
                                        <textarea
                                            rows={2}
                                            value={policiesForm.contactSupport?.emergencyNotice || ''}
                                            onChange={(e) => setPoliciesForm(p => ({ ...p, contactSupport: { ...p.contactSupport, emergencyNotice: e.target.value } }))}
                                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Save Legal &amp; Policies
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* TAB 5: DASHBOARD NOTICES */}
                        {activeTab === 'dashboards' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave('dashboard_notices', dashboardsForm);
                                }}
                                className="space-y-6"
                            >
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Role Dashboard Bulletins</h3>
                                        <p className="text-xs text-slate-500">Configure role-specific highlight notices that show on user dashboards.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleReset('dashboard_notices')}
                                        className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 font-semibold"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                                        Reset
                                    </button>
                                </div>

                                {['patient', 'doctor', 'pharmacist', 'caregiver'].map(role => {
                                    const notice = dashboardsForm[role] || {};
                                    const roleColors = {
                                        patient: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                                        doctor: 'text-blue-700 bg-blue-50 border-blue-200',
                                        pharmacist: 'text-purple-700 bg-purple-50 border-purple-200',
                                        caregiver: 'text-rose-700 bg-rose-50 border-rose-200',
                                    };
                                    return (
                                        <div key={role} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${roleColors[role] || ''}`}>
                                                    {role} Dashboard Notice
                                                </span>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!notice.enabled}
                                                        onChange={(e) => setDashboardsForm(d => ({
                                                            ...d,
                                                            [role]: { ...notice, enabled: e.target.checked }
                                                        }))}
                                                        className="rounded text-amber-500 focus:ring-amber-400"
                                                    />
                                                    <span className="text-xs font-semibold text-slate-600">Active</span>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Notice Title</label>
                                                    <input
                                                        type="text"
                                                        value={notice.title || ''}
                                                        onChange={(e) => setDashboardsForm(d => ({
                                                            ...d,
                                                            [role]: { ...notice, title: e.target.value }
                                                        }))}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Message</label>
                                                    <input
                                                        type="text"
                                                        value={notice.message || ''}
                                                        onChange={(e) => setDashboardsForm(d => ({
                                                            ...d,
                                                            [role]: { ...notice, message: e.target.value }
                                                        }))}
                                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Save Dashboard Notices
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Live Preview Panel */}
                {showLivePreview && (
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-4 sticky top-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Preview</span>
                                </div>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-mono">
                                    {activeTab}
                                </span>
                            </div>

                            {/* CONTEXTUAL LIVE PREVIEW CONTENT */}
                            {activeTab === 'policies' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Policy & Support Modal Preview</p>
                                        <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">User-facing Dialog</span>
                                    </div>

                                    {/* Privacy Policy Card */}
                                    <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[15px]">security</span>
                                                </span>
                                                <div>
                                                    <h6 className="text-xs font-bold text-white">{policiesForm.privacyPolicy?.title || 'Privacy Policy'}</h6>
                                                    <span className="text-[9px] text-amber-400/80 font-mono">Updated: {policiesForm.privacyPolicy?.lastUpdated || 'Current'}</span>
                                                </div>
                                            </div>
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">Active</span>
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto pr-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                                            {policiesForm.privacyPolicy?.content || 'No content specified.'}
                                        </p>
                                    </div>

                                    {/* Terms of Service Card */}
                                    <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[15px]">gavel</span>
                                                </span>
                                                <div>
                                                    <h6 className="text-xs font-bold text-white">{policiesForm.termsOfService?.title || 'Terms of Service'}</h6>
                                                    <span className="text-[9px] text-blue-400/80 font-mono">Updated: {policiesForm.termsOfService?.lastUpdated || 'Current'}</span>
                                                </div>
                                            </div>
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">Active</span>
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto pr-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                                            {policiesForm.termsOfService?.content || 'No content specified.'}
                                        </p>
                                    </div>

                                    {/* Emergency & Support Card */}
                                    <div className="bg-rose-950/30 p-3.5 rounded-2xl border border-rose-900/40 space-y-2">
                                        <div className="flex items-center gap-2 text-rose-400">
                                            <span className="material-symbols-outlined text-[16px]">contact_support</span>
                                            <h6 className="text-xs font-bold">Help & Emergency Protocol</h6>
                                        </div>
                                        <p className="text-[10px] text-rose-200/90 leading-relaxed">
                                            {policiesForm.contactSupport?.emergencyNotice || 'For life-threatening emergencies, call 911 immediately.'}
                                        </p>
                                        <div className="pt-2 border-t border-rose-900/40 flex items-center justify-between text-[10px] text-slate-400">
                                            <span>Hotline: <strong className="text-white">{brandingForm.supportPhone}</strong></span>
                                            <span>Email: <strong className="text-white">{brandingForm.supportEmail}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'broadcast' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Announcement Banner Preview</p>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${broadcastForm.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                            {broadcastForm.enabled ? 'Live / Broadcasting' : 'Disabled / Hidden'}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400">Simulated Top-of-Page Banner:</p>
                                        <div className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-lg transition-all ${
                                            broadcastForm.type === 'critical' ? 'bg-rose-600 text-white' :
                                            broadcastForm.type === 'warning' ? 'bg-amber-500 text-slate-950 font-semibold' :
                                            broadcastForm.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                                        }`}>
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="material-symbols-outlined text-[20px] shrink-0">campaign</span>
                                                <span className="font-black uppercase text-[10px] px-2 py-0.5 bg-black/20 rounded-md shrink-0">
                                                    {broadcastForm.title || 'NOTICE'}
                                                </span>
                                                <span className="text-xs truncate">{broadcastForm.message || 'No broadcast message written yet.'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {broadcastForm.linkText && (
                                                    <span className="underline font-bold text-[11px] cursor-pointer">
                                                        {broadcastForm.linkText} &rarr;
                                                    </span>
                                                )}
                                                {broadcastForm.dismissible && (
                                                    <span className="material-symbols-outlined text-[16px] opacity-70">close</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                                        <h6 className="text-xs font-bold text-slate-300">Audience Targeting</h6>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-400 text-[18px]">group</span>
                                            <span className="text-xs text-white capitalize font-semibold">{broadcastForm.audience || 'all'} visitors</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                            {broadcastForm.audience === 'all' 
                                                ? 'Visible across login pages, patient dashboard, clinician portal, and pharmacy.' 
                                                : `Strictly restricted to users authenticated with the ${broadcastForm.audience} role.`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'dashboards' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Role Dashboard Bulletins Preview</p>
                                        <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">In-Dashboard Cards</span>
                                    </div>

                                    {['patient', 'doctor', 'pharmacist', 'caregiver'].map(role => {
                                        const notice = dashboardsForm[role] || {};
                                        const roleColors = {
                                            patient: { border: 'border-emerald-500/30', bg: 'bg-emerald-950/30', text: 'text-emerald-400', icon: 'person' },
                                            doctor: { border: 'border-blue-500/30', bg: 'bg-blue-950/30', text: 'text-blue-400', icon: 'stethoscope' },
                                            pharmacist: { border: 'border-purple-500/30', bg: 'bg-purple-950/30', text: 'text-purple-400', icon: 'prescriptions' },
                                            caregiver: { border: 'border-rose-500/30', bg: 'bg-rose-950/30', text: 'text-rose-400', icon: 'favorite' },
                                        };
                                        const cfg = roleColors[role] || roleColors.patient;

                                        return (
                                            <div key={role} className={`p-3.5 rounded-2xl border ${cfg.border} ${cfg.bg} space-y-1.5`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`material-symbols-outlined text-[16px] ${cfg.text}`}>{cfg.icon}</span>
                                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.text}`}>{role} Portal</span>
                                                    </div>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${notice.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                                        {notice.enabled ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                                <h6 className="text-xs font-bold text-white">{notice.title || 'Untitled Notice'}</h6>
                                                <p className="text-[11px] text-slate-300 leading-snug">{notice.message || 'No notice message set.'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'branding' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Brand Identity & Hospital Info</p>
                                        <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Global Header & Nav</span>
                                    </div>

                                    {/* Brand Header Preview */}
                                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                                    <span className="material-symbols-outlined text-[22px]">
                                                        {brandingForm.logoIcon || 'medical_services'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-base text-white">{brandingForm.siteName || 'MediTrack'}</h5>
                                                    <p className="text-xs text-slate-400">{brandingForm.hospitalName || 'Health Network'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                                                {brandingForm.operationalHours || '24/7 Clinical Support'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                                                <p className="text-[9px] text-slate-400 uppercase font-bold">Direct Phone</p>
                                                <p className="font-semibold text-white truncate">{brandingForm.supportPhone || 'Not set'}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                                                <p className="text-[9px] text-slate-400 uppercase font-bold">Email Support</p>
                                                <p className="font-semibold text-white truncate">{brandingForm.supportEmail || 'Not set'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Footer Copyright:</span>
                                        <span className="text-slate-200 font-mono text-[10px]">{brandingForm.copyrightText || 'Default'}</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'login' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Login & Welcome Layout</p>
                                        <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Portal Landing</span>
                                    </div>

                                    {/* Welcome Message */}
                                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                                        <p className="text-xs font-bold text-amber-400">{loginForm.welcomeTitle || 'Welcome back'}</p>
                                        <p className="text-[11px] text-slate-300 leading-tight mt-1">{loginForm.welcomeSubtitle}</p>
                                    </div>

                                    {/* Role Cards Preview */}
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Role Selector Cards ({loginForm.roleCards?.length || 0})</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(loginForm.roleCards || []).map((c, i) => (
                                                <div key={i} className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-blue-400 text-[18px]">{c.icon}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold truncate text-white">{c.label}</p>
                                                        <p className="text-[9px] text-slate-400 truncate">{c.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Showcase Card Preview */}
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Hero Showcase Preview</p>
                                        <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-32 bg-slate-800 flex flex-col justify-end p-3.5">
                                            {loginForm.hero?.imageUrl && (
                                                <img
                                                    src={loginForm.hero.imageUrl}
                                                    alt="Hero"
                                                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                                                />
                                            )}
                                            <div className="relative z-10">
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/80 text-white">
                                                    {loginForm.hero?.badgeText || 'Encrypted Platform'}
                                                </span>
                                                <h6 className="text-xs font-bold text-white mt-1.5 line-clamp-1">{loginForm.hero?.headline}</h6>
                                                <p className="text-[9px] text-slate-300 line-clamp-2 mt-0.5">{loginForm.hero?.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Global Footer in Preview */}
                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                                <span>Support: {brandingForm.supportPhone || '+1 (800) 555-MEDI'}</span>
                                <span className="text-slate-500 truncate max-w-[150px]">{brandingForm.copyrightText || loginForm.footerCopyright}</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

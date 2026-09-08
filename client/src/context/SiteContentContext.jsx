import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSiteContent, updateSiteSection, resetSiteSection, resetAllSiteContent } from '../api/api';

const DEFAULT_CONTENT = {
    branding: {
        siteName: 'MediTrack',
        tagline: 'Intelligent Medication Adherence & Clinical Coordination',
        logoIcon: 'medical_services',
        supportPhone: '+1 (800) 555-MEDI',
        supportEmail: 'support@meditrack.gov.gh',
        operationalHours: 'Mon - Sun: 24/7 Clinical Support',
        hospitalName: 'MediTrack Health Network',
    },
    login_experience: {
        welcomeTitle: 'Welcome back',
        welcomeSubtitle: 'Please select your clinical role to access your personalized healthcare dashboard.',
        roleCards: [
            { key: 'patient', label: 'Patient', desc: 'View records & appointments', icon: 'person' },
            { key: 'doctor', label: 'Doctor', desc: 'Manage patients & charts', icon: 'stethoscope' },
            { key: 'pharmacist', label: 'Pharmacist', desc: 'Fill prescriptions & inventory', icon: 'medication' },
            { key: 'caregiver', label: 'Caregiver', desc: 'Coordinated care tools', icon: 'favorite' },
        ],
        hero: {
            headline: 'Secure Healthcare Platform',
            description: 'End-to-end intelligent medication tracking and clinical coordination trusted by medical professionals nationwide.',
            badgeText: 'HIPAA Compliant & Encrypted',
            imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop',
            features: ['Real-time Adherence', 'AI Pill Verification', 'Pharmacist Conflict Alerts'],
        },
        footerCopyright: '© 2024 MediTrack Solutions. All rights reserved.',
    },
    broadcast_banner: {
        enabled: false,
        type: 'info',
        title: 'System Notice',
        message: 'MediTrack is running in optimal operational mode. All clinical data channels are synchronized.',
        linkText: 'Learn More',
        linkUrl: '',
        audience: 'all',
        dismissible: true,
    },
    policies: {
        privacyPolicy: {
            title: 'Privacy Policy & HIPAA Compliance',
            lastUpdated: 'September 2024',
            content: 'At MediTrack, your privacy and health data security are paramount. We utilize industry-standard 256-bit AES encryption for all data at rest and in transit. Your personal health information is strictly accessible only to authorized medical personnel, assigned caregivers, and licensed dispensing pharmacists. We never sell or share patient health records with third parties.',
        },
        termsOfService: {
            title: 'Terms of Service & Clinical Guidelines',
            lastUpdated: 'September 2024',
            content: 'By accessing MediTrack, you agree to comply with medical adherence safety guidelines and verify all prescription data before administration. Clinicians and pharmacists remain fully responsible for the clinical judgment of orders entered. In case of a medical emergency, do not wait for platform alerts; call emergency services immediately.',
        },
        contactSupport: {
            title: 'Help & Clinical Support Center',
            hotline: '+1 (800) 555-MEDI',
            email: 'support@meditrack.gov.gh',
            hours: 'Available 24 hours a day, 7 days a week',
            emergencyNotice: 'If you or someone in your care is experiencing a life-threatening medical emergency, call 911 or proceed to the nearest emergency medical facility immediately.',
        },
    },
    dashboard_notices: {
        patient: {
            enabled: false,
            title: 'Daily Health Tip',
            message: 'Remember to stay well hydrated and log your doses right after taking them to keep your streak intact!',
        },
        doctor: {
            enabled: false,
            title: 'Clinical Protocol Reminder',
            message: 'All escalated patient vitals or missed adherence triggers must be reviewed within 24 hours.',
        },
        pharmacist: {
            enabled: false,
            title: 'Pharmacy Interaction Check',
            message: 'Please double-check potential drug conflicts and allergy warnings before confirming pending dispenses.',
        },
        caregiver: {
            enabled: false,
            title: 'Caregiver Daily Checklist',
            message: 'Check that your assigned patients have acknowledged their morning and afternoon schedules.',
        },
    },
};

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
    const [content, setContent] = useState(DEFAULT_CONTENT);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchContent = useCallback(async () => {
        try {
            const data = await getSiteContent();
            if (data && typeof data === 'object') {
                setContent(prev => ({
                    ...prev,
                    ...data,
                    branding: { ...prev.branding, ...(data.branding || {}) },
                    login_experience: {
                        ...prev.login_experience,
                        ...(data.login_experience || {}),
                        hero: {
                            ...prev.login_experience.hero,
                            ...(data.login_experience?.hero || {}),
                        },
                    },
                    broadcast_banner: { ...prev.broadcast_banner, ...(data.broadcast_banner || {}) },
                    policies: {
                        ...prev.policies,
                        ...(data.policies || {}),
                    },
                    dashboard_notices: {
                        ...prev.dashboard_notices,
                        ...(data.dashboard_notices || {}),
                    },
                }));
            }
        } catch (err) {
            console.error('Failed to load site content from API, utilizing defaults:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const updateSection = async (key, sectionData) => {
        // Optimistic UI update
        setContent(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                ...sectionData,
            },
        }));

        const res = await updateSiteSection(key, sectionData);
        if (res && res.data) {
            setContent(prev => ({
                ...prev,
                [key]: res.data,
            }));
        }
        return res;
    };

    const resetSection = async (key) => {
        const res = await resetSiteSection(key);
        if (res && res.data) {
            setContent(prev => ({
                ...prev,
                [key]: res.data,
            }));
        } else if (DEFAULT_CONTENT[key]) {
            setContent(prev => ({
                ...prev,
                [key]: DEFAULT_CONTENT[key],
            }));
        }
        return res;
    };

    const resetAll = async () => {
        const res = await resetAllSiteContent();
        setContent(DEFAULT_CONTENT);
        return res;
    };

    return (
        <SiteContentContext.Provider
            value={{
                content,
                updateSection,
                resetSection,
                resetAll,
                refetchContent: fetchContent,
                isLoading,
                error,
            }}
        >
            {children}
        </SiteContentContext.Provider>
    );
}

export function useSiteContent() {
    const context = useContext(SiteContentContext);
    if (!context) {
        throw new Error('useSiteContent must be used within a SiteContentProvider');
    }
    return context;
}

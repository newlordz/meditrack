import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMON_DRUGS, COMMON_INSTRUCTIONS, COMMON_CONDITIONS } from '../../data/mockData';
import { useAuth } from '../../context/useAuth';
import { useApi } from '../../hooks/useApi';
import { getPatients } from '../../api/api';



function AdherenceBar({ value }) {
    const color = value >= 80 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger';
    return (
        <div className="flex items-center gap-3">
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-900">{value}%</span>
        </div>
    );
}

function AlertBadge({ type, text }) {
    const styles = {
        critical: 'bg-danger/10 text-danger',
        warning: 'bg-amber-50 text-amber-700',
        stable: 'bg-emerald-50 text-emerald-700',
        none: 'bg-slate-50 text-slate-500',
    };
    const dotStyles = {
        critical: 'bg-danger',
        warning: 'bg-amber-400',
        stable: 'bg-emerald-500',
        none: 'bg-slate-300',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyles[type]}`} />
            {text}
        </span>
    );
}

export default function PatientRosterPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const TABS = [
        { id: 'waiting', label: 'Waiting' },
        { id: 'in-consultation', label: 'In Consultation' },
        { id: 'completed', label: 'Completed' },
    ];

    // Standard State
    const [activeTab, setActiveTab] = useState('waiting');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModal, setActiveModal] = useState(null); // 'filter', 'export', 'add', 'view', 'notifications', 'help', 'review', 'prescribe'
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [activePage, setActivePage] = useState(1);
    const [viewAll, setViewAll] = useState(false);
    const itemsPerPage = 5;

    // Prescribe Form State
    const [prescriptionForm, setPrescriptionForm] = useState({
        drug: '',
        qty: '',
        instructions: '',
        urgency: 'normal'
    });
    const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);
    const [filteredDrugs, setFilteredDrugs] = useState([]);

    const [showInstSuggestions, setShowInstSuggestions] = useState(false);
    const [filteredInst, setFilteredInst] = useState([]);

    const [clinicalNotes, setClinicalNotes] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [showDiagSuggestions, setShowDiagSuggestions] = useState(false);
    const [filteredDiag, setFilteredDiag] = useState([]);
    const [, setUpdateTrigger] = useState(0);
    const [toastMessage, setToastMessage] = useState(null);

    // Live wait-time clock — joinedAt computed once at init
    const [now, setNow] = useState(Date.now); // lazy: calls Date.now() once
    const { data: rawPatients } = useApi(() => getPatients(user?.userId || user?.id), [user?.userId, user?.id]);
    // Adapt API shape to what the roster UI expects
    const SHARED_PATIENTS = (rawPatients || []).map(p => ({
        ...p,
        condition: p.conditions?.join(', ') || 'Unknown',
        adherence: 75,  // placeholder until logs are aggregated
        alertType: p.activeEscalations > 0 ? 'critical' : 'stable',
        alertText: p.activeEscalations > 0 ? `Critical: ${p.activeEscalations} escalation(s)` : 'Stable',
        refillStatus: 'normal',
        refillText: 'Refill in 10 days',
        queueStatus: 'waiting',
        waitMinutes: 10,
        needsReview: p.activeEscalations > 0,
        pendingSync: false,
        status: p.activeEscalations > 0 ? 'critical' : 'on-track',
    }));

    const [joinedAt] = useState(() => {
        const map = {};
        return map;
    });

    useEffect(() => {
        const tick = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(tick);
    }, []);

    const formatElapsed = (patientId) => {
        const start = joinedAt[patientId];
        if (!start) return '—';
        const totalSecs = Math.floor((now - start) / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    // Filter states
    const [filters, setFilters] = useState({ needsReview: false, pendingSync: false });
    const [tempFilters, setTempFilters] = useState({ needsReview: false, pendingSync: false });

    // Live escalation count
    const [escalationCount, setEscalationCount] = useState(0);

    useEffect(() => {
        const updateCount = () => {
            const saved = localStorage.getItem('meditrack_escalations_v2');
            if (saved) {
                const esc = JSON.parse(saved);
                setEscalationCount(esc.filter(e => e.status === 'active' || !e.status).length);
            } else {
                setEscalationCount(3); // Default mock count
            }
        };
        updateCount();
        window.addEventListener('localStorageUpdated', updateCount);
        return () => window.removeEventListener('localStorageUpdated', updateCount);
    }, []);

    useEffect(() => {
        let timer;
        if (activeModal === 'review') {
            timer = setTimeout(() => {
                setActiveModal(null);
                navigate('/clinician/escalations');
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [activeModal, navigate]);

    // Handle export functionality
    const handleExport = () => {
        const headers = ['Patient Name', 'Patient ID', 'Condition', 'Adherence %', 'Alert Status', 'Refill Status'];
        const csvRows = [headers.join(',')];

        filteredPatients.forEach(p => {
            csvRows.push([
                `"${p.name}"`, `"${p.pid}"`, `"${p.condition}"`, `${p.adherence}%`, `"${p.alertText}"`, `"${p.refillText}"`
            ].join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'patient_roster.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setActiveModal('export');
    };

    const handleOpenFilter = () => {
        setTempFilters(filters);
        setActiveModal('filter');
    };

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setActiveModal(null);
    };

    const searchFiltered = SHARED_PATIENTS.filter((p) => {
        return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.pid.includes(searchQuery) ||
            p.condition.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const tabCounts = {
        'all': searchFiltered.length,
        'waiting': searchFiltered.filter(p => p.queueStatus === 'waiting').length,
        'in-consultation': searchFiltered.filter(p => p.queueStatus === 'in-consultation').length,
        'completed': searchFiltered.filter(p => p.queueStatus === 'completed').length
    };

    const filteredPatients = searchFiltered.filter((p) => {
        let matchesTab = true;
        if (activeTab === 'waiting') {
            matchesTab = p.queueStatus === 'waiting';
        } else if (activeTab === 'in-consultation') {
            matchesTab = p.queueStatus === 'in-consultation';
        } else if (activeTab === 'completed') {
            matchesTab = p.queueStatus === 'completed';
        }

        const matchesReview = filters.needsReview ? p.needsReview : true;
        const matchesSync = filters.pendingSync ? p.pendingSync : true;

        return matchesTab && matchesReview && matchesSync;
    });

    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / itemsPerPage));
    const displayedPatients = viewAll ? filteredPatients : filteredPatients.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

    useEffect(() => {
        setActivePage(1); // eslint-disable-line
    }, [searchQuery, activeTab, filters]);

    const closeModal = () => {
        setActiveModal(null);
        setSelectedPatient(null);
    };


    const handleDrugInputChange = (e) => {
        const val = e.target.value;
        setPrescriptionForm({ ...prescriptionForm, drug: val });

        if (val.trim()) {
            const matches = COMMON_DRUGS.filter(d => d.toLowerCase().includes(val.toLowerCase()));
            setFilteredDrugs(matches);
            setShowDrugSuggestions(true);
        } else {
            setFilteredDrugs([]);
            setShowDrugSuggestions(false);
        }
    };

    const handleSelectDrug = (drugName) => {
        setPrescriptionForm({ ...prescriptionForm, drug: drugName });
        setShowDrugSuggestions(false);
    };

    const handleInstInputChange = (e) => {
        const val = e.target.value;
        setPrescriptionForm({ ...prescriptionForm, instructions: val });

        if (val.trim()) {
            const matches = COMMON_INSTRUCTIONS.filter(i => i.toLowerCase().includes(val.toLowerCase()));
            setFilteredInst(matches);
            setShowInstSuggestions(true);
        } else {
            setFilteredInst(COMMON_INSTRUCTIONS);
            setShowInstSuggestions(true); // Show all initially when empty or clicked
        }
    };

    const handleSelectInst = (instText) => {
        setPrescriptionForm({ ...prescriptionForm, instructions: instText });
        setShowInstSuggestions(false);
    };

    const handleDiagInputChange = (e) => {
        const val = e.target.value;
        setDiagnosis(val);

        if (val.trim()) {
            const matches = COMMON_CONDITIONS.filter(c => c.toLowerCase().includes(val.toLowerCase()));
            setFilteredDiag(matches);
            setShowDiagSuggestions(true);
        } else {
            setFilteredDiag(COMMON_CONDITIONS);
            setShowDiagSuggestions(true);
        }
    };

    const handleSelectDiag = (diagText) => {
        setDiagnosis(diagText);
        setShowDiagSuggestions(false);
    };

    const handlePrescribeSubmit = (e) => {
        e.preventDefault();
        if (!selectedPatient || !prescriptionForm.drug || !prescriptionForm.qty) return;

        const newPrescription = {
            id: `RX-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            patient: selectedPatient.name,
            drug: prescriptionForm.drug,
            qty: parseInt(prescriptionForm.qty, 10),
            doctor: 'Dr. Current User', // Mock doctor name
            urgency: prescriptionForm.urgency,
            instructions: prescriptionForm.instructions,
            timestamp: new Date().toISOString()
        };

        const existingPending = JSON.parse(localStorage.getItem('meditrack_pending_prescriptions') || '[]');

        // Use functional state payload pattern to safely update
        localStorage.setItem('meditrack_pending_prescriptions', JSON.stringify([newPrescription, ...existingPending]));

        // Dispatch special event to notify Pharmacist dashboard
        window.dispatchEvent(new Event('rxDispensedOrPrescribed'));

        setToastMessage(`Prescribed ${prescriptionForm.drug} to ${selectedPatient.name}`);
        setTimeout(() => setToastMessage(null), 3000);

        setPrescriptionForm({ drug: '', qty: '', instructions: '', urgency: 'normal' });
        setActiveModal('view');
    };

    const handleCompleteConsult = () => {
        if (!selectedPatient) return;
        const patientGlobal = SHARED_PATIENTS.find(p => p.id === selectedPatient.id);
        if (patientGlobal) {
            patientGlobal.queueStatus = 'completed';
            if (diagnosis.trim()) {
                patientGlobal.condition = diagnosis.trim();
            }
        }
        setToastMessage(`${selectedPatient.name}'s consultation is complete.`);
        setTimeout(() => setToastMessage(null), 3000);
        setUpdateTrigger(prev => prev + 1);
        closeModal();
    };

    return (
        <div className="flex flex-col min-h-screen relative">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed top-4 right-4 z-[60] bg-slate-800 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in">
                    <span className="material-symbols-outlined text-success">check_circle</span>
                    <span className="font-semibold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Modal Overlay Placeholder */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className={`bg-white rounded-2xl shadow-xl w-full p-6 relative ${activeModal === 'view' ? 'max-w-2xl text-left' : 'max-w-md text-center'}`}>
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 z-10"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        {activeModal === 'add' && (
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Add New Patient</h3>
                                <p className="text-sm text-slate-500 mb-6">Enter patient details to enroll them in adherence tracking.</p>
                                <div className="space-y-4">
                                    <input type="text" placeholder="Full Name" className="w-full px-4 py-2 border rounded-lg" />
                                    <input type="text" placeholder="Medical ID" className="w-full px-4 py-2 border rounded-lg" />
                                    <input type="text" placeholder="Primary Condition" className="w-full px-4 py-2 border rounded-lg" />
                                    <button onClick={closeModal} className="w-full py-2 bg-primary text-white rounded-lg font-bold mt-2">Enroll Patient</button>
                                </div>
                            </div>
                        )}
                        {activeModal === 'filter' && (
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Advanced Filters</h3>
                                <p className="text-sm text-slate-500 mb-6">Filter roster by demographic or clinical metrics.</p>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={tempFilters.needsReview}
                                            onChange={(e) => setTempFilters({ ...tempFilters, needsReview: e.target.checked })}
                                        /> Needs Medication Review
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={tempFilters.pendingSync}
                                            onChange={(e) => setTempFilters({ ...tempFilters, pendingSync: e.target.checked })}
                                        /> Pending Device Sync
                                    </label>
                                    <button
                                        onClick={handleApplyFilters}
                                        className="w-full py-2 bg-primary text-white rounded-lg font-bold mt-4"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeModal === 'export' && (
                            <div>
                                <span className="material-symbols-outlined text-4xl text-success mb-2">check_circle</span>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Export Started</h3>
                                <p className="text-sm text-slate-500">The patient roster CSV is being generated and will download shortly.</p>
                                <button onClick={closeModal} className="mt-6 px-4 py-2 bg-slate-100 font-semibold rounded-lg">Close</button>
                            </div>
                        )}
                        {activeModal === 'review' && (
                            <div className="animate-fade-in">
                                <span className="material-symbols-outlined text-4xl text-danger mb-2 animate-pulse">warning</span>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Escalation Review</h3>
                                <p className="text-sm text-slate-500">Redirecting to the clinical escalation dashboard in 2 seconds...</p>
                                <div className="mt-4 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-danger animate-[progress_2s_linear_forwards]" />
                                </div>
                                <button onClick={closeModal} className="mt-6 px-4 py-2 bg-slate-100 font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                            </div>
                        )}
                        {activeModal === 'prescribe' && selectedPatient && (
                            <div className="text-left animate-fade-in">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[24px]">prescriptions</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">New Prescription</h3>
                                        <p className="text-slate-500 font-medium text-sm">For {selectedPatient.name} ({selectedPatient.pid})</p>
                                    </div>
                                </div>

                                <form onSubmit={handlePrescribeSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drug Name & Strength *</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. Amoxicillin 500mg"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                                value={prescriptionForm.drug}
                                                onChange={handleDrugInputChange}
                                                onFocus={() => {
                                                    if (prescriptionForm.drug.trim()) {
                                                        setShowDrugSuggestions(true);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Delay blur to allow clicks on dropdown items
                                                    setTimeout(() => setShowDrugSuggestions(false), 200);
                                                }}
                                            />
                                            {showDrugSuggestions && filteredDrugs.length > 0 && (
                                                <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto text-left py-1">
                                                    {filteredDrugs.map((d, i) => (
                                                        <li
                                                            key={i}
                                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700"
                                                            onClick={() => handleSelectDrug(d)}
                                                        >
                                                            {d}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity *</label>
                                            <input
                                                required
                                                type="number"
                                                placeholder="e.g. 30"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                value={prescriptionForm.qty}
                                                onChange={e => setPrescriptionForm({ ...prescriptionForm, qty: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Urgency</label>
                                            <select
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                                value={prescriptionForm.urgency}
                                                onChange={e => setPrescriptionForm({ ...prescriptionForm, urgency: e.target.value })}
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="urgent">Urgent</option>
                                                <option value="review">Requires Review</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Instructions</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="e.g. Take 1 tablet twice daily after meals"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                                value={prescriptionForm.instructions}
                                                onChange={handleInstInputChange}
                                                onFocus={() => {
                                                    if (!prescriptionForm.instructions.trim()) {
                                                        setFilteredInst(COMMON_INSTRUCTIONS);
                                                    } else {
                                                        const matches = COMMON_INSTRUCTIONS.filter(i => i.toLowerCase().includes(prescriptionForm.instructions.toLowerCase()));
                                                        setFilteredInst(matches);
                                                    }
                                                    setShowInstSuggestions(true);
                                                }}
                                                onBlur={() => {
                                                    // Delay blur to allow clicks on dropdown items
                                                    setTimeout(() => setShowInstSuggestions(false), 200);
                                                }}
                                            />
                                            {showInstSuggestions && filteredInst.length > 0 && (
                                                <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto text-left py-1">
                                                    {filteredInst.map((inst, i) => (
                                                        <li
                                                            key={i}
                                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700"
                                                            onClick={() => handleSelectInst(inst)}
                                                        >
                                                            {inst}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                        <button type="button" onClick={() => setActiveModal('view')} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">
                                            Back
                                        </button>
                                        <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">send</span> Send to Pharmacy
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        {activeModal === 'view' && selectedPatient && (
                            <div className="animate-fade-in">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900">{selectedPatient.name}</h3>
                                        <p className="text-slate-500 font-medium">{selectedPatient.pid} • {selectedPatient.queueStatus === 'completed' ? selectedPatient.condition : 'Pending Diagnosis'}</p>
                                    </div>
                                    <div className="text-left sm:text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 flex flex-col justify-center min-w-[120px]">
                                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Adherence Score</span>
                                        {selectedPatient.queueStatus === 'completed' && selectedPatient.condition !== 'Pending Diagnosis' ? (
                                            <p className={`text-3xl font-black ${selectedPatient.adherence >= 80 ? 'text-success' : selectedPatient.adherence >= 50 ? 'text-warning' : 'text-danger'}`}>
                                                {selectedPatient.adherence}%
                                            </p>
                                        ) : (
                                            <p className="text-sm font-medium text-slate-400 mt-1 italic">N/A</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
                                            <h4 className="font-bold text-slate-900">Recent Clinical Alerts</h4>
                                        </div>
                                        {selectedPatient.queueStatus === 'completed' && selectedPatient.condition !== 'Pending Diagnosis' ? (
                                            <>
                                                <AlertBadge type={selectedPatient.alertType} text={selectedPatient.alertText} />
                                                {selectedPatient.alertType !== 'none' && selectedPatient.alertType !== 'stable' && (
                                                    <p className="text-xs text-slate-500 mt-3 italic">Alert triggered within the last 48 hours. Review recommended.</p>
                                                )}
                                            </>
                                        ) : (
                                            <div className="py-2 text-center text-sm text-slate-500 italic border border-dashed border-slate-200 rounded-lg bg-white">
                                                No alerts. Pending consultation.
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-primary text-[20px]">medication</span>
                                            <h4 className="font-bold text-slate-900">Medication Status</h4>
                                        </div>
                                        {selectedPatient.queueStatus === 'completed' && selectedPatient.condition !== 'Pending Diagnosis' ? (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-slate-600">Refill Prediction</span>
                                                    <span className={`text-sm font-bold ${selectedPatient.refillStatus === 'overdue' || selectedPatient.refillStatus === 'urgent' ? 'text-danger' : 'text-slate-900'}`}>
                                                        {selectedPatient.refillText}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-slate-600">Device Sync</span>
                                                    <span className={`text-sm font-bold ${selectedPatient.pendingSync ? 'text-warning' : 'text-success'}`}>
                                                        {selectedPatient.pendingSync ? 'Pending (2 days)' : 'Up to Date'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-2 text-center text-sm text-slate-500 italic border border-dashed border-slate-200 rounded-lg bg-white">
                                                No active prescriptions documented yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Consultation Notes Area */}
                                <div className="mb-8 border border-slate-100 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-primary text-[20px]">edit_document</span>
                                        <h4 className="font-bold text-slate-900">Clinical Notes / Diagnosis</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Primary Diagnosis (e.g., Hypertension)"
                                                className="w-full p-3 text-sm border font-semibold border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white"
                                                value={diagnosis}
                                                onChange={handleDiagInputChange}
                                                onFocus={() => {
                                                    if (!diagnosis.trim()) {
                                                        setFilteredDiag(COMMON_CONDITIONS);
                                                    } else {
                                                        const matches = COMMON_CONDITIONS.filter(c => c.toLowerCase().includes(diagnosis.toLowerCase()));
                                                        setFilteredDiag(matches);
                                                    }
                                                    setShowDiagSuggestions(true);
                                                }}
                                                onBlur={() => {
                                                    // Delay blur to allow clicks on dropdown items
                                                    setTimeout(() => setShowDiagSuggestions(false), 200);
                                                }}
                                            />
                                            {showDiagSuggestions && filteredDiag.length > 0 && (
                                                <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto text-left py-1">
                                                    {filteredDiag.map((diag, i) => (
                                                        <li
                                                            key={i}
                                                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700"
                                                            onClick={() => handleSelectDiag(diag)}
                                                        >
                                                            {diag}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <textarea
                                            className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 focus:bg-white resize-none"
                                            placeholder="Enter consultation discussion details or treatment plan here..."
                                            value={clinicalNotes}
                                            onChange={(e) => setClinicalNotes(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button onClick={closeModal} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPrescriptionForm({ drug: '', qty: '', instructions: '', urgency: 'normal' });
                                            setActiveModal('prescribe');
                                        }}
                                        className="px-5 py-2.5 bg-white border border-primary text-primary hover:bg-primary/5 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">prescriptions</span>
                                        Prescribe Rx
                                    </button>
                                    <button
                                        onClick={handleCompleteConsult}
                                        className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                        Complete Consult
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeModal === 'notifications' && (
                            <div>
                                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">notifications_active</span>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Notifications Center</h3>
                                <p className="text-sm text-slate-500">You have 3 unread critical alerts and 12 system messages.</p>
                                <button onClick={closeModal} className="mt-6 px-4 py-2 bg-slate-100 font-semibold rounded-lg">Close</button>
                            </div>
                        )}
                        {activeModal === 'help' && (
                            <div>
                                <span className="material-symbols-outlined text-4xl text-primary mb-2">support_agent</span>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Support Center</h3>
                                <p className="text-sm text-slate-500">Access documentation or chat with technical support.</p>
                                <button onClick={closeModal} className="mt-6 px-4 py-2 bg-slate-100 font-semibold rounded-lg">Close</button>
                            </div>
                        )}
                    </div>
                </div >
            )
            }

            {/* Alert Banner */}
            {
                escalationCount > 0 && (
                    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
                            <p className="text-sm">
                                <span className="font-bold text-amber-800">High-Priority Escalation Alert</span>
                                <span className="text-amber-700 ml-1 hidden sm:inline">
                                    {escalationCount} patient{escalationCount !== 1 ? 's' : ''} require{escalationCount === 1 ? 's' : ''} immediate clinical intervention due to severe non-adherence.
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={() => { closeModal(); navigate('/clinician/escalations'); }}
                            className="px-3 py-1.5 bg-danger text-white text-xs font-bold rounded-lg hover:bg-danger/90 transition-colors flex-shrink-0"
                        >
                            Review Now
                        </button>
                    </div>
                )
            }

            {/* Top Search Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search patients by name, ID, or condition..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white
                         focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveModal('notifications')}
                        className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500"
                    >
                        <span className="material-symbols-outlined text-[22px]">notifications</span>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />
                    </button>
                    <button
                        onClick={() => setActiveModal('help')}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500"
                    >
                        <span className="material-symbols-outlined text-[22px]">help</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 lg:mb-0 mb-16">
                {/* Breadcrumb & Actions */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals <span className="mx-1">›</span>
                            <span className="text-primary font-semibold">Clinician</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Roster</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Manage and monitor your patient panel.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={handleOpenFilter}
                            className={`flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors 
                                ${activeModal === 'filter' || tempFilters.needsReview || tempFilters.pendingSync ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">download</span> Export
                        </button>
                    </div>
                </div>
                {/* Search & Tabs */}
                <div className="flex flex-col border-b border-slate-200">
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-1 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab.label} <span className="ml-1 text-xs opacity-70">({tabCounts[tab.id] || 0})</span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Patient Name</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reason for Visit</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Queue Status</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Wait Time</th>
                                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedPatients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="hover:bg-slate-50/60 transition-colors"
                                    >
                                        {/* Name */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                                                    ${patient.adherence >= 80 ? 'bg-success' : patient.adherence >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                                    {patient.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                                                    <p className="text-xs text-slate-400">ID: {patient.pid} · {patient.queueStatus === 'completed' ? patient.condition : 'Pending Diagnosis'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Reason for Visit */}
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-slate-700">{patient.visitReason}</p>
                                        </td>

                                        {/* Queue Status */}
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize
                                                ${patient.queueStatus === 'waiting' ? 'bg-amber-100 text-amber-700' :
                                                    patient.queueStatus === 'in-consultation' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-emerald-100 text-emerald-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                                                    ${patient.queueStatus === 'waiting' ? 'bg-amber-500' :
                                                        patient.queueStatus === 'in-consultation' ? 'bg-blue-500 animate-pulse' :
                                                            'bg-emerald-500'}`} />
                                                {patient.queueStatus.replace('-', ' ')}
                                            </span>
                                        </td>

                                        {/* Wait Time — Live Clock */}
                                        <td className="px-5 py-4">
                                            {patient.queueStatus === 'waiting' || patient.queueStatus === 'in-consultation' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                                                    <span className="text-sm font-bold text-slate-700 tabular-nums">
                                                        {formatElapsed(patient.id)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>

                                        {/* Action */}
                                        <td className="px-5 py-4">
                                            {patient.queueStatus === 'completed' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedPatient(patient);
                                                        setClinicalNotes('');
                                                        setDiagnosis('');
                                                        setActiveModal('view');
                                                    }}
                                                    className="text-slate-500 text-sm font-semibold hover:underline bg-slate-100 px-3 py-1.5 rounded-lg"
                                                >
                                                    View Details
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedPatient(patient);
                                                        setClinicalNotes('');
                                                        setDiagnosis('');
                                                        setActiveModal('view');
                                                        if (patient.queueStatus === 'waiting') {
                                                            patient.queueStatus = 'in-consultation';
                                                            setUpdateTrigger(p => p + 1);
                                                        }
                                                    }}
                                                    className="text-primary text-sm font-semibold hover:underline bg-primary/10 px-3 py-1.5 rounded-lg"
                                                >
                                                    Consult Patient
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-5 py-3 sm:py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                        <p className="text-xs text-slate-500 font-medium">
                            Showing {filteredPatients.length === 0 ? 0 : (viewAll ? 1 : (activePage - 1) * itemsPerPage + 1)} to {viewAll ? filteredPatients.length : Math.min(activePage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            {!viewAll && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setActivePage(p => Math.max(1, p - 1))}
                                        disabled={activePage === 1}
                                        className="px-2.5 py-1.5 rounded text-[11px] sm:text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed hidden sm:block"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setActivePage(p => Math.max(1, p - 1))}
                                        disabled={activePage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed sm:hidden"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setActivePage(page)}
                                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs transition-colors ${activePage === page
                                                ? 'bg-primary text-white font-bold shadow-sm'
                                                : 'text-slate-600 font-medium hover:bg-slate-200'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setActivePage(p => Math.min(totalPages, p + 1))}
                                        disabled={activePage === totalPages}
                                        className="px-2.5 py-1.5 rounded text-[11px] sm:text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed hidden sm:block"
                                    >
                                        Next
                                    </button>
                                    <button
                                        onClick={() => setActivePage(p => Math.min(totalPages, p + 1))}
                                        disabled={activePage === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed sm:hidden"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => { setViewAll(!viewAll); setActivePage(1); }}
                                className="px-3 py-1.5 sm:py-2 bg-white border border-slate-300 text-slate-700 text-[11px] sm:text-xs font-bold rounded-md hover:bg-slate-50 transition-colors shadow-sm ml-auto sm:ml-0"
                            >
                                {viewAll ? 'Enable Pagination' : 'View All'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

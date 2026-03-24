import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { getPatients, getUsers, createUser, deleteUser as deleteStaffApi, resetUserPassword } from '../../api/api';

const ROLE_OPTIONS = [
    { value: 'doctor', label: 'Doctor / Clinician', icon: 'stethoscope', color: 'text-blue-600 bg-blue-50' },
    { value: 'pharmacist', label: 'Pharmacist', icon: 'medication', color: 'text-purple-600 bg-purple-50' },
    { value: 'caregiver', label: 'Caregiver', icon: 'favorite', color: 'text-rose-600 bg-rose-50' },
    { value: 'patient', label: 'Patient', icon: 'person', color: 'text-emerald-600 bg-emerald-50' },
];

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'users', label: 'User Management', icon: 'manage_accounts' },
    { id: 'add-user', label: 'Add New User', icon: 'person_add' },
    { id: 'passwords', label: 'Password Resets', icon: 'lock_reset' },
];

const ROLE_BADGE = {
    doctor: 'bg-blue-100 text-blue-700',
    pharmacist: 'bg-purple-100 text-purple-700',
    caregiver: 'bg-rose-100 text-rose-700',
    patient: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-amber-100 text-amber-700',
};

export default function AdminDashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    
    // Live API Data
    const { data: rawStaff, refetch: refetchStaff } = useApi(getUsers);
    const { data: rawPatients, refetch: refetchPatients } = useApi(getPatients);
    
    // Fallbacks if data is still loading
    const staff = rawStaff || [];
    const patients = rawPatients || [];

    const [toast, setToast] = useState(null);
    const [resetTarget, setResetTarget] = useState(null);
    const [newPw, setNewPw] = useState('');
    const [resetDone, setResetDone] = useState({});
    const [staffSearch, setStaffSearch] = useState('');
    const [staffRoleFilter, setStaffRoleFilter] = useState('all');

    const [confirmDeletePatient, setConfirmDeletePatient] = useState(null);
    const [confirmDeleteStaff, setConfirmDeleteStaff] = useState(null);

    const [formLoading, setFormLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleDeletePatient = async () => {
        setConfirmDeletePatient(null);
        showToast('Patient removed from the view.', 'success');
    };

    const handleDeleteStaff = async (staffId) => {
        try {
            await deleteStaffApi(staffId);
            refetchStaff();
            setConfirmDeleteStaff(null);
            showToast('Staff member removed from the system.', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to delete staff member.', 'error');
        }
    };

    // Add User Form State
    const [form, setForm] = useState({
        role: 'doctor', firstName: '', lastName: '', email: '', password: '', doctorId: ''
    });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFormChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleAddUser = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            setFormError('All fields are required.');
            return;
        }
        if (form.password.length < 6) {
            setFormError('Password must be at least 6 characters.');
            return;
        }
        
        setFormLoading(true);
        try {
            await createUser({
                role: form.role,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                password: form.password,
                doctorId: form.doctorId || undefined
            });
            
            if (form.role === 'patient') {
                refetchPatients();
                setFormSuccess(`${form.firstName} ${form.lastName} has been added as a patient.`);
            } else {
                refetchStaff();
                setFormSuccess(`${form.firstName} ${form.lastName} has been successfully registered as a ${form.role}.`);
            }
            
            setForm({ role: 'doctor', firstName: '', lastName: '', email: '', password: '', doctorId: '' });
            showToast(`${form.firstName} ${form.lastName} added!`);
        } catch (error) {
            setFormError(error.message || 'Failed to create user. Email may already be in use.');
        } finally {
            setFormLoading(false);
        }
    };

    const handlePasswordReset = async (userId) => {
        if (!newPw || newPw.length < 6) return;
        try {
            await resetUserPassword(userId, newPw);
            setResetDone(r => ({ ...r, [userId]: true }));
            setResetTarget(null);
            setNewPw('');
            showToast('Password reset successfully!');
        } catch (err) {
            console.error(err);
            showToast('Failed to reset password.', 'error');
        }
    };

    const handleDeactivate = () => {
        showToast('Status feature pending integration.');
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="min-h-screen bg-slate-50 relative">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-bold animate-fade-in ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    <span className="material-symbols-outlined text-[20px]">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                    {toast.msg}
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col shadow-2xl lg:shadow-sm transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500 p-2.5 rounded-xl shadow-sm">
                            <span className="material-symbols-outlined text-white text-[22px]">admin_panel_settings</span>
                        </div>
                        <div>
                            <h1 className="text-base font-black text-slate-900 leading-tight">MediTrack</h1>
                            <p className="text-[11px] text-amber-600 font-bold tracking-wide uppercase">Admin Portal</p>
                        </div>
                    </div>
                    {/* Close button inside sidebar on mobile */}
                    <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveSection(item.id);
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${activeSection === item.id ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">A</div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400">Receptionist</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 text-slate-500 hover:text-rose-500 text-sm font-semibold px-2 py-2 rounded-xl hover:bg-rose-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="sidebar-offset min-h-screen">
            <div className="p-4 lg:p-8 overflow-y-auto min-h-screen w-full">
                <div className="max-w-7xl mx-auto w-full">

                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="bg-amber-500 p-2 rounded-lg shadow-sm">
                            <span className="material-symbols-outlined text-white text-[18px]">admin_panel_settings</span>
                        </div>
                        <div>
                            <h1 className="font-black text-slate-900 text-sm leading-tight">MediTrack</h1>
                            <p className="text-[10px] text-amber-600 font-bold uppercase">Admin</p>
                        </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">menu</span>
                    </button>
                </div>

                {/* DASHBOARD */}
                {activeSection === 'dashboard' && (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Admin Portal › <span className="text-amber-600 font-semibold">Dashboard</span></p>
                            <h2 className="text-2xl font-black text-slate-900">Welcome, Admin</h2>
                            <p className="text-sm text-slate-500 mt-1">Overview of all registered users and system activity.</p>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Patients', count: patients?.length ?? '—', icon: 'person', color: 'bg-emerald-500', targetRole: 'patient' },
                                { label: 'Doctors', count: staff.filter(u => u.role === 'doctor').length, icon: 'stethoscope', color: 'bg-blue-500', targetRole: 'doctor' },
                                { label: 'Pharmacists', count: staff.filter(u => u.role === 'pharmacist').length, icon: 'medication', color: 'bg-purple-500', targetRole: 'pharmacist' },
                                { label: 'Caregivers', count: staff.filter(u => u.role === 'caregiver').length, icon: 'favorite', color: 'bg-rose-500', targetRole: 'caregiver' },
                            ].map(k => (
                                <button
                                    key={k.label}
                                    onClick={() => {
                                        setActiveSection('users');
                                        if (k.targetRole !== 'patient') setStaffRoleFilter(k.targetRole);
                                    }}
                                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-amber-400 hover:shadow-md hover:-translate-y-1 transition-all text-left w-full group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${k.color} group-hover:scale-110 transition-transform`}>
                                        <span className="material-symbols-outlined text-white text-[22px]">{k.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">{k.count}</p>
                                        <p className="text-xs text-slate-500 font-medium">{k.label}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="font-black text-slate-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Add New User', icon: 'person_add', section: 'add-user', color: 'text-amber-600 bg-amber-50 border-amber-200' },
                                    { label: 'Manage Users', icon: 'manage_accounts', section: 'users', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                                    { label: 'Reset Password', icon: 'lock_reset', section: 'passwords', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                                    { label: 'View Patients', icon: 'group', section: 'users', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                                ].map(qa => (
                                    <button key={qa.label} onClick={() => setActiveSection(qa.section)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-sm font-semibold text-sm ${qa.color}`}>
                                        <span className="material-symbols-outlined text-[28px]">{qa.icon}</span>
                                        {qa.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Staff */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="font-black text-slate-900 mb-4">Registered Staff</h3>
                            <div className="space-y-2">
                                {staff.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{s.name[0]}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{s.name}</p>
                                                <p className="text-xs text-slate-400">{s.email}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[s.role]}`}>{s.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* USER MANAGEMENT */}
                {activeSection === 'users' && (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Admin › <span className="text-amber-600 font-semibold">User Management</span></p>
                            <h2 className="text-2xl font-black text-slate-900">User Management</h2>
                            <p className="text-sm text-slate-500">View, activate, or deactivate all registered users.</p>
                        </div>

                        {/* Global Filters */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { key: 'all', label: 'All Users', count: staff.length + patients.length },
                                    { key: 'doctor', label: 'Doctors', count: staff.filter(s => s.role === 'doctor').length, color: 'text-blue-700 bg-blue-100' },
                                    { key: 'pharmacist', label: 'Pharmacists', count: staff.filter(s => s.role === 'pharmacist').length, color: 'text-purple-700 bg-purple-100' },
                                    { key: 'caregiver', label: 'Caregivers', count: staff.filter(s => s.role === 'caregiver').length, color: 'text-rose-700 bg-rose-100' },
                                    { key: 'patient', label: 'Patients', count: patients.length, color: 'text-emerald-700 bg-emerald-100' },
                                ].map(tab => {
                                    const isActive = staffRoleFilter === tab.key;
                                    return (
                                        <button key={tab.key} onClick={() => setStaffRoleFilter(tab.key)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-2 ${isActive ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                                            {tab.label}
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isActive ? (tab.color || 'bg-white text-slate-600') : 'bg-white text-slate-500'}`}>{tab.count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="relative w-full md:w-64 flex-shrink-0">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                            </div>
                        </div>

                        {/* Staff Table */}
                        {staffRoleFilter !== 'patient' && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                                <div className="min-w-[700px]">
                                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <h3 className="font-black text-slate-900">Staff Members</h3>
                                        <button onClick={() => setActiveSection('add-user')} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">person_add</span>
                                            Add User
                                        </button>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                    {staff
                                        .filter(s => staffRoleFilter === 'all' || s.role === staffRoleFilter)
                                        .filter(s => !staffSearch || s.name.toLowerCase().includes(staffSearch.toLowerCase()) || s.email.toLowerCase().includes(staffSearch.toLowerCase()))
                                        .map(s => (
                                        <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.name[0]}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                                                <p className="text-xs text-slate-400">{s.email} · Joined {s.joined}</p>
                                            </div>
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ROLE_BADGE[s.role]}`}>{s.role}</span>
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setResetTarget(s); setActiveSection('passwords'); }} className="p-2 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors" title="Reset Password">
                                                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                                                </button>
                                                <button onClick={() => handleDeactivate(s.id)} className={`p-2 rounded-lg transition-colors ${s.status === 'active' ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500'}`} title={s.status === 'active' ? 'Deactivate' : 'Activate'}>
                                                    <span className="material-symbols-outlined text-[18px]">{s.status === 'active' ? 'block' : 'check_circle'}</span>
                                                </button>
                                                {confirmDeleteStaff === s.id ? (
                                                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl px-2 py-1">
                                                        <span className="text-[11px] text-rose-700 font-semibold">Remove?</span>
                                                        <button onClick={() => handleDeleteStaff(s.id)} className="px-1.5 py-0.5 bg-rose-500 text-white text-[11px] font-bold rounded-md">Yes</button>
                                                        <button onClick={() => setConfirmDeleteStaff(null)} className="px-1.5 py-0.5 border border-slate-200 text-slate-500 text-[11px] rounded-md">No</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDeleteStaff(s.id)} className="p-2 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors" title="Remove User">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Patient Table */}
                        {(staffRoleFilter === 'all' || staffRoleFilter === 'patient') && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                                <div className="min-w-[700px]">
                                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <h3 className="font-black text-slate-900">Registered Patients</h3>
                                        <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">warning</span>
                                            Delete is permanent
                                        </p>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                    {patients
                                        .filter(p => !staffSearch || p.name.toLowerCase().includes(staffSearch.toLowerCase()) || p.email.toLowerCase().includes(staffSearch.toLowerCase()) || p.pid.toLowerCase().includes(staffSearch.toLowerCase()))
                                        .map(p => (
                                        <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{p.initials}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                                <p className="text-xs text-slate-400">{p.email} · {p.pid}</p>
                                            </div>
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">patient</span>
                                            <p className="text-xs text-slate-400 hidden md:block">{p.conditions?.join(', ')}</p>
                                            {confirmDeletePatient === p.id ? (
                                                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                                    <span className="text-xs text-rose-700 font-semibold">Delete {p.name}?</span>
                                                    <button onClick={() => handleDeletePatient(p.id)} className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors">Yes</button>
                                                    <button onClick={() => setConfirmDeletePatient(null)} className="px-2 py-1 border border-slate-200 text-slate-500 text-xs rounded-lg hover:bg-white transition-colors">No</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeletePatient(p.id)} className="p-2 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors" title="Delete Patient">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ADD USER */}
                {activeSection === 'add-user' && (
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Admin › <span className="text-amber-600 font-semibold">Add New User</span></p>
                            <h2 className="text-2xl font-black text-slate-900">Register New User</h2>
                            <p className="text-sm text-slate-500">Add a doctor, pharmacist, caregiver, or patient to the system.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <form onSubmit={handleAddUser} className="space-y-5">
                                {/* Role Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">User Role</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {ROLE_OPTIONS.map(r => (
                                            <button type="button" key={r.value} onClick={() => handleFormChange('role', r.value)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-bold text-left ${form.role === r.value ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                                <div className={`p-2 rounded-lg ${r.color}`}>
                                                    <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
                                                </div>
                                                {r.label}
                                                {form.role === r.value && <span className="material-symbols-outlined text-amber-500 text-[18px] ml-auto">check_circle</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name</label>
                                        <input value={form.firstName} onChange={e => handleFormChange('firstName', e.target.value)}
                                            className="w-full px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                                            placeholder="e.g. Sarah" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name</label>
                                        <input value={form.lastName} onChange={e => handleFormChange('lastName', e.target.value)}
                                            className="w-full px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                                            placeholder="e.g. Chen" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                                    <input type="email" value={form.email} onChange={e => handleFormChange('email', e.target.value)}
                                        className="w-full px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                                        placeholder="e.g. dr.chen@meditrack.com" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Medical ID / Username</label>
                                    <input value={form.medicalId} onChange={e => handleFormChange('medicalId', e.target.value)}
                                        className="w-full px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                                        placeholder="e.g. @dr.chen or MT-00123" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Temporary Password</label>
                                    <input type="password" value={form.password} onChange={e => handleFormChange('password', e.target.value)}
                                        className="w-full px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all"
                                        placeholder="Min. 6 characters" />
                                    <p className="text-xs text-slate-400 mt-1">User should be prompted to change this on first login.</p>
                                </div>

                                {form.role === 'patient' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-blue-500">stethoscope</span>
                                            Primary Physician
                                        </label>
                                        <select 
                                            value={form.doctorId} 
                                            onChange={e => handleFormChange('doctorId', e.target.value)}
                                            className="w-full px-4 h-11 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select a doctor...</option>
                                            {staff.filter(s => s.role === 'doctor' || s.role === 'DOCTOR').map(doc => (
                                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {formError && (
                                    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                                        <span className="material-symbols-outlined text-rose-500 text-[18px]">error</span>
                                        <p className="text-sm text-rose-700 font-medium">{formError}</p>
                                    </div>
                                )}
                                {formSuccess && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                                        <p className="text-sm text-emerald-700 font-medium">{formSuccess}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button type="submit" disabled={formLoading} className="flex-1 bg-amber-500 hover:bg-amber-600 focus:ring-4 focus:ring-amber-200 text-white font-bold h-12 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed">
                                        {formLoading ? (
                                            <>
                                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                                Registering...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                                Register User
                                            </>
                                        )}
                                    </button>
                                    <button type="button" onClick={() => setForm({ role: 'doctor', firstName: '', lastName: '', email: '', medicalId: '', password: '', doctorId: '' })}
                                        className="px-6 h-12 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-colors">
                                        Clear
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* PASSWORD RESETS */}
                {activeSection === 'passwords' && (
                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Admin › <span className="text-amber-600 font-semibold">Password Resets</span></p>
                            <h2 className="text-2xl font-black text-slate-900">Password Resets</h2>
                            <p className="text-sm text-slate-500">Reset passwords for any staff member or patient.</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                            <div className="min-w-[600px] divide-y divide-slate-50">
                                {staff.map(s => (
                                <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.name[0]}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                                        <p className="text-xs text-slate-400">{s.email}</p>
                                    </div>
                                    {resetDone[s.id] ? (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span> Reset Done
                                        </span>
                                    ) : resetTarget?.id === s.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                                                placeholder="New password (min 6)"
                                                className="px-3 h-9 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 w-44"
                                            />
                                            <button onClick={() => handlePasswordReset(s.id)} className="px-3 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition-colors">Set</button>
                                            <button onClick={() => { setResetTarget(null); setNewPw(''); }} className="px-3 h-9 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setResetTarget(s)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-600 text-xs font-bold hover:bg-purple-100 transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                                            Reset Password
                                        </button>
                                    )}
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>
                )}
                </div>
                </div>
            </div>
        </div>
    );
}

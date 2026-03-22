import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getPatients } from '../../api/api';

const STATUS_CFG = {
    active: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
    flagged: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Flagged' },
    critical: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', label: 'Critical' },
};

function getPharmStatus(patient) {
    if (patient.activeEscalations > 0) return 'critical';
    if (patient.meds === 0) return 'flagged';
    return 'active';
}

export default function PatientRecordsPage() {
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const { data: patients } = useApi(getPatients);

    const allPatients = (patients || []).map(p => ({ ...p, pharmStatus: getPharmStatus(p) }));

    const searchFiltered = allPatients.filter(p => {
        return p.name.toLowerCase().includes(search.toLowerCase())
            || p.pid.toLowerCase().includes(search.toLowerCase());
    });

    const filtered = searchFiltered.filter(p => filterStatus === 'all' || p.pharmStatus === filterStatus);

    const rxList = selectedPatient?.prescriptions ?? [];

    const totalActive = searchFiltered.filter(p => p.pharmStatus === 'active').length;
    const totalFlagged = searchFiltered.filter(p => p.pharmStatus === 'flagged').length;
    const totalCritical = searchFiltered.filter(p => p.pharmStatus === 'critical').length;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 lg:mb-0 mb-16 space-y-5">

                {/* Header */}
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                        Portals › Pharmacy › <span className="text-primary font-semibold">Records</span>
                    </p>
                    <h2 className="text-2xl font-black text-slate-900">Patient Records</h2>
                    <p className="text-sm text-slate-500 mt-0.5">View and manage patient prescription profiles.</p>
                </div>

                {/* Summary Pills */}
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'All', count: searchFiltered.length, key: 'all', color: 'bg-slate-100 text-slate-700' },
                        { label: 'Active', count: totalActive, key: 'active', color: 'bg-emerald-100 text-emerald-700' },
                        { label: 'Flagged', count: totalFlagged, key: 'flagged', color: 'bg-amber-100 text-amber-700' },
                        { label: 'Critical', count: totalCritical, key: 'critical', color: 'bg-rose-100 text-rose-700' },
                    ].map(s => (
                        <button key={s.key} onClick={() => setFilterStatus(s.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors
                                ${filterStatus === s.key ? 'border-primary bg-primary text-white shadow-sm' : `${s.color} border-transparent hover:opacity-80`}`}>
                            {s.label}
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${filterStatus === s.key ? 'bg-white/20' : 'bg-black/10'}`}>{s.count}</span>
                        </button>
                    ))}
                    <div className="relative flex-1 min-w-[220px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search patient or ID…"
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white" />
                    </div>
                </div>

                {/* Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* Patient List */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-600">{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            {filtered.map(p => {
                                const cfg = STATUS_CFG[p.pharmStatus] || STATUS_CFG.active;
                                const selected = selectedPatient?.id === p.id;
                                const initials = p.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                                return (
                                    <div key={p.id} onClick={() => setSelectedPatient(p)}
                                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${selected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${selected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">{p.pid || p.id} · Age {p.age} · {p.blood}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-bold text-slate-700">{p.meds} med{p.meds !== 1 ? 's' : ''}</p>
                                            <p className="text-[11px] text-slate-400">{p.lastVisit}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {filtered.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">person_search</span>
                                    <p className="text-sm">No patients match your search.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Detail */}
                    <div className="lg:col-span-3">
                        {!selectedPatient ? (
                            <div className="bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                                <span className="material-symbols-outlined text-5xl mb-3">person</span>
                                <p className="text-sm font-semibold">Select a patient to view their records.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Profile Card */}
                                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-lg font-black">
                                            {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-black text-xl">{selectedPatient.name}</p>
                                            <p className="text-white/80 text-sm">{selectedPatient.pid || selectedPatient.id} · {selectedPatient.age} yrs · {selectedPatient.blood}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-white/60 text-xs">Last Visit</p>
                                            <p className="text-sm font-bold">{selectedPatient.lastVisit}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(selectedPatient.conditions || [selectedPatient.condition]).filter(Boolean).map(c => (
                                            <span key={c} className="bg-white/20 text-xs font-semibold px-2.5 py-1 rounded-full">{c}</span>
                                        ))}
                                    </div>
                                    {selectedPatient.allergies?.length > 0 && (
                                        <div className="bg-rose-500/30 border border-rose-300/30 rounded-xl px-3 py-2">
                                            <p className="text-xs font-bold text-white/90">⚠ Allergies: {selectedPatient.allergies.join(', ')}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                                        <p className="text-xl font-black text-slate-900">{selectedPatient.meds}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">Medications</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                                        <p className={`text-xl font-black ${selectedPatient.adherence >= 80 ? 'text-emerald-600' : selectedPatient.adherence >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{selectedPatient.adherence}%</p>
                                        <p className="text-[11px] text-slate-400 font-medium">Adherence</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                                        <p className="text-lg font-black text-slate-900">{rxList.length}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">Prescriptions</p>
                                    </div>
                                </div>

                                {/* Prescriptions */}
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-slate-100">
                                        <h3 className="font-black text-slate-900">Active Prescriptions</h3>
                                    </div>
                                    {rxList.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic p-5">No prescription data on file.</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {rxList.map((rx, i) => (
                                                <div key={i} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                <span className="material-symbols-outlined text-primary text-[16px]">medication</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{rx.drug} <span className="font-normal text-slate-400">{rx.dosage}</span></p>
                                                                <p className="text-xs text-slate-500">{rx.freq} · Issued {rx.issued}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${rx.refills > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {rx.refills} refill{rx.refills !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

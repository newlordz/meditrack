import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useApi } from '../../hooks/useApi';
import { getPatient } from '../../api/api';

/* ── Time Helper Functions ─────────────────────────────────── */
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!parts) return null;
    let h = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const period = parts[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
}

function getRelativeTimeLabel(doseTimeStr, now) {
    const doseMin = parseTimeToMinutes(doseTimeStr);
    if (doseMin === null) return '';
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const diff = doseMin - nowMin;
    if (diff > 0) {
        if (diff < 60) return `in ${diff}m`;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        return mins > 0 ? `in ${hrs}h ${mins}m` : `in ${hrs}h`;
    } else if (diff >= -30) {
        return 'due now';
    } else {
        const late = Math.abs(diff);
        if (late < 60) return `${late}m late`;
        return `${Math.floor(late / 60)}h late`;
    }
}

/* ── Dynamic Dose Evaluator ────────────────────────────────── */
function evaluateDoses(rawDoses, now) {
    if (!Array.isArray(rawDoses) || rawDoses.length === 0) return [];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Sort chronologically by time
    const sorted = [...rawDoses].sort((a, b) => {
        const aMin = parseTimeToMinutes(a.time) ?? 0;
        const bMin = parseTimeToMinutes(b.time) ?? 0;
        return aMin - bMin;
    });

    // Find the next active dose: earliest untaken dose that is upcoming or within 60 min late
    let nextIndex = -1;
    for (let i = 0; i < sorted.length; i++) {
        const d = sorted[i];
        if (d.status === 'taken' || d.loggedAt) continue;
        const dMin = parseTimeToMinutes(d.time);
        if (dMin === null) continue;
        const diff = dMin - nowMinutes;
        if (diff >= -60) {
            nextIndex = i;
            break;
        }
    }

    // If all untaken doses are > 60 min overdue, pick the first overdue dose
    if (nextIndex === -1) {
        for (let i = 0; i < sorted.length; i++) {
            const d = sorted[i];
            if (d.status === 'taken' || d.loggedAt) continue;
            nextIndex = i;
            break;
        }
    }

    return sorted.map((d, idx) => {
        if (d.status === 'taken' || d.loggedAt) {
            return { ...d, status: 'taken', isCurrent: false };
        }

        const dMin = parseTimeToMinutes(d.time);
        if (dMin === null) return { ...d, status: 'upcoming', isCurrent: false };
        const diff = dMin - nowMinutes;

        if (idx === nextIndex) {
            return {
                ...d,
                status: diff < -60 ? 'missed' : 'next',
                isCurrent: true,
            };
        } else if (diff < -60) {
            return { ...d, status: 'missed', isCurrent: false };
        } else {
            return { ...d, status: 'upcoming', isCurrent: false };
        }
    });
}

/* ── Circular SVG progress ring ────────────────────────────── */
function ProgressRing({ pct, size = 160, stroke = 12 }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
            />
        </svg>
    );
}

/* ── Status config ─────────────────────────────────────────── */
const S = {
    taken: { gFrom: 'from-emerald-400', gTo: 'to-teal-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Taken', glow: '' },
    missed: { gFrom: 'from-rose-400', gTo: 'to-red-500', badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Missed / Overdue', glow: 'shadow-rose-200' },
    next: { gFrom: 'from-blue-500', gTo: 'to-indigo-600', badge: 'bg-blue-600 text-white border-blue-700', label: 'Up Next', glow: 'shadow-blue-200' },
    upcoming: { gFrom: 'from-slate-300', gTo: 'to-slate-400', badge: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Upcoming', glow: '' },
};

/* ── Single dose tile ──────────────────────────────────────── */
function DoseTile({ dose, now, onVerify, onQuickLog, onViewDetails, index }) {
    const cfg = S[dose.status] || S.upcoming;
    const isCurrent = dose.status === 'next';
    const isTaken = dose.status === 'taken';
    const isMissed = dose.status === 'missed';
    const isUpcoming = dose.status === 'upcoming';
    const relTime = getRelativeTimeLabel(dose.time, now);

    return (
        <div
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 group
                ${isCurrent ? `bg-white border-2 border-blue-400 shadow-xl ${cfg.glow}` : ''}
                ${isTaken ? 'bg-white border border-slate-100 shadow-sm opacity-90' : ''}
                ${isMissed ? 'bg-rose-50/80 border border-rose-200 shadow-md' : ''}
                ${isUpcoming ? 'bg-white border border-slate-100 shadow-sm opacity-70' : ''}
            `}>
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${cfg.gFrom} ${cfg.gTo} rounded-l-2xl`} />

                <div className="flex items-center gap-4 px-5 py-4 pl-6">
                    {/* Gradient icon */}
                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${cfg.gFrom} ${cfg.gTo} flex items-center justify-center shadow-lg`}>
                        <span className="material-symbols-outlined text-white text-[26px]">{dose.icon || 'pill'}</span>
                        {isTaken && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="material-symbols-outlined text-white text-[11px]">check</span>
                            </div>
                        )}
                        {isMissed && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="material-symbols-outlined text-white text-[11px]">priority_high</span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isCurrent ? 'text-blue-600' : isMissed ? 'text-rose-600' : 'text-slate-500'}`}>
                                {dose.time}
                            </span>
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
                                {cfg.label}
                            </span>
                            {relTime && !isTaken && (
                                <span className="text-[10px] font-semibold text-slate-400">
                                    ({relTime})
                                </span>
                            )}
                        </div>
                        <h3 className={`font-black leading-tight truncate ${isCurrent ? 'text-xl text-slate-900' : isMissed ? 'text-lg text-rose-950' : 'text-base text-slate-800'}`}>
                            {dose.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                            {dose.dosage}{dose.instruction ? ` · ${dose.instruction}` : ''}
                        </p>
                        {isTaken && dose.loggedAt && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">schedule</span> Logged at {dose.loggedAt}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                        {isCurrent && (
                            <div className="flex flex-col gap-1.5 items-end">
                                <button onClick={() => onVerify(dose.id)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-400/30 hover:scale-105 hover:shadow-blue-400/50 active:scale-95 transition-all duration-200">
                                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                                    Verify
                                </button>
                                <button onClick={() => onQuickLog(dose.id)}
                                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5">
                                    Quick Take
                                </button>
                            </div>
                        )}
                        {isMissed && (
                            <div className="flex flex-col gap-1.5 items-end">
                                <button onClick={() => onVerify(dose.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-rose-400 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-100 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                                    Log Late
                                </button>
                                <button onClick={() => onQuickLog(dose.id)}
                                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5">
                                    Quick Take
                                </button>
                            </div>
                        )}
                        {isTaken && (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                            </div>
                        )}
                        {isUpcoming && (
                            <div className="flex flex-col items-end gap-1">
                                <button onClick={() => onViewDetails(dose)}
                                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                                    <span className="material-symbols-outlined text-[14px]">info</span> Details
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* "Next dose" glow pulsing bar at bottom */}
                {isCurrent && (
                    <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-pulse" />
                )}
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function DailyDosePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: realPatient } = useApi(() => getPatient(user?.id), [user?.id]);

    const [rawDoses, setRawDoses] = useState(() => {
        const saved = localStorage.getItem('meditrack_patient_doses');
        if (saved) {
            try { return JSON.parse(saved); } catch { /* fall through */ }
        }
        return [];
    });

    const [activeModal, setActiveModal] = useState(null);
    const [selectedDose, setSelectedDose] = useState(null);
    const [voiceStatus, setVoiceStatus] = useState('idle'); // idle | listening | success | no_match
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [now, setNow] = useState(new Date());

    /* live clock - updates every 30 seconds for crisp real-time status */
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    // Sync with real database prescriptions if present
    useEffect(() => {
        if (realPatient && Array.isArray(realPatient.schedules) && realPatient.schedules.length > 0) {
            const saved = localStorage.getItem('meditrack_patient_doses');
            const savedDoses = saved ? JSON.parse(saved) : [];
            const savedMap = new Map(savedDoses.map(d => [d.id, d]));

            const dbMapped = realPatient.schedules.map((s, idx) => {
                const existing = savedMap.get(s.id) || savedMap.get(idx + 1);
                const isTaken = existing?.status === 'taken' || (s.logs && s.logs.length > 0 && s.logs[0].action === 'TAKEN');
                const loggedAt = existing?.loggedAt || (isTaken && s.logs?.[0]?.loggedAt ? new Date(s.logs[0].loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null);

                return {
                    id: s.id || idx + 1,
                    scheduleId: s.id,
                    time: s.scheduledTime,
                    name: s.prescription.drugName,
                    dosage: s.prescription.dosage,
                    instruction: s.prescription.instructions || s.prescription.frequency || 'Take as directed',
                    status: isTaken ? 'taken' : 'upcoming',
                    loggedAt: loggedAt,
                    icon: s.prescription.drugName.toLowerCase().includes('aspirin') ? 'pill'
                        : s.prescription.drugName.toLowerCase().includes('lisinopril') ? 'vaccines'
                        : 'medication',
                };
            });

            setRawDoses(dbMapped);
            localStorage.setItem('meditrack_patient_doses', JSON.stringify(dbMapped));
        }
    }, [realPatient]);

    // Dynamically evaluate all doses relative to the real current time
    const doses = useMemo(() => {
        return evaluateDoses(rawDoses, now);
    }, [rawDoses, now]);

    // Persist changes
    useEffect(() => {
        localStorage.setItem('meditrack_patient_doses', JSON.stringify(rawDoses));
    }, [rawDoses]);

    useEffect(() => {
        const handle = () => {
            const saved = localStorage.getItem('meditrack_patient_doses');
            if (saved) setRawDoses(JSON.parse(saved));
        };
        window.addEventListener('rxDispensedOrPrescribed', handle);
        window.addEventListener('focus', handle);
        return () => {
            window.removeEventListener('rxDispensedOrPrescribed', handle);
            window.removeEventListener('focus', handle);
        };
    }, []);

    const handleViewDetails = (dose) => { setSelectedDose(dose); setActiveModal('info'); };

    const handleVerify = (doseId) => {
        navigate(`/patient/verify?doseId=${doseId}`);
    };

    const handleQuickLog = (doseId) => {
        const timeFormatted = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        setRawDoses(prev => {
            const updated = prev.map(d => {
                if (d.id === doseId) {
                    return { ...d, status: 'taken', loggedAt: timeFormatted };
                }
                return d;
            });
            localStorage.setItem('meditrack_patient_doses', JSON.stringify(updated));
            return updated;
        });
        window.dispatchEvent(new Event('rxDispensedOrPrescribed'));
    };

    // ── Browser Notification permission + dose alarm ──────────
    const [notifPermission, setNotifPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    );
    const notifiedRef = useRef(new Set());

    const requestNotifPermission = async () => {
        if (typeof Notification === 'undefined') return;
        const res = await Notification.requestPermission();
        setNotifPermission(res);
    };

    useEffect(() => {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(setNotifPermission);
        }

        const checkDoses = () => {
            const now = new Date();
            const nowH = now.getHours();
            const nowM = now.getMinutes();

            doses.forEach(dose => {
                if (dose.status === 'taken' || !dose.time) return;
                const dMin = parseTimeToMinutes(dose.time);
                if (dMin === null) return;
                const h = Math.floor(dMin / 60);
                const m = dMin % 60;

                const key = `${dose.id}-${h}-${m}-${now.toDateString()}`;
                if (h === nowH && m === nowM && !notifiedRef.current.has(key)) {
                    notifiedRef.current.add(key);
                    if (Notification.permission === 'granted') {
                        new Notification('💊 Time to take your medication', {
                            body: `${dose.name} ${dose.dosage} is due now. Open MediTrack to verify and log.`,
                            icon: '/favicon.ico',
                            tag: key,
                        });
                    }
                }
            });
        };

        checkDoses();
        const interval = setInterval(checkDoses, 30000);
        return () => clearInterval(interval);
    }, [doses]);

    // ── Voice Log ─────────────────────────────────────────────
    const handleVoiceLog = () => {
        setVoiceTranscript('');
        setVoiceStatus('listening');
        setActiveModal('voice');

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            const nextDoseItem = doses.find(d => d.status === 'next' || d.status === 'missed');
            setTimeout(() => {
                setActiveModal(null);
                setVoiceStatus('idle');
                if (nextDoseItem) navigate(`/patient/verify?doseId=${nextDoseItem.id}`);
            }, 1200);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;

        let resolved = false;

        recognition.onresult = (event) => {
            resolved = true;
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join(' ')
                .toLowerCase()
                .trim();

            setVoiceTranscript(transcript);
            const pendingDoses = doses.filter(d => d.status === 'next' || d.status === 'missed' || d.status === 'upcoming');

            const matched = pendingDoses.find(d =>
                transcript.includes(d.name.toLowerCase()) ||
                transcript.includes(d.name.split(' ')[0].toLowerCase())
            );

            const genericConfirm = /\b(taken|done|took|finished|yes|yep|confirm|ok|okay|log|ready)\b/.test(transcript);
            const targetDose = matched || (genericConfirm ? pendingDoses[0] : null);

            if (targetDose) {
                setVoiceStatus('success');
                setVoiceTranscript(`"${transcript}" → ${targetDose.name}`);
                setTimeout(() => {
                    setActiveModal(null);
                    setVoiceStatus('idle');
                    navigate(`/patient/verify?doseId=${targetDose.id}`);
                }, 1600);
            } else {
                setVoiceStatus('no_match');
                setVoiceTranscript(`Heard: "${transcript}"`);
            }
        };

        recognition.onerror = (e) => {
            resolved = true;
            setVoiceStatus('no_match');
            setVoiceTranscript(
                e.error === 'no-speech' ? 'Nothing heard — please try again.' :
                e.error === 'audio-capture' ? 'Microphone not accessible.' :
                e.error === 'not-allowed' ? 'Microphone permission denied.' :
                `Error: ${e.error}`
            );
        };

        recognition.onend = () => {
            if (!resolved) {
                setVoiceStatus('no_match');
                setVoiceTranscript('Nothing heard — please try again.');
            }
        };

        recognition.start();
    };

    const handleVoiceRetry = () => {
        setVoiceStatus('idle');
        setVoiceTranscript('');
        setActiveModal(null);
        setTimeout(handleVoiceLog, 200);
    };

    // Derived stats
    const takenCount = doses.filter(d => d.status === 'taken').length;
    const missedCount = doses.filter(d => d.status === 'missed').length;
    const upcomingCount = doses.filter(d => d.status === 'upcoming' || d.status === 'next').length;
    const totalCount = doses.length;
    const pct = totalCount === 0 ? 0 : Math.round((takenCount / totalCount) * 100);

    const nextDose = doses.find(d => d.status === 'next');
    const firstMissedDose = doses.find(d => d.status === 'missed');
    const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const adherenceLabel = pct === 100 ? 'Perfect!' : pct >= 80 ? 'On track' : pct >= 50 ? 'Keep going' : 'Needs attention';
    const adherenceColor = pct === 100 ? 'text-emerald-500' : pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="min-h-screen bg-[#f0f4ff]">

            {/* ── Detail Modal ────────────────────────────────── */}
            {activeModal === 'info' && selectedDose && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className={`bg-gradient-to-br ${S[selectedDose.status]?.gFrom ?? 'from-slate-400'} ${S[selectedDose.status]?.gTo ?? 'to-slate-500'} p-6 flex items-center gap-4`}>
                            <div className="w-16 h-16 bg-white/25 backdrop-blur rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[30px]">{selectedDose.icon || 'pill'}</span>
                            </div>
                            <div className="text-white">
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{selectedDose.time}</p>
                                <h3 className="text-2xl font-black leading-tight">{selectedDose.name}</h3>
                                <p className="text-white/80 text-sm">{selectedDose.dosage}</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="ml-auto w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-white text-[18px]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Scheduled Time', value: selectedDose.time, icon: 'schedule' },
                                { label: 'Dosage', value: selectedDose.dosage, icon: 'pill' },
                                { label: 'Instructions', value: selectedDose.instruction || 'Take with water', icon: 'info' },
                                selectedDose.status === 'taken' && { label: 'Logged At', value: selectedDose.loggedAt, icon: 'check_circle' },
                            ].filter(Boolean).map(f => (
                                <div key={f.label} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">{f.icon}</span>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{f.label}</p>
                                        <p className="text-sm font-semibold text-slate-800">{f.value}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-2 pt-2">
                                {selectedDose.status !== 'taken' && (
                                    <button onClick={() => { handleQuickLog(selectedDose.id); setActiveModal(null); }}
                                        className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm">
                                        Mark as Taken
                                    </button>
                                )}
                                <button onClick={() => setActiveModal(null)}
                                    className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Voice Modal ─────────────────────────────────── */}
            {activeModal === 'voice' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-80 p-8 text-center min-h-[240px] flex flex-col items-center justify-center">
                        {voiceStatus === 'listening' && (
                            <>
                                <div className="relative mx-auto mb-6 w-24 h-24">
                                    <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-60" />
                                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-400/40">
                                        <span className="material-symbols-outlined text-white text-[40px]">mic</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">Listening…</h3>
                                <p className="text-slate-400 text-sm mt-1">Say a drug name or<br /><span className="font-semibold text-slate-600">"taken", "done", "yes"</span></p>
                                <button onClick={() => { setActiveModal(null); setVoiceStatus('idle'); }}
                                    className="mt-5 text-xs text-slate-400 hover:text-slate-600 underline">Cancel</button>
                            </>
                        )}

                        {voiceStatus === 'success' && (
                            <>
                                <div className="mx-auto mb-4 w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-500 text-[42px]">check_circle</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">Got it! 🎉</h3>
                                {voiceTranscript && (
                                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mt-2 font-mono">{voiceTranscript}</p>
                                )}
                                <p className="text-emerald-600 font-semibold text-sm mt-3">Taking you to verify…</p>
                            </>
                        )}

                        {voiceStatus === 'no_match' && (
                            <>
                                <div className="mx-auto mb-4 w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-500 text-[42px]">help</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">Didn't catch that</h3>
                                {voiceTranscript && (
                                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mt-2 font-mono">{voiceTranscript}</p>
                                )}
                                <p className="text-slate-400 text-sm mt-2">Try saying your medication name or "done"</p>
                                <div className="flex gap-2 mt-5">
                                    <button onClick={handleVoiceRetry}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-opacity">
                                        Try Again
                                    </button>
                                    <button onClick={() => {
                                        setActiveModal(null);
                                        setVoiceStatus('idle');
                                        const nextDoseItem = doses.find(d => d.status === 'next' || d.status === 'missed');
                                        if (nextDoseItem) navigate(`/patient/verify?doseId=${nextDoseItem.id}`);
                                    }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-200 transition-colors">
                                        Skip to Verify
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Hero / Progress Section ──────────────────────── */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]" />

                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-12 w-48 h-48 bg-violet-400/20 rounded-full blur-2xl" />

                <div className="relative z-10 px-5 sm:px-8 pt-8 pb-10 max-w-lg mx-auto">
                    {/* Top row — date + voice */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{today}</p>
                            <p className="text-white text-2xl font-black">{timeStr}</p>
                        </div>
                        <button onClick={handleVoiceLog}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-sm rounded-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-md">
                            <span className="material-symbols-outlined text-[18px]">mic</span>
                            Voice Log
                        </button>
                    </div>

                    {/* Progress Ring + Stats */}
                    <div className="flex items-center gap-6">
                        <div className="relative flex-shrink-0">
                            <ProgressRing pct={pct} size={140} stroke={11} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white leading-none">{pct}%</span>
                                <span className={`text-xs font-bold ${adherenceColor}`}>{adherenceLabel}</span>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            {[
                                { label: 'Taken', value: takenCount, icon: 'check_circle', color: 'text-emerald-300' },
                                { label: 'Remaining', value: upcomingCount, icon: 'schedule', color: 'text-blue-200' },
                                { label: 'Missed / Overdue', value: missedCount, icon: 'priority_high', color: missedCount > 0 ? 'text-rose-300 font-black' : 'text-slate-300' },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-white/80 text-sm font-medium">{s.label}</span>
                                        <span className="text-white font-black text-base">{s.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Intelligent Status Callout */}
                    {nextDose ? (
                        <div className="mt-6 flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20">
                            <div className="w-2.5 h-2.5 bg-blue-300 rounded-full animate-pulse" />
                            <p className="text-white text-sm flex-1">
                                <span className="font-bold text-white">Up next:</span> {nextDose.name} {nextDose.dosage} at {nextDose.time}
                                {getRelativeTimeLabel(nextDose.time, now) && (
                                    <span className="text-blue-200 ml-1.5 font-semibold text-xs">
                                        ({getRelativeTimeLabel(nextDose.time, now)})
                                    </span>
                                )}
                            </p>
                            <button onClick={() => handleVerify(nextDose.id)}
                                className="px-3 py-1 bg-white text-blue-700 text-xs font-black rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
                                Take Now
                            </button>
                        </div>
                    ) : missedCount > 0 ? (
                        <div className="mt-6 flex items-center gap-3 bg-rose-500/20 backdrop-blur-md rounded-2xl px-4 py-3 border border-rose-300/30 text-white">
                            <span className="material-symbols-outlined text-rose-300 text-[20px]">warning</span>
                            <p className="text-xs sm:text-sm font-medium flex-1">
                                You have <span className="font-bold text-white">{missedCount} overdue dose{missedCount > 1 ? 's' : ''}</span> from today.
                            </p>
                            {firstMissedDose && (
                                <button onClick={() => handleVerify(firstMissedDose.id)}
                                    className="px-3 py-1 bg-white text-rose-700 text-xs font-black rounded-xl hover:bg-rose-50 transition-colors shadow-sm">
                                    Log Late
                                </button>
                            )}
                        </div>
                    ) : totalCount > 0 && takenCount === totalCount ? (
                        <div className="mt-6 flex items-center gap-3 bg-emerald-500/20 backdrop-blur-md rounded-2xl px-4 py-3 border border-emerald-300/30 text-white">
                            <span className="material-symbols-outlined text-emerald-300 text-[22px]">verified</span>
                            <p className="text-xs sm:text-sm font-bold">
                                All medications completed for today! Great job! 🎉
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ── Curved separator ────────────────────────────── */}
            <div className="bg-[#f0f4ff]">
                <svg viewBox="0 0 1440 50" className="w-full -mt-1 block" preserveAspectRatio="none" style={{ marginTop: '-2px' }}>
                    <path d="M0,50 C360,0 1080,0 1440,50 L1440,0 L0,0 Z" fill="url(#heroGrad)" />
                    <defs>
                        <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="50%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* ── Dose Timeline ────────────────────────────────── */}
            <div className="px-4 sm:px-6 pb-24 lg:pb-8 max-w-lg mx-auto -mt-2 space-y-3">
                {/* Section label */}
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Today's Schedule</p>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {totalCount} scheduled dose{totalCount !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Notification permission banner */}
                {notifPermission !== 'granted' && (
                    <button onClick={requestNotifPermission}
                        className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left hover:bg-amber-100 transition-colors shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-amber-500 text-[20px]">notifications_off</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-amber-800">Enable dose reminders</p>
                            <p className="text-xs text-amber-600">Get notified when it's time to take each medication.</p>
                        </div>
                        <span className="material-symbols-outlined text-amber-400 text-[18px] flex-shrink-0">chevron_right</span>
                    </button>
                )}

                {doses.map((dose, i) => (
                    <DoseTile
                        key={dose.id}
                        dose={dose}
                        now={now}
                        index={i}
                        onVerify={handleVerify}
                        onQuickLog={handleQuickLog}
                        onViewDetails={handleViewDetails}
                    />
                ))}

                {/* Motivational footer */}
                <div className="pt-4 text-center">
                    {pct === 100 ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
                            <p className="text-3xl mb-2">🎉</p>
                            <p className="text-lg font-black text-emerald-800">All doses complete!</p>
                            <p className="text-xs text-emerald-600 mt-1">You've achieved 100% adherence today. Keep up the great work!</p>
                        </div>
                    ) : missedCount > 0 && upcomingCount === 0 ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm text-center">
                            <p className="text-sm font-bold text-rose-800">End of daily schedule</p>
                            <p className="text-xs text-rose-600 mt-0.5">Please take and record your missed medication when safe to do so.</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-medium">
                            {takenCount === 0 ? "Let's get started — log your first dose today!" : `${takenCount} of ${totalCount} doses completed today.`}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

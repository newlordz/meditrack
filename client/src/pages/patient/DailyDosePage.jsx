import { useState, useEffect, useRef } from 'react';

import { PATIENT_MOCK_DOSES } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';


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
    missed: { gFrom: 'from-rose-400', gTo: 'to-red-500', badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Missed', glow: 'shadow-rose-200' },
    next: { gFrom: 'from-blue-500', gTo: 'to-indigo-600', badge: 'bg-blue-600 text-white border-blue-700', label: 'Up Next', glow: 'shadow-blue-200' },
    upcoming: { gFrom: 'from-slate-300', gTo: 'to-slate-400', badge: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Upcoming', glow: '' },
};

/* ── Single dose tile ──────────────────────────────────────── */
function DoseTile({ dose, onVerify, onViewDetails, index }) {
    const cfg = S[dose.status] || S.upcoming;
    const isCurrent = dose.status === 'next';
    const isTaken = dose.status === 'taken';
    const isMissed = dose.status === 'missed';
    const isUpcoming = dose.status === 'upcoming';

    // Convert "2:00 PM" → minutes since midnight for display purposes
    const getMinutesUntil = () => {
        if (!dose.time) return null;
        const [time, period] = dose.time.split(' ');
        const [hStr, mStr] = time.split(':');
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const now = new Date();
        const doseMinutes = h * 60 + m;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        return doseMinutes - nowMinutes;
    };
    const minsUntil = isUpcoming ? getMinutesUntil() : null;

    return (
        <div
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.07}s` }}
        >
            <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 group
                ${isCurrent ? `bg-white border-2 border-blue-400 shadow-xl ${cfg.glow}` : ''}
                ${isTaken ? 'bg-white border border-slate-100 shadow-sm opacity-90' : ''}
                ${isMissed ? 'bg-rose-50 border border-rose-200 shadow-md' : ''}
                ${isUpcoming ? 'bg-white border border-slate-100 shadow-sm opacity-60' : ''}
            `}>
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${cfg.gFrom} ${cfg.gTo} rounded-l-2xl`} />

                <div className="flex items-center gap-4 px-5 py-4 pl-6">
                    {/* Gradient icon */}
                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${cfg.gFrom} ${cfg.gTo} flex items-center justify-center shadow-lg`}>
                        <span className="material-symbols-outlined text-white text-[26px]">{dose.icon}</span>
                        {isTaken && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="material-symbols-outlined text-white text-[11px]">check</span>
                            </div>
                        )}
                        {isMissed && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="material-symbols-outlined text-white text-[11px]">close</span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-blue-500' : 'text-slate-400'}`}>
                                {dose.time}
                            </span>
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.badge}`}>
                                {cfg.label}
                            </span>
                        </div>
                        <h3 className={`font-black leading-tight truncate ${isCurrent ? 'text-xl text-slate-900' : 'text-base text-slate-800'}`}>
                            {dose.name}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">
                            {dose.dosage}{dose.instruction ? ` · ${dose.instruction}` : ''}
                        </p>
                        {isTaken && dose.loggedAt && (
                            <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">schedule</span> Logged at {dose.loggedAt}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                        {isCurrent && (
                            <div className="flex flex-col gap-2 items-end">
                                <button onClick={() => onVerify(dose.id)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-400/30 hover:scale-105 hover:shadow-blue-400/50 active:scale-95 transition-all duration-200">
                                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                                    Verify &amp; Log
                                </button>
                                <button onClick={() => onViewDetails(dose)}
                                    className="text-xs text-slate-400 hover:text-blue-500 transition-colors font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">info</span> Details
                                </button>
                            </div>
                        )}
                        {isMissed && (
                            <button onClick={() => onVerify(dose.id)}
                                className="flex items-center gap-1.5 px-3 py-2 border-2 border-rose-400 text-rose-600 font-bold rounded-xl text-sm hover:bg-rose-50 active:scale-95 transition-all">
                                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                                Verify &amp; Log
                            </button>
                        )}
                        {isTaken && (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-emerald-500 text-[22px]">check_circle</span>
                            </div>
                        )}
                        {isUpcoming && (
                            <div className="flex flex-col items-end gap-1">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-300 text-[22px]">schedule</span>
                                </div>
                                {minsUntil !== null && minsUntil > 0 && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                        in {minsUntil >= 60 ? `${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m` : `${minsUntil}m`}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* "Next dose" glow pulsing bar at bottom */}
                {isCurrent && (
                    <div className="h-0.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-pulse" />
                )}
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function DailyDosePage() {
    const navigate = useNavigate();
    const [doses, setDoses] = useState(() => {
        const saved = localStorage.getItem('meditrack_patient_doses');
        if (saved) {
            try { return JSON.parse(saved); } catch { /* fall through */ }
        }
        const initial = PATIENT_MOCK_DOSES;
        localStorage.setItem('meditrack_patient_doses', JSON.stringify(initial));
        return initial;
    });

    const [activeModal, setActiveModal] = useState(null);
    const [selectedDose, setSelectedDose] = useState(null);
    const [voiceStatus, setVoiceStatus] = useState('idle'); // idle | listening | success
    const [now, setNow] = useState(new Date());

    /* live clock */
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

    useEffect(() => {
        localStorage.setItem('meditrack_patient_doses', JSON.stringify(doses));
    }, [doses]);

    useEffect(() => {
        const handle = () => {
            const saved = localStorage.getItem('meditrack_patient_doses');
            if (saved) setDoses(JSON.parse(saved));
        };
        window.addEventListener('rxDispensedOrPrescribed', handle);
        return () => window.removeEventListener('rxDispensedOrPrescribed', handle);
    }, []);

    const handleViewDetails = (dose) => { setSelectedDose(dose); setActiveModal('info'); };

    // Navigate to Pill Verification with doseId in query param
    const handleVerify = (doseId) => {
        navigate(`/patient/verify?doseId=${doseId}`);
    };

    // Re-read doses when returning from PillVerify (localStorage may have changed)
    useEffect(() => {
        const onFocus = () => {
            const saved = localStorage.getItem('meditrack_patient_doses');
            if (saved) setDoses(JSON.parse(saved));
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

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
        // Request permission on mount
        if (Notification.permission === 'default') Notification.requestPermission().then(setNotifPermission);

        const checkDoses = () => {
            const now = new Date();
            const nowH = now.getHours();
            const nowM = now.getMinutes();
            const saved = localStorage.getItem('meditrack_patient_doses');
            const doseList = saved ? JSON.parse(saved) : [];

            doseList.forEach(dose => {
                if (dose.status === 'taken') return;
                if (!dose.time) return;
                // Parse "8:00 AM" / "2:00 PM" style time
                const parts = dose.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!parts) return;
                let h = parseInt(parts[1], 10);
                const m = parseInt(parts[2], 10);
                const period = parts[3].toUpperCase();
                if (period === 'PM' && h !== 12) h += 12;
                if (period === 'AM' && h === 12) h = 0;

                const key = `${dose.id}-${h}-${m}`;
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

        checkDoses(); // run immediately
        const interval = setInterval(checkDoses, 60000); // every minute
        return () => clearInterval(interval);
    }, []);



    const [voiceTranscript, setVoiceTranscript] = useState('');

    const handleVoiceLog = () => {
        setVoiceTranscript('');
        setVoiceStatus('listening');
        setActiveModal('voice');

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            // Fallback: no speech API — jump straight to verify for next due dose
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

        // Track whether onresult or onerror has already resolved the state,
        // so onend doesn't clobber a 'success' result with 'no_match'
        let resolved = false;

        recognition.onresult = (event) => {
            resolved = true;
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join(' ')
                .toLowerCase()
                .trim();

            setVoiceTranscript(transcript);

            const pendingDoses = doses.filter(d => d.status === 'next' || d.status === 'missed');

            // Try to match against a drug name
            const matched = pendingDoses.find(d =>
                transcript.includes(d.name.toLowerCase()) ||
                transcript.includes(d.name.split(' ')[0].toLowerCase())
            );

            // Accept generic confirmations → pick the first pending dose
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

        // Only fall to no_match if neither onresult nor onerror resolved things
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



    const takenCount = doses.filter(d => d.status === 'taken').length;
    const totalCount = doses.length;
    const pct = totalCount === 0 ? 0 : Math.round((takenCount / totalCount) * 100);
    const nextDose = doses.find(d => d.status === 'next');
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
                                <span className="material-symbols-outlined text-white text-[30px]">{selectedDose.icon}</span>
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
                                { label: 'Instructions', value: selectedDose.instruction || '—', icon: 'info' },
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
                            <button onClick={() => setActiveModal(null)}
                                className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Voice Modal ─────────────────────────────────── */}
            {activeModal === 'voice' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-80 p-8 text-center min-h-[240px] flex flex-col items-center justify-center">

                        {/* Listening */}
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

                        {/* Success — matched a dose, redirecting to verify */}
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

                        {/* No match — couldn't understand */}
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
                {/* Background gradient mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]" />

                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 -left-12 w-48 h-48 bg-violet-400/20 rounded-full blur-2xl" />

                <div className="relative z-10 px-5 sm:px-8 pt-8 pb-10 max-w-lg mx-auto">

                    {/* Top row — date + voice */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{today}</p>
                            <p className="text-white text-lg font-black">{timeStr}</p>
                        </div>
                        <button onClick={handleVoiceLog}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-sm rounded-2xl border border-white/20 transition-all hover:scale-105 active:scale-95">
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
                                { label: 'Remaining', value: totalCount - takenCount - doses.filter(d => d.status === 'missed').length, icon: 'schedule', color: 'text-blue-200' },
                                { label: 'Missed', value: doses.filter(d => d.status === 'missed').length, icon: 'cancel', color: 'text-rose-300' },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-white/70 text-sm font-medium">{s.label}</span>
                                        <span className="text-white font-black text-base">{s.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next dose callout */}
                    {nextDose && (
                        <div className="mt-6 flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <p className="text-white/80 text-sm">
                                <span className="font-bold text-white">Up next:</span> {nextDose.name} {nextDose.dosage} at {nextDose.time}
                            </p>
                        </div>
                    )}
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
                    <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">
                        {totalCount} doses
                    </span>
                </div>

                {/* Notification permission banner */}
                {notifPermission !== 'granted' && (
                    <button onClick={requestNotifPermission}
                        className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left hover:bg-amber-100 transition-colors">
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
                        index={i}
                        onVerify={handleVerify}
                        onViewDetails={handleViewDetails}
                    />
                ))}

                {/* Motivational footer */}
                <div className="pt-4 text-center">
                    {pct === 100 ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                            <p className="text-3xl mb-2">🎉</p>
                            <p className="text-lg font-black text-emerald-700">All doses complete!</p>
                            <p className="text-sm text-emerald-600 mt-1">You're crushing it. See you tomorrow!</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-medium">
                            {takenCount === 0 ? "Let's get started — log your first dose today!" : `${takenCount} of ${totalCount} done. Keep it up!`}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

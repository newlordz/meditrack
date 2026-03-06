import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple pill lookup for demo — in production this hits OpenFDA / Pillbox API
const PILL_DATABASE = {
    'Lisinopril': { shape: 'Round', color: 'Light Pink', imprint: 'L 10', score: 'Unscored' },
    'Metformin': { shape: 'Oval', color: 'White', imprint: 'M 500', score: 'Scored' },
    'Aspirin': { shape: 'Round', color: 'White', imprint: 'ASA 81', score: 'Unscored' },
    'Vitamin D3': { shape: 'Capsule', color: 'Yellow/Gold', imprint: 'VD3', score: 'N/A' },
    'Omega-3': { shape: 'Oval', color: 'Clear/Gold', imprint: 'None', score: 'N/A' },
};

export default function PillVerificationPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Load ALL doses from localStorage so patient can pick which one to verify
    const [allDoses] = useState(() => {
        const saved = localStorage.getItem('meditrack_patient_doses');
        return saved ? JSON.parse(saved) : [];
    });

    // Pre-select from URL ?doseId=X first, then fall back to current/next dose
    const [selectedDoseId, setSelectedDoseId] = useState(() => {
        const urlDoseId = new URLSearchParams(window.location.search).get('doseId');
        const saved = localStorage.getItem('meditrack_patient_doses');
        if (!saved) return null;
        const doses = JSON.parse(saved);
        if (urlDoseId) {
            const id = parseInt(urlDoseId, 10);
            if (doses.find(d => d.id === id)) return id;
        }
        const due = doses.find(d => d.isCurrent || d.status === 'next');
        return due ? due.id : (doses.length > 0 ? doses[0].id : null);
    });


    const selectedDose = allDoses.find(d => d.id === selectedDoseId) ?? null;
    const pillInfo = selectedDose ? (PILL_DATABASE[selectedDose.name] ?? { shape: '—', color: '—', imprint: '—', score: '—' }) : null;

    const [stream, setStream] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [snapshot, setSnapshot] = useState(null);
    const [scanState, setScanState] = useState('idle');
    const [scanResult, setScanResult] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    /* ── Network status listener ────────────────────────────────── */
    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    /* ── FIX: wire stream to <video> AFTER it mounts ──────────── */
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => { });
        }
    }, [stream, isScanning]); // re-runs after isScanning flips true and <video> renders

    /* ── Cleanup on unmount ────────────────────────────────────── */
    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [stream]);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setStream(mediaStream);
            setIsScanning(true);
            setSnapshot(null);
            setScanState('idle');
            setScanResult(null);
        } catch (err) {
            console.error('Camera access denied:', err);
            alert('Camera access was denied. Please allow camera access in your browser settings and try again.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(null);
        setIsScanning(false);
    }, [stream]);

    /* ── Capture snapshot from video ───────────────────────────── */
    const handleCapture = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setSnapshot(dataUrl);
        stopCamera();

        // Simulate AI scan (1.8 s delay)
        setScanState('scanning');
        setTimeout(() => {
            setScanState('done');
            setScanResult({
                visualMatch: Math.floor(Math.random() * 6) + 94, // 94-99%
                pillName: selectedDose?.name,
                matched: true,
            });
        }, 1800);
    }, [stopCamera, selectedDose]);

    /* ── Confirm & log the SELECTED dose ─────────────────────── */
    const handleConfirmDose = () => {
        if (!selectedDoseId) return;
        const saved = localStorage.getItem('meditrack_patient_doses');
        if (saved) {
            const doses = JSON.parse(saved);
            const idx = doses.findIndex(d => d.id === selectedDoseId);
            if (idx !== -1) {
                doses[idx].status = 'taken';
                doses[idx].isCurrent = false;
                doses[idx].loggedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                // If this was the 'next' dose, advance to the next upcoming one
                if (doses[idx].status === 'taken') {
                    const nextIdx = doses.findIndex(d => d.status === 'upcoming');
                    if (nextIdx !== -1) {
                        doses[nextIdx].status = 'next';
                        doses[nextIdx].isCurrent = true;
                    }
                }
                localStorage.setItem('meditrack_patient_doses', JSON.stringify(doses));
            }
        }
        setTimeout(() => navigate('/patient/schedule'), 300);
    };

    const handleRetake = () => {
        setSnapshot(null);
        setScanState('idle');
        setScanResult(null);
        startCamera();
    };

    return (
        <>
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Header */}
            <header className="bg-surface border-b border-border sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-text-secondary">
                        <span>Verification Suite</span>
                        <span className="mx-2">›</span>
                        <span className="font-semibold text-text-primary">Webcam Pill Verification</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-xs font-bold transition-colors ${isOnline
                            ? 'border-success text-success'
                            : 'border-danger text-danger'
                            }`}>
                            {isOnline ? '🟢 System Online' : '🔴 System Offline'}
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mb-20 lg:mb-0">
                <div className="mb-5 sm:mb-6">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Pill Identification</h2>
                    <p className="text-text-secondary mt-1">Place your medication within the scanning frame and take a photo.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Camera / Snapshot view ─────────────── */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 rounded-2xl overflow-hidden relative" style={{ aspectRatio: '4/3' }}>

                            {/* Idle state */}
                            {!isScanning && !snapshot && (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                                    <div className="text-center space-y-4 px-6">
                                        <span className="material-symbols-outlined text-6xl text-slate-600">photo_camera</span>
                                        <p className="text-slate-400">Camera inactive — click Start Camera to begin verification</p>
                                        <button
                                            onClick={startCamera}
                                            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                                        >
                                            Start Camera
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Live video */}
                            {isScanning && (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {/* Captured snapshot + scan overlay */}
                            {snapshot && (
                                <>
                                    <img src={snapshot} alt="Captured pill" className="w-full h-full object-cover" />
                                    {scanState === 'scanning' && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4">
                                            <div className="w-12 h-12 border-4 border-white/30 border-t-primary rounded-full animate-spin" />
                                            <p className="text-white font-semibold">Analysing pill image...</p>
                                        </div>
                                    )}
                                    {scanState === 'done' && scanResult?.matched && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="border-4 border-success rounded-xl w-[50%] h-[55%] flex items-end justify-center pb-2">
                                                <span className="bg-success text-white text-xs font-bold px-3 py-1 rounded-full">
                                                    ✓ Match Detected
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Scanning dashed frame overlay */}
                            {isScanning && (
                                <>
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white text-sm px-4 py-2 rounded-full flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm">info</span>
                                        Place your pill within the frame then capture
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-[50%] h-[55%] border-2 border-dashed border-primary/70 rounded-lg" />
                                    </div>
                                </>
                            )}

                            {/* Bottom control bar */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isScanning && (
                                            <>
                                                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                                                <span className="text-white text-sm font-medium">Live</span>
                                            </>
                                        )}
                                        {scanState === 'done' && (
                                            <span className="text-success text-sm font-bold">Scan complete</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isScanning && (
                                            <>
                                                {/* Shutter / capture button */}
                                                <button
                                                    onClick={handleCapture}
                                                    title="Capture pill image"
                                                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-white/50 hover:scale-105 transition-transform shadow-lg"
                                                >
                                                    <div className="w-11 h-11 bg-slate-200 rounded-full" />
                                                </button>
                                                {/* Stop/cancel */}
                                                <button
                                                    onClick={stopCamera}
                                                    title="Cancel"
                                                    className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-white">close</span>
                                                </button>
                                            </>
                                        )}
                                        {snapshot && scanState !== 'scanning' && (
                                            <button
                                                onClick={handleRetake}
                                                className="px-4 py-2 bg-white/20 backdrop-blur text-white text-sm font-bold rounded-xl hover:bg-white/30 transition-colors"
                                            >
                                                Retake
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Panel ─────────────────────────── */}
                    <div className="space-y-4">

                        {/* Prescription Target */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <h3 className="font-bold text-lg mb-4">Prescription Target</h3>

                            {/* Empty state — no prescriptions at all */}
                            {allDoses.length === 0 && (
                                <div className="text-center py-6 space-y-2">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">medication_liquid</span>
                                    <p className="text-sm text-text-secondary">No prescribed medications found.</p>
                                    <p className="text-xs text-text-muted">Your doctor-prescribed doses will appear here once added.</p>
                                </div>
                            )}

                            {/* Medication selector dropdown */}
                            {allDoses.length > 0 && (
                                <>
                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">Select Medication to Verify</label>
                                        <select
                                            value={selectedDoseId ?? ''}
                                            onChange={e => {
                                                setSelectedDoseId(Number(e.target.value));
                                                // Reset scan when switching medication
                                                setSnapshot(null);
                                                setScanState('idle');
                                                setScanResult(null);
                                                stopCamera();
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            {allDoses.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} {d.dosage} — {d.time} ({d.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedDose && (
                                        <>
                                            {/* Dose badge row */}
                                            <div className="flex items-center gap-3 bg-background rounded-xl p-3 mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary">pill</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold">{selectedDose.name}</p>
                                                    <p className="text-xs text-text-secondary">{selectedDose.dosage}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${selectedDose.status === 'taken' ? 'bg-emerald-100 text-emerald-700' :
                                                    selectedDose.status === 'missed' ? 'bg-rose-100 text-rose-700' :
                                                        selectedDose.status === 'next' ? 'bg-primary text-white' :
                                                            'bg-slate-100 text-slate-500'
                                                    }`}>{selectedDose.status}</span>
                                            </div>

                                            {/* Scheduled time */}
                                            <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4">
                                                <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                                                Scheduled: <span className="font-semibold text-text-primary">{selectedDose.time}</span>
                                            </div>

                                            {/* Pill physical details */}
                                            {pillInfo && (
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    {[
                                                        { label: 'Shape', value: pillInfo.shape },
                                                        { label: 'Color', value: pillInfo.color },
                                                        { label: 'Imprint', value: pillInfo.imprint },
                                                        { label: 'Scoring', value: pillInfo.score },
                                                    ].map(({ label, value }) => (
                                                        <div key={label}>
                                                            <p className="text-text-muted text-xs mb-0.5">{label}</p>
                                                            <p className="font-medium">{value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Verification Status — updates after scan */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <h3 className="font-bold text-lg mb-4">Verification Status</h3>

                            {scanState === 'idle' && (
                                <p className="text-sm text-text-secondary text-center py-4">
                                    Start the camera and take a photo to verify this pill.
                                </p>
                            )}

                            {scanState === 'scanning' && (
                                <p className="text-sm text-text-secondary text-center py-4 animate-pulse">
                                    Analysing image...
                                </p>
                            )}

                            {scanState === 'done' && scanResult && (
                                <>
                                    {/* Visual Match */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-text-secondary">Visual Match</span>
                                        <span className="text-sm font-bold text-success">{scanResult.visualMatch}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                                        <div
                                            className="h-full bg-success rounded-full transition-all duration-1000"
                                            style={{ width: `${scanResult.visualMatch}%` }}
                                        />
                                    </div>

                                    {/* Checks */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2 border-b border-border">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-success text-sm">check_circle</span>
                                                <span className="text-sm">Authenticity Check</span>
                                            </div>
                                            <span className="text-xs font-bold text-success uppercase">Passed</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-success text-sm">check_circle</span>
                                                <span className="text-sm">Batch Verification</span>
                                            </div>
                                            <span className="text-xs font-bold text-success uppercase">Passed</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3 mt-6">
                                        <button
                                            onClick={handleConfirmDose}
                                            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                                        >
                                            Confirm &amp; Log Dose
                                        </button>
                                        <button
                                            onClick={handleRetake}
                                            className="w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
                                        >
                                            Retake Photo
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Scanning Tips */}
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Scanning Tips</h4>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">light_mode</span>
                                    Use bright, even lighting — avoid shadows.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">center_focus_strong</span>
                                    Keep the pill centered and flat on a plain surface.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">pill</span>
                                    Ensure the imprint on the pill is clearly visible.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">cancel</span>
                                    Remove any other objects from the frame.
                                </li>
                            </ul>
                        </div>

                        {/* What is needed for real pill ID */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">📋 For Real AI Pill ID</h4>
                            <ul className="space-y-1.5 text-xs text-amber-800 leading-relaxed">
                                <li className="flex gap-1.5"><span className="font-bold">1.</span> Integration with <strong>OpenFDA Pill Image API</strong> or <strong>NLM Pillbox</strong> database</li>
                                <li className="flex gap-1.5"><span className="font-bold">2.</span> A computer-vision model (e.g. Google Vision API or a custom CNN) to extract imprint, shape, colour</li>
                                <li className="flex gap-1.5"><span className="font-bold">3.</span> The patient&apos;s prescription record to cross-check the matched drug</li>
                                <li className="flex gap-1.5"><span className="font-bold">4.</span> Pharmacy batch number for counterfeit detection</li>
                            </ul>
                            <p className="text-[10px] text-amber-600 mt-3">Currently using simulated matching — Phase 6 backend will integrate real OCR + drug API.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

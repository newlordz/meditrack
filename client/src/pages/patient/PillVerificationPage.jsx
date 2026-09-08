import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useApi } from '../../hooks/useApi';
import { getPatient, recordMedicationLog, verifyMedicinePicture } from '../../api/api';
import { PILL_DATABASE } from '../../data/mockData';

/**
 * Analyzes visual canvas frame for human skin tones / face presence vs pill contrast
 */
function analyzeCanvasContent(canvas) {
    try {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        if (!width || !height) return { isFaceOrSkin: false, skinRatio: 0 };

        // Sample up to 6,000 pixels evenly across the canvas
        const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 6000)));
        const imgData = ctx.getImageData(0, 0, width, height).data;

        let totalPixels = 0;
        let skinPixels = 0;

        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const idx = (y * width + x) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];
                totalPixels++;

                // Human skin tone heuristic (Kovacs + melanin-rich adaptive rule)
                const isSkin = (
                    (r > 95 && g > 40 && b > 20 &&
                     (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
                     Math.abs(r - g) > 15 &&
                     r > g && r > b) ||
                    (r > 40 && g > 25 && b > 15 &&
                     r > g && g >= b && (r - g) >= 8)
                );
                if (isSkin) skinPixels++;
            }
        }

        const skinRatio = totalPixels > 0 ? (skinPixels / totalPixels) : 0;
        return {
            isFaceOrSkin: skinRatio > 0.18, // Over 18% skin tones indicates a person/face/selfie
            skinRatio: Math.round(skinRatio * 100)
        };
    } catch {
        return { isFaceOrSkin: false, skinRatio: 0 };
    }
}

/**
 * Compresses and downscales high-res image files (from smartphones or DSLRs)
 * to max 1280x1280 at 0.85 quality and extracts visual heuristics.
 */
function compressAndResizeImage(fileOrDataUrl, maxDim = 1280, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const metrics = analyzeCanvasContent(canvas);
            resolve({
                dataUrl: canvas.toDataURL('image/jpeg', quality),
                metrics
            });
        };
        img.onerror = (e) => reject(e);

        if (typeof fileOrDataUrl === 'string') {
            img.src = fileOrDataUrl;
        } else {
            const reader = new FileReader();
            reader.onload = () => { img.src = reader.result; };
            reader.onerror = reject;
            reader.readAsDataURL(fileOrDataUrl);
        }
    });
}

export default function PillVerificationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const { data: realPatient } = useApi(() => getPatient(user?.id || user?.userId), [user?.id, user?.userId]);
    const storageKey = user?.id || user?.userId ? `meditrack_patient_doses_${user?.id || user?.userId}` : null;

    // Load doses from live realPatient schedules if available, else patient-scoped localStorage
    const [allDoses, setAllDoses] = useState(() => {
        if (!storageKey) return [];
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        if (!realPatient) return;
        const currentKey = `meditrack_patient_doses_${realPatient.id || user?.id || user?.userId}`;
        const saved = localStorage.getItem(currentKey);
        const savedDoses = saved ? JSON.parse(saved) : [];
        const savedMap = new Map(savedDoses.map(d => [String(d.id), d]));

        // Case A: Real Schedules from database
        if (Array.isArray(realPatient.schedules) && realPatient.schedules.length > 0) {
            const mapped = realPatient.schedules.map((s, idx) => {
                const existing = savedMap.get(String(s.id)) || savedMap.get(String(idx + 1));
                const isTaken = existing?.status === 'taken' || (s.logs && s.logs.length > 0 && s.logs[0].action === 'TAKEN');
                return {
                    id: s.id || idx + 1,
                    scheduleId: s.id,
                    prescriptionId: s.prescriptionId,
                    time: s.scheduledTime,
                    name: s.prescription?.drugName || 'Medication',
                    dosage: s.prescription?.dosage || '',
                    instruction: s.prescription?.instructions || 'Take as directed',
                    status: isTaken ? 'taken' : 'upcoming',
                };
            });
            setAllDoses(mapped);
            setSelectedDoseId(prev => {
                if (prev && mapped.some(d => String(d.id) === String(prev))) return prev;
                const urlDoseId = new URLSearchParams(window.location.search).get('doseId');
                if (urlDoseId) {
                    const match = mapped.find(d => String(d.id) === String(urlDoseId));
                    if (match) return match.id;
                }
                const upcoming = mapped.find(d => d.status !== 'taken');
                return upcoming ? upcoming.id : (mapped[0]?.id || null);
            });
        } else if (Array.isArray(realPatient.prescriptions) && realPatient.prescriptions.some(p => p.status === 'ACTIVE')) {
            // Case B: Active prescriptions exist without schedules yet -> derive doses (matching DailyDosePage)
            const derived = [];
            realPatient.prescriptions.filter(p => p.status === 'ACTIVE').forEach((p) => {
                const freqLower = (p.frequency || '').toLowerCase();
                let times = ['08:00 AM'];
                if (freqLower.includes('twice') || freqLower.includes('2x') || freqLower.includes('bid')) times = ['08:00 AM', '08:00 PM'];
                else if (freqLower.includes('three') || freqLower.includes('3x') || freqLower.includes('tid')) times = ['08:00 AM', '02:00 PM', '08:00 PM'];
                else if (freqLower.includes('night') || freqLower.includes('bedtime') || freqLower.includes('pm')) times = ['09:00 PM'];

                times.forEach((t, tIdx) => {
                    const uniqueId = `rx_${p.id}_${tIdx}`;
                    const existing = savedMap.get(uniqueId);
                    derived.push({
                        id: uniqueId,
                        prescriptionId: p.id,
                        time: t,
                        name: p.drugName,
                        dosage: p.dosage,
                        instruction: p.instructions || p.frequency || 'Take as directed',
                        status: existing?.status === 'taken' ? 'taken' : 'upcoming',
                    });
                });
            });

            setAllDoses(derived);
            setSelectedDoseId(prev => {
                if (prev && derived.some(d => String(d.id) === String(prev))) return prev;
                const urlDoseId = new URLSearchParams(window.location.search).get('doseId');
                if (urlDoseId) {
                    const match = derived.find(d => String(d.id) === String(urlDoseId));
                    if (match) return match.id;
                }
                const upcoming = derived.find(d => d.status !== 'taken');
                return upcoming ? upcoming.id : (derived[0]?.id || null);
            });
        } else {
            setAllDoses([]);
        }
    }, [realPatient, user?.id, user?.userId]);

    // Pre-select from URL ?doseId=X first, then fall back to current/next dose
    const [selectedDoseId, setSelectedDoseId] = useState(() => {
        const urlDoseId = new URLSearchParams(window.location.search).get('doseId');
        const saved = storageKey ? localStorage.getItem(storageKey) : null;
        if (!saved) return null;
        const doses = JSON.parse(saved);
        if (urlDoseId) {
            const match = doses.find(d => String(d.id) === String(urlDoseId));
            if (match) return match.id;
        }
        const due = doses.find(d => d.isCurrent || d.status === 'next');
        return due ? due.id : (doses.length > 0 ? doses[0].id : null);
    });

    const selectedDose = allDoses.find(d => String(d.id) === String(selectedDoseId)) ?? null;
    const pillInfo = selectedDose ? (() => {
        const base = (selectedDose.name || '').split(' ')[0].toLowerCase();
        const matchKey = Object.keys(PILL_DATABASE).find(k => 
            (selectedDose.name || '').toLowerCase().includes(k.toLowerCase()) || 
            k.toLowerCase().includes(base)
        );
        return matchKey ? PILL_DATABASE[matchKey] : (PILL_DATABASE[selectedDose.name] ?? { shape: 'Round', color: 'White', imprint: 'Rx Valid', score: 'Standard' });
    })() : null;

    const [stream, setStream] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [snapshot, setSnapshot] = useState(null);
    const [scanState, setScanState] = useState('idle'); // 'idle' | 'scanning' | 'done' | 'error'
    const [scanResult, setScanResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSubmittingLog, setIsSubmittingLog] = useState(false);

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

    /* ── Wire stream to <video> AFTER it mounts ──────────────────── */
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => { });
        }
    }, [stream, isScanning]);

    /* ── Cleanup on unmount ────────────────────────────────────── */
    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [stream]);

    const startCamera = useCallback(async () => {
        setErrorMessage('');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setStream(mediaStream);
            setIsScanning(true);
            setSnapshot(null);
            setScanState('idle');
            setScanResult(null);
        } catch (err) {
            console.error('Camera access error:', err);
            setErrorMessage('Camera access was not available. You can use the "Upload Photo" button below instead.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(null);
        setIsScanning(false);
    }, [stream]);

    /* ── Send image to Picture Verification API ────────────────── */
    const processImageVerification = async (imageDataUrl, clientMetrics = null) => {
        if (allDoses.length === 0) {
            setErrorMessage('No active prescribed medication found. You must select an active prescription before verifying a dose.');
            setScanState('idle');
            return;
        }

        setScanState('scanning');
        setErrorMessage('');

        try {
            const result = await verifyMedicinePicture({
                image: imageDataUrl,
                expectedDrug: selectedDose?.name || 'General Prescription',
                dosage: selectedDose?.dosage || 'Standard dose',
                scheduleId: selectedDose?.scheduleId,
                prescriptionId: selectedDose?.prescriptionId,
                patientId: realPatient?.id || user?.id,
                clientMetrics: clientMetrics || undefined
            });

            setScanResult(result);
            setScanState('done');
        } catch (err) {
            console.error('API Verification error:', err);
            setScanState('idle');
            setErrorMessage(err?.response?.data?.error || err.message || 'Verification request failed. Please check network connection and try again.');
        }
    };

    /* ── Capture snapshot from live video ───────────────────────── */
    const handleCapture = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const liveMetrics = analyzeCanvasContent(canvas);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        stopCamera();

        try {
            const { dataUrl, metrics } = await compressAndResizeImage(rawDataUrl, 1280, 0.85);
            setSnapshot(dataUrl);
            processImageVerification(dataUrl, metrics || liveMetrics);
        } catch {
            setSnapshot(rawDataUrl);
            processImageVerification(rawDataUrl, liveMetrics);
        }
    }, [stopCamera, selectedDose, realPatient, pillInfo, allDoses]);

    /* ── File Upload Handler with Auto Compression ──────────────── */
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        stopCamera();
        setErrorMessage('');
        try {
            const { dataUrl, metrics } = await compressAndResizeImage(file, 1280, 0.85);
            setSnapshot(dataUrl);
            processImageVerification(dataUrl, metrics);
        } catch (err) {
            console.error('File compression error:', err);
            setErrorMessage('Unable to process the image file. Please try selecting a standard JPEG or PNG photo.');
        }
    };

    /* ── Confirm & log the SELECTED dose to PostgreSQL ──────────── */
    const handleConfirmDose = async () => {
        if (!selectedDose) return;
        setIsSubmittingLog(true);

        if (realPatient?.id) {
            try {
                await recordMedicationLog({
                    patientId: realPatient.id,
                    scheduleId: selectedDose.scheduleId || undefined,
                    prescriptionId: selectedDose.prescriptionId || undefined,
                    action: 'TAKEN'
                });
            } catch (err) {
                console.error('Error recording medication log in DB:', err);
            }
        }

        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const doses = JSON.parse(saved);
                const idx = doses.findIndex(d => String(d.id) === String(selectedDoseId));
                if (idx !== -1) {
                    doses[idx].status = 'taken';
                    doses[idx].isCurrent = false;
                    doses[idx].loggedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                    localStorage.setItem(storageKey, JSON.stringify(doses));
                    window.dispatchEvent(new Event('rxDispensedOrPrescribed'));
                }
            }
        }

        setTimeout(() => {
            setIsSubmittingLog(false);
            navigate('/patient/schedule');
        }, 500);
    };

    const handleRetake = () => {
        setSnapshot(null);
        setScanState('idle');
        setScanResult(null);
        setErrorMessage('');
        startCamera();
    };

    const isVerified = Boolean(
        scanResult &&
        scanResult.status === 'VERIFIED' &&
        (scanResult.matchConfidence ?? 0) >= 75
    );
    const isNotMedication = Boolean(
        scanResult &&
        (scanResult.status === 'NOT_MEDICATION' ||
         scanResult.matchConfidence === 0 ||
         scanResult.detectedAttributes?.pillShape?.toLowerCase().includes('person') ||
         scanResult.detectedAttributes?.pillShape?.toLowerCase().includes('face') ||
         scanResult.detectedAttributes?.pillShape?.toLowerCase().includes('non-medication'))
    );

    return (
        <>
            {/* Hidden canvas & file input */}
            <canvas ref={canvasRef} className="hidden" />
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Header */}
            <header className="bg-surface border-b border-border sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-text-secondary">
                        <span>Patient Portal</span>
                        <span className="mx-2">›</span>
                        <span className="font-semibold text-text-primary">Medicine Picture Verification API</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-xs font-bold transition-colors ${isOnline
                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                            : 'border-rose-500 text-rose-600 bg-rose-50'
                            }`}>
                            {isOnline ? '🟢 API Online' : '🔴 System Offline'}
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mb-20 lg:mb-0">
                <div className="mb-5 sm:mb-6">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary text-3xl">document_scanner</span>
                        Medicine Picture Verification
                    </h2>
                    <p className="text-slate-500 mt-1">Take or upload a picture of your pill or medicine packaging to verify authenticity and log your dose.</p>
                </div>

                {errorMessage && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm font-semibold">
                        <span className="material-symbols-outlined text-amber-600">warning</span>
                        <p>{errorMessage}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Camera / Snapshot view ─────────────── */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 rounded-3xl overflow-hidden relative shadow-lg border border-slate-800" style={{ aspectRatio: '4/3' }}>

                            {/* Idle state */}
                            {!isScanning && !snapshot && (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
                                    <div className="text-center space-y-4 px-6 max-w-sm">
                                        <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-4xl">photo_camera</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white">Capture or Upload Medicine Photo</h3>
                                        <p className="text-xs text-slate-400">Position your pill or packaging label clearly under good lighting.</p>
                                        
                                        {allDoses.length === 0 && (
                                            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs text-left">
                                                ⚠️ No active doctor-prescribed doses found. You must have a prescribed dose before verifying.
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                            <button
                                                onClick={startCamera}
                                                disabled={allDoses.length === 0}
                                                className="flex-1 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">videocam</span>
                                                Start Camera
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={allDoses.length === 0}
                                                className="flex-1 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                                Upload Photo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Live video stream */}
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
                                    <img src={snapshot} alt="Captured medicine" className="w-full h-full object-cover" />
                                    
                                    {/* Scanning animation overlay */}
                                    {scanState === 'scanning' && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                <span className="material-symbols-outlined text-primary text-2xl absolute inset-0 m-auto flex items-center justify-center">
                                                    center_focus_strong
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white font-bold text-base">Running Picture Verification API...</p>
                                                <p className="text-slate-300 text-xs mt-1">Analyzing imprint, color, shape, and dosage safety</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Result detection box */}
                                    {scanState === 'done' && scanResult && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                                            <div className={`border-4 rounded-2xl w-[60%] h-[60%] flex items-end justify-center pb-3 shadow-2xl transition-all ${
                                                isNotMedication
                                                    ? 'border-rose-500 bg-rose-500/20 shadow-rose-500/30'
                                                    : isVerified
                                                        ? 'border-emerald-500 bg-emerald-500/10'
                                                        : 'border-amber-500 bg-amber-500/10'
                                            }`}>
                                                <span className={`text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md ${
                                                    isNotMedication
                                                        ? 'bg-rose-600'
                                                        : isVerified
                                                            ? 'bg-emerald-600'
                                                            : 'bg-amber-600'
                                                }`}>
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {isNotMedication ? 'cancel' : isVerified ? 'verified' : 'warning'}
                                                    </span>
                                                    {isNotMedication
                                                        ? 'Not Medication (0%)'
                                                        : isVerified
                                                            ? `Verified (${scanResult.matchConfidence}%)`
                                                            : `Caution: Review (${scanResult.matchConfidence}%)`}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Scanning viewfinder overlay */}
                            {isScanning && (
                                <>
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2 border border-slate-700 shadow-md">
                                        <span className="material-symbols-outlined text-primary text-sm">info</span>
                                        Center the pill or packaging within the frame
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-[55%] h-[60%] border-2 border-dashed border-primary/80 rounded-2xl relative">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Bottom control bar */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isScanning && (
                                            <>
                                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-white text-xs font-bold uppercase tracking-wider">Live Camera</span>
                                            </>
                                        )}
                                        {scanState === 'done' && (
                                            <span className={`${isVerified ? 'text-emerald-400' : 'text-amber-400'} text-xs font-bold flex items-center gap-1`}>
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {isVerified ? 'check_circle' : 'warning'}
                                                </span>
                                                {isVerified ? 'Analysis Complete' : 'Inspection Alert'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isScanning && (
                                            <>
                                                {/* Shutter / capture button */}
                                                <button
                                                    onClick={handleCapture}
                                                    title="Capture pill image"
                                                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-4 border-white/50 hover:scale-105 transition-transform shadow-xl cursor-pointer"
                                                >
                                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                                                        <span className="material-symbols-outlined text-xl">camera_alt</span>
                                                    </div>
                                                </button>
                                                {/* Stop/cancel */}
                                                <button
                                                    onClick={stopCamera}
                                                    title="Cancel Camera"
                                                    className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-white text-lg">close</span>
                                                </button>
                                            </>
                                        )}
                                        {snapshot && scanState !== 'scanning' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRetake}
                                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                                                    Retake
                                                </button>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                                    Upload Another
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Panel: Target & Verification Analysis ── */}
                    <div className="space-y-5">

                        {/* Prescription Target Selection */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">prescriptions</span>
                                Prescribed Target
                            </h3>

                            {allDoses.length === 0 ? (
                                <div className="text-center py-6 space-y-2">
                                    <span className="material-symbols-outlined text-4xl text-slate-300">medication_liquid</span>
                                    <p className="text-sm font-semibold text-slate-700">No prescribed medications found.</p>
                                    <p className="text-xs text-slate-400">Doctor-prescribed doses will appear here automatically.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Select Dose to Verify</label>
                                        <select
                                            value={selectedDoseId ?? ''}
                                            onChange={e => {
                                                setSelectedDoseId(e.target.value);
                                                setSnapshot(null);
                                                setScanState('idle');
                                                setScanResult(null);
                                                stopCamera();
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                                        >
                                            {allDoses.map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} {d.dosage} — {d.time} ({(d.status || 'UPCOMING').toUpperCase()})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedDose && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{selectedDose.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{selectedDose.dosage || 'Standard Formulation'}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                                    selectedDose.status === 'taken' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {selectedDose.status}
                                                </span>
                                            </div>

                                            {/* Pill reference specs */}
                                            {pillInfo && (
                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                                    <div><span className="text-slate-400">Shape:</span> <span className="font-bold text-slate-700">{pillInfo.shape}</span></div>
                                                    <div><span className="text-slate-400">Color:</span> <span className="font-bold text-slate-700">{pillInfo.color}</span></div>
                                                    <div><span className="text-slate-400">Imprint:</span> <span className="font-bold text-slate-700">{pillInfo.imprint}</span></div>
                                                    <div><span className="text-slate-400">Score:</span> <span className="font-bold text-slate-700">{pillInfo.score}</span></div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Live Verification Analysis Card */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
                                    Verification Analysis
                                </span>
                                {scanResult && (
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                        isVerified ? 'text-emerald-600 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                                    }`}>
                                        {scanResult.engine === 'AI_VISION' ? '🤖 AI Vision Result' : 'Live Result'}
                                    </span>
                                )}
                            </h3>

                            {scanState === 'idle' && (
                                <div className="text-center py-6 space-y-2">
                                    <span className="material-symbols-outlined text-3xl text-slate-300">center_focus_weak</span>
                                    <p className="text-xs font-semibold text-slate-500">Capture or upload an image to run live picture verification.</p>
                                </div>
                            )}

                            {scanState === 'scanning' && (
                                <div className="text-center py-6 space-y-3">
                                    <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                                    <p className="text-xs font-bold text-slate-600 animate-pulse">Running Picture Verification API...</p>
                                </div>
                            )}

                            {scanState === 'done' && scanResult && (
                                <div className="space-y-4 animate-fade-in">
                                    {/* Mismatch or Rejection Alert Banner */}
                                    {isNotMedication ? (
                                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
                                            <span className="material-symbols-outlined text-rose-600 text-xl flex-shrink-0 mt-0.5">cancel</span>
                                            <div>
                                                <p className="font-bold text-rose-900">Rejected: Non-Medication Detected</p>
                                                <p className="text-rose-800 mt-0.5 leading-snug">
                                                    The camera detected a human face, person, or non-pill object. Please position your actual pill or medicine packaging clearly in the center of the camera.
                                                </p>
                                            </div>
                                        </div>
                                    ) : !isVerified && (
                                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                                            <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5">warning</span>
                                            <div>
                                                <p className="font-bold">Possible Pill Mismatch</p>
                                                <p className="text-amber-800 mt-0.5 leading-snug">
                                                    The photographed pill appearance does not closely match the expected prescription. Please inspect carefully or consult Dr. Chen or your pharmacist before taking.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Confidence Bar */}
                                    <div>
                                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                            <span className="text-slate-600">Visual Match Confidence</span>
                                            <span className={`text-sm font-black ${
                                                isNotMedication ? 'text-rose-600' : isVerified ? 'text-emerald-600' : 'text-amber-600'
                                            }`}>
                                                {scanResult.matchConfidence}%
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${
                                                    isNotMedication
                                                        ? 'bg-rose-500'
                                                        : isVerified
                                                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                                            : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                }`}
                                                style={{ width: `${Math.max(scanResult.matchConfidence, isNotMedication ? 0 : 5)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Attribute Breakdown */}
                                    <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs">
                                        <div className="flex justify-between pb-1.5 border-b border-slate-200">
                                            <span className="text-slate-500 font-medium">Visual Pill Shape</span>
                                            <span className={`font-bold ${isNotMedication ? 'text-rose-700' : 'text-slate-800'}`}>
                                                {scanResult.detectedAttributes?.pillShape || (isNotMedication ? 'Non-Medication Detected' : 'Round / Oval')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pb-1.5 border-b border-slate-200">
                                            <span className="text-slate-500 font-medium">Color Consistency</span>
                                            <span className="font-bold text-slate-800">{scanResult.detectedAttributes?.pillColor || (isNotMedication ? 'N/A' : 'White')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">Imprint Markings</span>
                                            <span className="font-bold text-slate-800">{scanResult.detectedAttributes?.imprintCode || (isNotMedication ? 'None' : 'Verified')}</span>
                                        </div>
                                    </div>

                                    {/* Clinical Notes (from Gemini AI or Engine) */}
                                    {scanResult.clinicalNotes && (
                                        <div className={`p-3 rounded-xl text-[11px] flex items-start gap-2 border ${
                                            isNotMedication
                                                ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                                                : 'bg-slate-100 border-slate-200 text-slate-700'
                                        }`}>
                                            <span className={`material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0 ${
                                                isNotMedication ? 'text-rose-600' : 'text-slate-500'
                                            }`}>
                                                {isNotMedication ? 'warning' : 'psychology'}
                                            </span>
                                            <p className="leading-snug">{scanResult.clinicalNotes}</p>
                                        </div>
                                    )}

                                    {/* Safety Guidance */}
                                    {scanResult.safetyAnalysis?.safetyGuidance && (
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                                            <span className="material-symbols-outlined text-blue-600 text-[16px] mt-0.5 flex-shrink-0">info</span>
                                            <p className="leading-snug">{scanResult.safetyAnalysis.safetyGuidance}</p>
                                        </div>
                                    )}

                                    {/* Confirm & Log Dose Button */}
                                    <div className="pt-2">
                                        <button
                                            onClick={handleConfirmDose}
                                            disabled={isSubmittingLog || isNotMedication}
                                            className={`w-full py-3.5 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                                isNotMedication
                                                    ? 'bg-rose-600 shadow-rose-600/20'
                                                    : isVerified
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                                        : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                                            }`}
                                        >
                                            {isSubmittingLog ? (
                                                <>
                                                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                                    Logging to Database...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {isNotMedication ? 'block' : isVerified ? 'verified' : 'priority_high'}
                                                    </span>
                                                    {isNotMedication
                                                        ? 'Verification Rejected (Cannot Log)'
                                                        : isVerified
                                                            ? 'Confirm & Log Dose (DB)'
                                                            : 'Confirm & Log Anyway (DB)'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

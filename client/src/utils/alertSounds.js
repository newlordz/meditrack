// ── Audio Alert Synthesizer for MediTrack ──────────────────────────────
// Generates realistic, crisp, convincing hospital & medical reminder alerts
// using the Web Audio API with zero external audio file dependencies.

let globalAudioCtx = null;

/**
 * Gets or creates a shared AudioContext instance.
 */
export const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
        globalAudioCtx = new AudioCtx();
    }
    return globalAudioCtx;
};

/**
 * Unlocks the audio context if suspended (required by browser autoplay policies).
 */
export const unlockAudio = async () => {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch (e) {
            console.warn('[MediTrack Audio] Resume failed:', e);
        }
    }
    return ctx;
};

// Auto-unlock on first user interaction anywhere on the page
if (typeof window !== 'undefined') {
    const autoUnlock = () => {
        unlockAudio();
    };
    window.addEventListener('pointerdown', autoUnlock, { passive: true });
    window.addEventListener('keydown', autoUnlock, { passive: true });
}

/**
 * Helper to synthesize a rich bell / chime note with fundamental and harmonic overtones.
 */
const playBellNote = (ctx, masterGain, freq, startTime, duration, type = 'sine', decaySpeed = 1.0) => {
    // Fundamental oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = type;
    osc1.frequency.setValueAtTime(freq, startTime);

    // Warm overtone (octave harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Subtle metallic sparkle (2.76x inharmonic for acoustic bell feel)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 2.76, startTime);

    // Envelopes
    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(0.5, startTime + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * decaySpeed);

    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(0.25, startTime + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.7) * decaySpeed);

    gain3.gain.setValueAtTime(0, startTime);
    gain3.gain.linearRampToValueAtTime(0.12, startTime + 0.004);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.35) * decaySpeed);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration + 0.1);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.1);
    osc3.start(startTime);
    osc3.stop(startTime + duration + 0.1);
};

/**
 * Sound profiles definition
 */
export const ALERT_SOUND_PROFILES = [
    {
        id: 'medical-chime',
        name: 'Medical Bell (Recommended)',
        description: 'Crisp, modern smart-dispenser 3-note harmonic chime',
        badge: 'Recommended',
        icon: 'notifications_active'
    },
    {
        id: 'hospital-pulse',
        name: 'Clinical Smart Pump',
        description: 'Authoritative hospital double-pulse clinical alert',
        badge: 'Clinical',
        icon: 'emergency'
    },
    {
        id: 'gentle-harp',
        name: 'Gentle Acoustic Melody',
        description: 'Calm, soothing 4-tone cascade for sensitive ears',
        badge: 'Soothing',
        icon: 'spa'
    },
    {
        id: 'urgent-alert',
        name: 'High-Priority Alert',
        description: 'Clear, alternating attention-grabbing dose alarm',
        badge: 'Urgent',
        icon: 'alarm'
    }
];

/**
 * Plays a rich, audible alert sound.
 * @param {string} soundId - One of 'medical-chime', 'hospital-pulse', 'gentle-harp', 'urgent-alert'
 * @param {number} volume - Volume multiplier between 0.1 and 1.0 (default 1.0)
 */
export const playAlertSound = async (soundId = 'medical-chime', volume = 1.0) => {
    try {
        const ctx = await unlockAudio();
        if (!ctx) return;

        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        
        // Master volume clamped between 0.05 and 1.0
        const clampedVol = Math.max(0.05, Math.min(1.0, volume));
        // Boost slightly for clear speaker presence without distortion
        masterGain.gain.setValueAtTime(clampedVol * 0.95, now);

        // Dynamics compressor to ensure crisp attack and no audio clipping
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, now);
        compressor.knee.setValueAtTime(10, now);
        compressor.ratio.setValueAtTime(4, now);
        compressor.attack.setValueAtTime(0.003, now);
        compressor.release.setValueAtTime(0.15, now);

        masterGain.connect(compressor);
        compressor.connect(ctx.destination);

        switch (soundId) {
            case 'medical-chime': {
                // Professional 3-note ascending harmonic chime: F5 (698.4Hz) -> A5 (880Hz) -> C6 (1046.5Hz)
                // Distinct, bright, pleasant, impossible to mistake for background noise
                playBellNote(ctx, masterGain, 698.46, now, 0.45, 'triangle', 1.0);
                playBellNote(ctx, masterGain, 880.00, now + 0.16, 0.55, 'triangle', 1.1);
                playBellNote(ctx, masterGain, 1046.50, now + 0.34, 1.1, 'sine', 1.3);
                // Subtle high-register confirmation shimmer
                playBellNote(ctx, masterGain, 2093.00, now + 0.35, 0.4, 'sine', 0.8);
                break;
            }

            case 'hospital-pulse': {
                // Clinical Smart-Pump Double Pulse: [920Hz + 1380Hz] -> pause -> [920Hz + 1380Hz] -> [1150Hz + 1725Hz]
                const playPulse = (time, freq1, freq2, dur) => {
                    const oscA = ctx.createOscillator();
                    const oscB = ctx.createOscillator();
                    const g = ctx.createGain();
                    oscA.type = 'sine';
                    oscB.type = 'triangle';
                    oscA.frequency.setValueAtTime(freq1, time);
                    oscB.frequency.setValueAtTime(freq2, time);

                    g.gain.setValueAtTime(0, time);
                    g.gain.linearRampToValueAtTime(0.4, time + 0.008);
                    g.gain.exponentialRampToValueAtTime(0.001, time + dur);

                    oscA.connect(g);
                    oscB.connect(g);
                    g.connect(masterGain);

                    oscA.start(time);
                    oscA.stop(time + dur + 0.05);
                    oscB.start(time);
                    oscB.stop(time + dur + 0.05);
                };

                playPulse(now, 880, 1760, 0.12);
                playPulse(now + 0.15, 880, 1760, 0.12);
                playPulse(now + 0.38, 1174.66, 2349.3, 0.28);
                break;
            }

            case 'gentle-harp': {
                // Soothing 4-note ascending acoustic cascade: C5 (523Hz), E5 (659Hz), G5 (784Hz), B5 (988Hz)
                const harpNotes = [523.25, 659.25, 783.99, 987.77];
                harpNotes.forEach((freq, idx) => {
                    playBellNote(ctx, masterGain, freq, now + idx * 0.14, 0.7 - idx * 0.05, 'sine', 1.2);
                });
                break;
            }

            case 'urgent-alert': {
                // High-priority alternating double burst
                const playBeep = (time, freq, dur) => {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, time);
                    
                    // Filter to remove excessive square harshness while keeping bite
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(2400, time);

                    g.gain.setValueAtTime(0, time);
                    g.gain.linearRampToValueAtTime(0.3, time + 0.005);
                    g.gain.exponentialRampToValueAtTime(0.001, time + dur);

                    osc.connect(filter);
                    filter.connect(g);
                    g.connect(masterGain);

                    osc.start(time);
                    osc.stop(time + dur + 0.05);
                };

                playBeep(now, 1046.5, 0.14);
                playBeep(now + 0.16, 783.99, 0.14);
                playBeep(now + 0.35, 1046.5, 0.14);
                playBeep(now + 0.51, 1318.5, 0.26);
                break;
            }

            default: {
                playBellNote(ctx, masterGain, 698.46, now, 0.45, 'triangle', 1.0);
                playBellNote(ctx, masterGain, 880.00, now + 0.16, 0.55, 'triangle', 1.1);
                playBellNote(ctx, masterGain, 1046.50, now + 0.34, 1.1, 'sine', 1.3);
                break;
            }
        }
    } catch (e) {
        console.warn('[MediTrack Audio] Error playing alert sound:', e);
    }
};

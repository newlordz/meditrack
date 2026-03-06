import { useState } from 'react';

const STORE_ITEMS = [
    { id: 1, name: 'MediTrack Pro', desc: 'Unlock advanced analytics, exportable reports, and custom reminders for 1 month.', icon: 'workspace_premium', cost: 500, category: 'Pro Features', color: 'bg-violet-50 text-violet-600' },
    { id: 2, name: 'Custom Theme Pack', desc: 'Unlock Dark Mode and 3 exclusive color themes for your dashboard.', icon: 'palette', cost: 300, category: 'Personalisation', color: 'bg-fuchsia-50 text-fuchsia-600' },
    { id: 3, name: 'Health Charity Donation', desc: 'Donate the equivalent of 200 pts to the Ghana National Health Fund.', icon: 'volunteer_activism', cost: 200, category: 'Charity', color: 'bg-rose-50 text-rose-600' },
    { id: 4, name: 'Verified Badge', desc: 'Display a special "Verified Adherence" badge on your patient profile.', icon: 'verified', cost: 150, category: 'Digital Badge', color: 'bg-sky-50 text-sky-600' },
    { id: 5, name: 'Priority Support', desc: 'Get a guaranteed 30-minute consultation slot this month.', icon: 'support_agent', cost: 800, category: 'Clinical', color: 'bg-emerald-50 text-emerald-600' },
    { id: 6, name: 'Weekly Wellness Report', desc: 'Receive a detailed AI-generated health summary every Monday.', icon: 'receipt_long', cost: 400, category: 'Reports', color: 'bg-amber-50 text-amber-600' },
];

export default function RewardsPage() {
    const [storeOpen, setStoreOpen] = useState(false);
    const [redeemedItems, setRedeemedItems] = useState(() => {
        const s = localStorage.getItem('meditrack_redeemed_items');
        return s ? JSON.parse(s) : [];
    });

    // ── Live data from localStorage doses ────────────────────────────
    const [liveData] = useState(() => {
        const saved = localStorage.getItem('meditrack_patient_doses');
        const defaults = { taken: 0, missed: 0, streak: 10, points: 2450 };
        if (!saved) return defaults;

        const doses = JSON.parse(saved);
        const taken = doses.filter(d => d.status === 'taken').length;
        const missed = doses.filter(d => d.status === 'missed').length;

        let streak = 10;
        if (missed === 0 && taken > 0) streak = 13;
        else if (missed > 2) streak = 2;

        return {
            taken,
            missed,
            streak,
            points: 2450 + (taken * 50) - (missed * 10),
        };
    });

    // ── Derive remaining points after redemptions ─────────────────────
    const spentPoints = redeemedItems.reduce((sum, id) => {
        const item = STORE_ITEMS.find(i => i.id === id);
        return sum + (item ? item.cost : 0);
    }, 0);
    const remainingPts = liveData.points - spentPoints;

    // ── Badge unlocking logic based on live data ──────────────────────
    const badges = [
        {
            id: 1, name: '7-Day Streak', icon: 'local_fire_department',
            desc: 'Complete a full week of doses without missing any.',
            color: 'border-amber-400', bg: 'bg-amber-50', iconColor: 'text-amber-500',
            unlocked: liveData.streak >= 7,
        },
        {
            id: 2, name: 'Perfect Month', icon: 'emoji_events',
            desc: '30 days of consistent medical adherence.',
            color: 'border-slate-200', bg: 'bg-slate-50', iconColor: 'text-slate-400',
            unlocked: liveData.streak >= 30,
        },
        {
            id: 3, name: 'Punctuality Pro', icon: 'schedule',
            desc: 'Take your meds within 10 minutes of scheduled time.',
            color: 'border-blue-400', bg: 'bg-blue-50', iconColor: 'text-blue-500',
            unlocked: liveData.taken >= 3,
        },
        {
            id: 4, name: 'First Dose', icon: 'medication',
            desc: 'Logged your very first medication on time.',
            color: 'border-purple-400', bg: 'bg-purple-50', iconColor: 'text-purple-500',
            unlocked: liveData.taken >= 1,
        },
        {
            id: 5, name: 'Zero Misses', icon: 'water_drop',
            desc: 'Go through a full session without missing a single dose.',
            color: 'border-teal-400', bg: 'bg-teal-50', iconColor: 'text-teal-500',
            unlocked: liveData.missed === 0 && liveData.taken > 0,
        },
        {
            id: 6, name: 'Early Bird', icon: 'wb_sunny',
            desc: 'Consistent morning medication before 8:00 AM.',
            color: 'border-teal-400', bg: 'bg-teal-50', iconColor: 'text-teal-500',
            unlocked: liveData.taken >= 2,
        },
        {
            id: 7, name: 'Goal Crusher', icon: 'flag',
            desc: 'Reach 2,500 points in total achievements.',
            color: 'border-slate-200', bg: 'bg-slate-50', iconColor: 'text-slate-400',
            unlocked: liveData.points >= 2500,
        },
        {
            id: 8, name: 'Community Star', icon: 'favorite',
            desc: 'Shared encouragement to 5 fellow patients.',
            color: 'border-rose-400', bg: 'bg-rose-50', iconColor: 'text-rose-500',
            unlocked: liveData.taken >= 5,
        },
    ];

    const unlockedCount = badges.filter(b => b.unlocked).length;
    const lockedCount = badges.filter(b => !b.unlocked).length;

    const MILESTONE = 15;
    const weeklyData = (() => {
        const base = [
            { day: 'M', ok: true }, { day: 'T', ok: true }, { day: 'W', ok: true },
            { day: 'T', ok: true }, { day: 'F', ok: true }, { day: 'S', ok: false }, { day: 'S', ok: false },
        ];
        if (liveData.missed === 0 && liveData.taken > 0) base[5].ok = true;
        if (liveData.missed > 2) { base[1].ok = false; base[2].ok = false; }
        return base;
    })();

    // ── Redeem ────────────────────────────────────────────────────────
    const handleRedeem = (item) => {
        if (remainingPts < item.cost || redeemedItems.includes(item.id)) return;
        const updated = [...redeemedItems, item.id];
        setRedeemedItems(updated);
        localStorage.setItem('meditrack_redeemed_items', JSON.stringify(updated));
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <div className="flex-1 px-4 sm:px-6 py-6 space-y-6 animate-fade-in mb-20 lg:mb-0">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                            Portals › Patient › <span className="text-primary font-semibold">Rewards</span>
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">Rewards &amp; Achievements</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Keep up the great work! Consistent adherence earns you points and badges.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Points */}
                        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[18px]">star</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Points</p>
                                <p className="text-lg font-black text-slate-900">{remainingPts.toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span></p>
                            </div>
                        </div>
                        {/* Rank */}
                        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[18px]">leaderboard</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Global Rank</p>
                                <p className="text-lg font-black text-slate-900">#124</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Streak Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🔥</span>
                            <h3 className="text-lg font-bold text-slate-900">Current Streak: {liveData.streak} Days</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-primary text-[16px]">trending_up</span>
                            <span className="text-sm font-semibold text-primary">Next Milestone: {MILESTONE} Days</span>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                        {liveData.streak >= MILESTONE
                            ? '🎉 You hit your milestone! Keep it up!'
                            : `You're only ${MILESTONE - liveData.streak} days away from your next milestone!`}
                    </p>
                    <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${Math.min((liveData.streak / MILESTONE) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between overflow-x-auto pb-2 scrollbar-hide">
                        {weeklyData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5 min-w-[3rem]">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                    ${d.ok ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-400'}`}>
                                    {d.day}
                                </div>
                                <span className={`material-symbols-outlined text-sm ${d.ok ? 'text-primary' : 'text-slate-300'}`}>
                                    {d.ok ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Badges */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Achievements &amp; Badges</h3>
                        <p className="text-sm">
                            <span className="text-primary font-semibold">{unlockedCount} Unlocked</span>
                            <span className="text-slate-400"> · {lockedCount} Locked</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {badges.map((badge, i) => (
                            <div
                                key={badge.id}
                                className={`bg-white border-2 rounded-xl p-4 text-center transition-all animate-fade-in
                                    ${badge.unlocked ? `${badge.color} hover:shadow-md hover:-translate-y-0.5 cursor-default` : 'border-slate-100 opacity-50'}`}
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${badge.bg}`}>
                                    <span className={`material-symbols-outlined text-2xl ${badge.unlocked ? badge.iconColor : 'text-slate-300'}`}>
                                        {badge.unlocked ? badge.icon : 'lock'}
                                    </span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-900 mb-0.5">{badge.name}</h4>
                                <p className="text-xs text-slate-400 mb-2 leading-relaxed">{badge.desc}</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                    ${badge.unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                    {badge.unlocked ? 'Unlocked' : 'Locked'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Redeem Banner */}
                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Redeem Your Points</h3>
                        <p className="text-sm text-white/80">You have <span className="font-bold text-white">{remainingPts.toLocaleString()} pts</span> available. Use them on Pro Features, themes, charity, or more.</p>
                    </div>
                    <button
                        onClick={() => setStoreOpen(true)}
                        className="flex-shrink-0 w-full md:w-auto px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap shadow-md"
                    >
                        Go to Reward Store
                    </button>
                </div>

                <div className="text-center text-xs text-slate-400 py-2">© 2024 MediTrack Health Systems. Your health journey, gamified.</div>
            </div>

            {/* ── Reward Store Modal ──────────────────────────────────── */}
            {storeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Reward Store</h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    You have <span className="font-bold text-primary">{remainingPts.toLocaleString()} pts</span> to spend.
                                </p>
                            </div>
                            <button
                                onClick={() => setStoreOpen(false)}
                                className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-500">close</span>
                            </button>
                        </div>

                        {/* Items grid */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {STORE_ITEMS.map((item) => {
                                const redeemed = redeemedItems.includes(item.id);
                                const canAfford = remainingPts >= item.cost;
                                return (
                                    <div key={item.id}
                                        className={`border rounded-2xl p-4 transition-all ${redeemed ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:shadow-md'}`}
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                                <span className="material-symbols-outlined">{item.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                    <span className="flex-shrink-0 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.cost} pts</span>
                                                </div>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{item.category}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">{item.desc}</p>
                                        <button
                                            onClick={() => handleRedeem(item)}
                                            disabled={redeemed || !canAfford}
                                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${redeemed
                                                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                                : canAfford
                                                    ? 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {redeemed ? '✓ Redeemed' : canAfford ? `Redeem for ${item.cost} pts` : 'Not enough points'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-6 pb-6">
                            <button
                                onClick={() => setStoreOpen(false)}
                                className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm"
                            >
                                Close Store
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

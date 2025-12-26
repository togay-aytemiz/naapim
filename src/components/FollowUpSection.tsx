import React from 'react';
import { Check, X, Clock, Lock, KeyRound } from 'lucide-react';

interface SeededOutcome {
    outcome_type: 'decided' | 'cancelled' | 'thinking';
    feeling: 'happy' | 'neutral' | 'uncertain' | 'regret';
    outcome_text: string;
    related_question?: string;
}

interface FollowUpSectionProps {
    followupDays?: number;
    seededOutcomes?: SeededOutcome[];
    isLoadingSeeds?: boolean;
    isUnlocked?: boolean;
    onUnlock: () => void;
    onUnlockWithEmail?: (email: string, reminderTime: 'tomorrow' | '1_week' | '2_weeks') => void;
    onShareStory?: () => void;
    // Data for modal
    code?: string;
    userQuestion?: string;
    sessionId?: string;
    followupQuestion?: string;
}

const feelingEmojis: Record<string, string> = {
    happy: '😊',
    neutral: '😐',
    uncertain: '🤔',
    regret: '😔'
};

const feelingLabels: Record<string, string> = {
    happy: 'Mutlu',
    neutral: 'Nötr',
    uncertain: 'Kararsız',
    regret: 'Pişman'
};

const outcomeStyles: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    decided: {
        icon: <Check className="w-3.5 h-3.5" />,
        label: 'Karar verdi',
        color: 'var(--emerald-600)'
    },
    cancelled: {
        icon: <X className="w-3.5 h-3.5" />,
        label: 'Vazgeçti',
        color: 'var(--red-500)'
    },
    thinking: {
        icon: <Clock className="w-3.5 h-3.5" />,
        label: 'Düşünüyor',
        color: 'var(--amber-600)'
    }
};

// Sample questions for locked cards
const sampleQuestions = [
    "Uzun bir araştırmadan sonra araba almaya karar verdim...",
    "İş teklifini kabul etmeli miyim?",
    "Taşınmayı düşünüyorum ama emin olamıyorum..."
];

export const FollowUpSection: React.FC<FollowUpSectionProps> = ({
    seededOutcomes = [],
    isLoadingSeeds = false,
    isUnlocked = false,
    onUnlock,
    onUnlockWithEmail,
    onShareStory,
    code = '',
    userQuestion = '',
    sessionId,
    followupQuestion
}) => {
    const [showUnlockModal, setShowUnlockModal] = React.useState(false);

    const scrollToRecoveryCode = () => {
        document.getElementById('recovery-code-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Skeleton Loading Card
    const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
        <div
            className="p-5 rounded-2xl animate-pulse"
            style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-secondary)',
                animationDelay: `${delay}ms`
            }}
        >
            {/* Header skeleton */}
            <div className="flex items-center gap-2 mb-3">
                <div
                    className="h-6 w-24 rounded-full"
                    style={{ backgroundColor: 'var(--border-secondary)' }}
                />
                <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: 'var(--border-secondary)' }}
                />
            </div>

            {/* Text skeleton lines */}
            <div className="space-y-2">
                <div
                    className="h-4 rounded"
                    style={{ backgroundColor: 'var(--border-secondary)', width: '100%' }}
                />
                <div
                    className="h-4 rounded"
                    style={{ backgroundColor: 'var(--border-secondary)', width: '85%' }}
                />
                <div
                    className="h-4 rounded"
                    style={{ backgroundColor: 'var(--border-secondary)', width: '65%' }}
                />
            </div>
        </div>
    );


    // Story Capsule - Blurred card with 1-line text and skeleton lines
    const StoryCapsule = ({
        outcome,
        animationClass,
        showFeeling = true,
        fallbackText = ''
    }: {
        outcome?: SeededOutcome;
        animationClass: string;
        showFeeling?: boolean;
        fallbackText?: string;
    }) => {
        const style = outcome ? (outcomeStyles[outcome.outcome_type] || outcomeStyles.decided) : outcomeStyles.decided;
        const feeling = outcome?.feeling || 'happy';
        const displayText = outcome?.outcome_text || fallbackText;

        return (
            <div
                className={`story-capsule ${animationClass} p-5 rounded-2xl text-left pointer-events-none select-none`}
                style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-secondary)',
                    opacity: 0.6,
                    filter: 'blur(2px)',
                }}
            >
                {/* Header: outcome type + feeling */}
                <div className="flex items-center gap-2 mb-3">
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                        style={{
                            backgroundColor: `${style.color}15`,
                            color: style.color
                        }}
                    >
                        {style.icon}
                        <span>{style.label}</span>
                    </div>
                    {showFeeling && (
                        <span className="text-lg">{feelingEmojis[feeling]}</span>
                    )}
                </div>

                {/* 1-line text from outcome_text - truncated */}
                <p
                    className="text-sm font-medium mb-3 truncate"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {displayText}
                </p>

                {/* Skeleton text lines */}
                <div className="space-y-2">
                    <div
                        className="h-2.5 rounded"
                        style={{
                            backgroundColor: 'var(--border-secondary)',
                            width: '100%'
                        }}
                    />
                    <div
                        className="h-2.5 rounded"
                        style={{
                            backgroundColor: 'var(--border-secondary)',
                            width: '80%'
                        }}
                    />
                </div>
            </div>
        );
    };

    // Real Outcome Card (first line visible, rest blurred - unless showFull is true)
    const RealOutcomeCard = ({ outcome, showFull = false }: { outcome: SeededOutcome; showFull?: boolean }) => {
        const style = outcomeStyles[outcome.outcome_type] || outcomeStyles.decided;
        const firstSentence = outcome.outcome_text.split(/[.!?]/)[0] + '...';
        const restOfText = outcome.outcome_text.substring(firstSentence.length - 3);

        return (
            <div
                className="p-4 rounded-2xl relative overflow-hidden"
                style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-secondary)'
                }}
            >
                {/* Header: outcome type + feeling */}
                <div className="flex items-center gap-2 mb-3">
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: `${style.color}15`,
                            color: style.color
                        }}
                    >
                        {style.icon}
                        <span>{style.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg">{feelingEmojis[outcome.feeling]}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{feelingLabels[outcome.feeling]}</span>
                    </div>
                </div>

                {/* Text: show full or partial based on showFull prop */}
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {showFull ? (
                        outcome.outcome_text
                    ) : (
                        <>
                            <span>{firstSentence}</span>
                            {restOfText && (
                                <span
                                    className="blur-[4px] select-none"
                                    style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
                                >
                                    {' '}{restOfText.substring(0, 60)}...
                                </span>
                            )}
                        </>
                    )}
                </p>
            </div>
        );
    };

    return (
        <div id="follow-up-section" className="flex flex-col items-center px-5 scroll-mt-24 pt-6">
            <div className="w-full max-w-md space-y-8">
                {/* Community Stories Preview */}
                <div className="space-y-4">
                    <div className="text-center space-y-3">
                        <h3 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {isUnlocked ? 'Topluluktan Hikayeler' : (<>Başkalarının Deneyimlerinden<br />İlham Al</>)}
                        </h3>
                        <p className="leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            {isUnlocked ? 'Seninle benzer durumda olanların paylaşımları' : 'Seninle benzer durumda olan insanların hikayelerini keşfet.'}
                        </p>
                    </div>

                    {/* Cards container */}
                    <div className="space-y-3 relative">
                        {/* LOADING STATE: Show skeleton cards */}
                        {isLoadingSeeds ? (
                            <div className="space-y-3">
                                <SkeletonCard delay={0} />
                                <SkeletonCard delay={100} />
                                <SkeletonCard delay={200} />
                                <p className="text-center text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
                                    Hikayeler yükleniyor...
                                </p>
                            </div>
                        ) : isUnlocked ? (
                            <div className="space-y-3 animate-in fade-in duration-500">
                                {seededOutcomes.slice(0, 3).map((outcome, idx) => (
                                    <RealOutcomeCard key={idx} outcome={outcome} showFull={true} />
                                ))}

                                {/* If there are more, show faint text */}
                                {seededOutcomes.length > 3 && (
                                    <p className="text-center text-xs opacity-50 py-2">
                                        ve {seededOutcomes.length - 3} hikaye daha...
                                    </p>
                                )}

                                {/* CTA to share */}
                                <div className="pt-2 text-center">
                                    <button
                                        onClick={scrollToRecoveryCode}
                                        className="text-sm underline font-medium"
                                        style={{ color: 'var(--coral-primary)' }}
                                    >
                                        Hepsini görmek için kararını paylaş
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* LOCKED STATE - Animated Story Capsules */
                            <>
                                {/* CSS for animations - only float, no glow */}
                                <style>{`
                                    @keyframes moveUp1 {
                                        0% { transform: translateY(0); }
                                        100% { transform: translateY(-4px); }
                                    }
                                    @keyframes moveUp2 {
                                        0% { transform: translateY(0); }
                                        100% { transform: translateY(-6px); }
                                    }
                                    @keyframes moveUp3 {
                                        0% { transform: translateY(0); }
                                        100% { transform: translateY(-8px); }
                                    }
                                    .story-capsule-1 {
                                        animation: moveUp1 2s ease-in-out infinite alternate;
                                    }
                                    .story-capsule-2 {
                                        animation: moveUp2 2s ease-in-out infinite alternate 0.3s;
                                    }
                                    .story-capsule-3 {
                                        animation: moveUp3 2s ease-in-out infinite alternate 0.6s;
                                    }
                                `}</style>

                                {/* Story Capsules */}
                                <StoryCapsule
                                    outcome={seededOutcomes[0]}
                                    animationClass="story-capsule-1"
                                    showFeeling={true}
                                    fallbackText={sampleQuestions[0]}
                                />
                                <StoryCapsule
                                    outcome={seededOutcomes[1]}
                                    animationClass="story-capsule-2"
                                    showFeeling={true}
                                    fallbackText={sampleQuestions[1]}
                                />
                                <StoryCapsule
                                    outcome={seededOutcomes[2]}
                                    animationClass="story-capsule-3"
                                    showFeeling={false}
                                    fallbackText={sampleQuestions[2]}
                                />

                                {/* Full gradient overlay - fades cards from top to bottom */}
                                <div
                                    className="absolute inset-0 pointer-events-none z-10"
                                    style={{
                                        background: 'linear-gradient(to bottom, transparent 0%, transparent 15%, var(--bg-primary) 85%, var(--bg-primary) 100%)'
                                    }}
                                />

                                {/* CTA Overlay */}
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center">

                                    {/* CTA Content */}
                                    <div className="relative z-30 flex flex-col items-center space-y-4">
                                        {/* Lock Icon */}
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6"
                                            style={{
                                                background: 'linear-gradient(135deg, #FF6F61 0%, #FF8A80 100%)',
                                                boxShadow: '0 0 15px rgba(255, 107, 107, 0.4)'
                                            }}
                                        >
                                            <Lock className="w-7 h-7 text-white" />
                                        </div>

                                        {/* Unlock Button */}
                                        <button
                                            onClick={() => setShowUnlockModal(true)}
                                            className="group flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 active:translate-y-0 text-lg w-full max-w-xs"
                                            style={{
                                                background: 'linear-gradient(135deg, #FF6F61 0%, #FF8A50 100%)',
                                                boxShadow: '0 4px 20px rgba(255, 111, 97, 0.4)'
                                            }}
                                        >
                                            <KeyRound className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                                            <span>Hikayelerin Kilidini Aç</span>
                                        </button>

                                        {/* YA DA Divider + Secondary Button */}
                                        {onShareStory && (
                                            <>
                                                {/* YA DA Eyebrow */}
                                                <div className="flex items-center w-full max-w-xs">
                                                    <div className="flex-grow border-t" style={{ borderColor: 'var(--border-secondary)' }} />
                                                    <span className="flex-shrink-0 mx-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>YA DA</span>
                                                    <div className="flex-grow border-t" style={{ borderColor: 'var(--border-secondary)' }} />
                                                </div>

                                                {/* Secondary Button - Share Story */}
                                                <button
                                                    onClick={() => {
                                                        onShareStory();
                                                        // Scroll to recovery code after a small delay
                                                        setTimeout(() => {
                                                            document.getElementById('recovery-code-section')?.scrollIntoView({ behavior: 'smooth' });
                                                        }, 100);
                                                    }}
                                                    className="group flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-medium transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-sm w-full max-w-xs"
                                                    style={{
                                                        backgroundColor: 'var(--bg-elevated)',
                                                        border: '1.5px solid var(--coral-primary)',
                                                        color: 'var(--text-secondary)',
                                                        boxShadow: '0 2px 10px rgba(255, 107, 107, 0.1)'
                                                    }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                    <span>Diğer kullanıcılara ilham ol</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Unlock Modal */}
            <UnlockModal
                isOpen={showUnlockModal}
                onClose={() => setShowUnlockModal(false)}
                onUnlock={onUnlock}
                onUnlockWithEmail={onUnlockWithEmail}
                code={code}
                userQuestion={userQuestion}
                sessionId={sessionId}
                seededOutcomes={seededOutcomes}
                followupQuestion={followupQuestion}
            />
        </div>
    );
};
import { UnlockModal } from './UnlockModal';

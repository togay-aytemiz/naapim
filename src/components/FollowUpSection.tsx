import React from 'react';
import { Check, X, Clock } from 'lucide-react';

interface SeededOutcome {
    outcome_type: 'decided' | 'cancelled' | 'thinking';
    feeling: 'happy' | 'neutral' | 'uncertain' | 'regret';
    outcome_text: string;
}

interface FollowUpSectionProps {
    followupDays?: number;
    seededOutcomes?: SeededOutcome[];
    isLoadingSeeds?: boolean;
}

const feelingEmojis: Record<string, string> = {
    happy: '😊',
    neutral: '😐',
    uncertain: '🤔',
    regret: '😔'
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

// Static fake texts for cards 2-3 (security: dev tools can't reveal real content)
const fakeTexts = [
    "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    "Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat"
];

export const FollowUpSection: React.FC<FollowUpSectionProps> = ({
    seededOutcomes = [],
    isLoadingSeeds = false
}) => {
    const scrollToRecoveryCode = () => {
        document.getElementById('recovery-code-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Get first seeded outcome for the visible card
    const realOutcome = seededOutcomes[0];

    // Skeleton Card Component
    const SkeletonCard = () => (
        <div
            className="p-4 rounded-2xl animate-pulse"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-300/50" />
                <div className="h-4 w-20 bg-gray-300/50 rounded" />
                <div className="text-xl opacity-30">😊</div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full bg-gray-300/50 rounded" />
                <div className="h-3 w-3/4 bg-gray-300/50 rounded" />
            </div>
        </div>
    );

    // Real Outcome Card (first line visible, rest blurred)
    const RealOutcomeCard = ({ outcome }: { outcome: SeededOutcome }) => {
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
                    <span className="text-lg">{feelingEmojis[outcome.feeling]}</span>
                </div>

                {/* Text: first part visible, rest blurred */}
                <p className="text-sm leading-relaxed">
                    <span style={{ color: 'var(--text-primary)' }}>
                        {firstSentence}
                    </span>
                    {restOfText && (
                        <span
                            className="blur-[4px] select-none"
                            style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
                        >
                            {' '}{restOfText.substring(0, 60)}...
                        </span>
                    )}
                </p>
            </div>
        );
    };

    // Fake Blurred Card (static text, fully blurred)
    const FakeBlurredCard = ({ text, intensity = 1 }: { text: string; intensity?: number }) => (
        <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{
                backgroundColor: 'var(--bg-tertiary)',
                opacity: 0.8 - (intensity * 0.15)
            }}
        >
            <div className={`flex items-center gap-2 mb-3 blur-[${2 + intensity}px]`}>
                <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ backgroundColor: 'var(--border-secondary)' }}
                >
                    <div className="w-3 h-3 rounded-full bg-gray-400/50" />
                    <div className="w-12 h-2 rounded bg-gray-400/50" />
                </div>
                <span className="text-lg opacity-50">😊</span>
            </div>
            <p
                className={`text-sm leading-relaxed select-none blur-[${4 + intensity * 2}px]`}
                style={{ color: 'var(--text-secondary)' }}
            >
                {text}
            </p>
        </div>
    );

    return (
        <div id="follow-up-section" className="flex flex-col items-center px-5 scroll-mt-24">
            <div className="w-full max-w-md space-y-8">
                {/* Conversational intro */}
                <div className="text-center space-y-3">
                    <h3 className="text-xl md:text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
                        Hikaye burada bitmiyor.
                    </h3>
                    <p className="leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Kararını paylaş, benzer durumları yaşayan<br />diğer insanların hikayelerini gör.
                    </p>
                </div>

                {/* Simple exchange card */}
                <div
                    className="rounded-2xl p-6"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-secondary)'
                    }}
                >
                    {/* How it works */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: 'var(--emerald-100)', color: 'var(--emerald-600)' }}
                            >
                                1
                            </div>
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Kararını paylaş
                                </p>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Ne yaptığını veya ne yapmaya karar verdiğini anlat
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: 'var(--emerald-100)', color: 'var(--emerald-600)' }}
                            >
                                2
                            </div>
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Başkalarını gör
                                </p>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Benzer durumları yaşayan insanların hikayeleri açılsın
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                        <p className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            Yarından itibaren deneyimini paylaşabilirsin.
                        </p>
                        <button
                            onClick={scrollToRecoveryCode}
                            className="mt-2 w-full text-center text-sm font-medium hover:underline"
                            style={{ color: 'var(--coral-primary)' }}
                        >
                            Nasıl paylaşırım? ↓
                        </button>
                    </div>
                </div>

                {/* Community Stories Preview */}
                <div className="space-y-4">
                    <div className="text-center">
                        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                            Başkaları ne yaşıyor?
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            Benzer kararlar veren insanların deneyimleri
                        </p>
                    </div>

                    <div className="space-y-3 relative">
                        {/* Gradient overlay at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-primary)] to-transparent z-20 pointer-events-none" />

                        {/* Lock Icon Overlay */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                            <div
                                className="p-3 rounded-full shadow-lg backdrop-blur-sm"
                                style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-secondary)'
                                }}
                            >
                                <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>

                        {/* Card 1: Real seeded outcome or skeleton */}
                        {isLoadingSeeds ? (
                            <SkeletonCard />
                        ) : realOutcome ? (
                            <RealOutcomeCard outcome={realOutcome} />
                        ) : (
                            <SkeletonCard />
                        )}

                        {/* Card 2: Fake blurred */}
                        <FakeBlurredCard text={fakeTexts[0]} intensity={1} />

                        {/* Card 3: Fake more blurred */}
                        <FakeBlurredCard text={fakeTexts[1]} intensity={2} />
                    </div>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                    <button
                        onClick={scrollToRecoveryCode}
                        className="w-full py-3.5 px-6 rounded-xl font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                        style={{ backgroundColor: '#FF6F61' }}
                    >
                        Hikayeni paylaş, diğerlerini gör ↓
                    </button>
                    <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                        Takip kodun ile istediğin zaman geri dönebilirsin
                    </p>
                </div>
            </div>
        </div>
    );
};

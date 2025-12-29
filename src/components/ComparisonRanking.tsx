import React, { useState, useEffect } from 'react';

interface RankedOption {
    name: string;
    fit_score: number;  // 0-100
    reason: string;     // Only filled for top option
}

interface ComparisonRankingProps {
    options: RankedOption[];
    onScrollToStories?: () => void;
}

// Random pastel colors for progress bars
const OPTION_COLORS = [
    '#FF6B6B', // Coral
    '#FBBF24', // Yellow
    '#4ECDC4', // Teal
    '#45B7D1', // Sky Blue
    '#96CEB4', // Sage
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
];

export const ComparisonRanking: React.FC<ComparisonRankingProps> = ({
    options,
    onScrollToStories
}) => {
    const [isAnimated, setIsAnimated] = useState(false);

    // Trigger animation after mount
    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Take max 5 options
    const displayOptions = options.slice(0, 5);
    const hasMoreOptions = options.length > 5;

    // Get a consistent color for each option based on index
    const getColor = (index: number) => OPTION_COLORS[index % OPTION_COLORS.length];

    return (
        <div className="comparison-ranking" style={{ marginBottom: '1.5rem' }}>
            <div className="space-y-4">
                {displayOptions.map((option, index) => {
                    const isTopOption = index === 0;
                    const isOtherOption = option.name.toLowerCase().includes('diğer') || option.fit_score === 0;
                    const color = getColor(index);
                    // Stagger animation delay for each option
                    const animationDelay = index * 150;

                    return (
                        <div key={index} className="relative">
                            {/* Option Header */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="font-semibold text-sm"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {option.name}
                                    </span>
                                    {isTopOption && (
                                        <span
                                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                                            style={{
                                                backgroundColor: 'rgba(255, 107, 107, 0.15)',
                                                color: '#FF6B6B',
                                                border: '1px solid rgba(255, 107, 107, 0.3)'
                                            }}
                                        >
                                            En Güçlü Aday
                                        </span>
                                    )}
                                </div>
                                {!isOtherOption && (
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        %{option.fit_score} Uygun
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar - not shown for "Diğer" */}
                            {!isOtherOption && (
                                <div
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: 'var(--neutral-200)' }}
                                >
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: isAnimated ? `${option.fit_score}%` : '0%',
                                            backgroundColor: color,
                                            transition: `width 1s ease-out ${animationDelay}ms`
                                        }}
                                    />
                                </div>
                            )}

                            {/* Reason - only for top option */}
                            {isTopOption && option.reason && (
                                <p
                                    className="text-xs mt-2 flex items-start gap-1.5"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <span style={{ color: '#10B981' }}>✓</span>
                                    {option.reason}
                                </p>
                            )}

                            {/* "Diğer" explanation */}
                            {isOtherOption && (
                                <p
                                    className="text-xs italic"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Mevcut kriterlerinize uygunluğu düşük olduğu için detaylı gösterilmedi.
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* More options notice */}
                {hasMoreOptions && (
                    <p
                        className="text-xs text-center italic"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        +{options.length - 5} diğer seçenek mevcut
                    </p>
                )}
            </div>

            {/* Story link */}
            {onScrollToStories && (
                <p
                    className="text-center text-xs mt-4"
                    style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                    Bu seçenekleri değerlendiren gerçek kullanıcı deneyimleri için{' '}
                    <span
                        onClick={onScrollToStories}
                        className="underline cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        hikayelere göz at
                    </span>
                </p>
            )}
        </div>
    );
};

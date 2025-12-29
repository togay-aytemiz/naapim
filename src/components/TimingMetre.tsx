import React, { useState, useEffect } from 'react';

interface TimingOption {
    label: string;
    value: string;  // "now", "1_month", "3_months", "6_months", "1_year", "2_years", "uncertain"
    fit_score: number;  // 0-100
}

interface TimingMetreProps {
    recommendation: string;  // The selected timing value
    reason: string;          // Why this timing
    alternatives?: TimingOption[];  // Other timing options with scores
    onScrollToStories?: () => void;
}

// Timeline positions and labels
const TIMING_POSITIONS = [
    { value: 'now', label: 'Hemen', position: 0 },
    { value: '1_month', label: '1 Ay', position: 16.6 },
    { value: '3_months', label: '3 Ay', position: 33.3 },
    { value: '6_months', label: '6 Ay', position: 50 },
    { value: '1_year', label: '1 Yıl', position: 66.6 },
    { value: '2_years', label: '2+ Yıl', position: 83.3 },
    { value: 'uncertain', label: 'Belirsiz', position: 100 },
];

// Colors for timing - gradient from green (now) to orange (wait)
const getTimingColor = (position: number) => {
    if (position <= 25) return '#10B981';  // Green - act now
    if (position <= 50) return '#84CC16';  // Light green - soon
    if (position <= 75) return '#FBBF24';  // Yellow - wait a bit
    return '#F59E0B';  // Orange - wait longer
};

export const TimingMetre: React.FC<TimingMetreProps> = ({
    recommendation,
    reason,
    alternatives = [],
    onScrollToStories
}) => {
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Find the recommended position
    const recommendedOption = TIMING_POSITIONS.find(t => t.value === recommendation) || TIMING_POSITIONS[3];
    const handlePosition = recommendedOption.position;
    const handleColor = getTimingColor(handlePosition);

    // Get timing label for display
    const getTimingLabel = () => {
        if (handlePosition <= 16) return 'Beklemeden harekete geç!';
        if (handlePosition <= 33) return 'Yakın zamanda harekete geç';
        if (handlePosition <= 50) return 'Biraz beklemen önerilir';
        if (handlePosition <= 66) return 'Sabırlı ol, acele etme';
        if (handlePosition <= 83) return 'Uzun vadeli düşün';
        return 'Zamanlama belirsiz';
    };

    return (
        <div className="timing-metre" style={{ marginBottom: '1.5rem' }}>
            {/* Metre Container */}
            <div className="relative px-4">
                {/* Bar and Handle Container */}
                <div className="relative" style={{ paddingTop: '44px', paddingBottom: '4px' }}>
                    {/* Handle with Tooltip - positioned to overlap bar */}
                    <div
                        className="absolute"
                        style={{
                            left: `${isAnimated ? handlePosition : 0}%`,
                            bottom: '-2px',
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                            transition: 'left 1.2s ease-out'
                        }}
                    >
                        {/* Tooltip bubble */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2"
                            style={{ bottom: '38px' }}
                        >
                            <div
                                className="px-3 py-1.5 rounded-lg whitespace-nowrap text-white text-xs font-semibold"
                                style={{ backgroundColor: handleColor }}
                            >
                                {recommendedOption.label}
                            </div>
                            {/* Triangle pointer */}
                            <div
                                className="absolute left-1/2 -translate-x-1/2"
                                style={{
                                    bottom: '-6px',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '6px solid transparent',
                                    borderRight: '6px solid transparent',
                                    borderTop: `6px solid ${handleColor}`
                                }}
                            />
                        </div>

                        {/* Handle circle - on top of bar */}
                        <div
                            className="rounded-full"
                            style={{
                                width: '28px',
                                height: '28px',
                                backgroundColor: 'white',
                                border: `3px solid ${handleColor}`,
                                boxShadow: `0 2px 8px rgba(0,0,0,0.15), 0 0 0 3px ${handleColor}33`
                            }}
                        />
                    </div>

                    {/* Timeline Bar */}
                    <div
                        className="h-2.5 rounded-full relative"
                        style={{
                            background: 'linear-gradient(to right, #10B981 0%, #84CC16 30%, #FBBF24 60%, #F59E0B 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                        }}
                    >
                        {/* Timing markers */}
                        {TIMING_POSITIONS.map((timing, index) => (
                            <div
                                key={timing.value}
                                className="absolute top-1/2 -translate-y-1/2"
                                style={{ left: `${timing.position}%` }}
                            >
                                <div
                                    className="w-1.5 h-1.5 rounded-full bg-white opacity-60"
                                    style={{ marginLeft: '-3px' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Labels Row - Below the bar */}
                <div className="flex justify-between items-center text-[10px] font-medium mt-1">
                    <span style={{ color: '#10B981' }}>HEMEN</span>
                    <span
                        className="tracking-wider uppercase"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        NE ZAMAN METRE
                    </span>
                    <span style={{ color: '#F59E0B' }}>BEKLE</span>
                </div>

                {/* Alternative timings (if provided) */}
                {alternatives.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {alternatives.slice(0, 3).map((alt, index) => {
                            const isSelected = alt.value === recommendation;
                            return (
                                <div key={index} className="flex items-center justify-between">
                                    <span
                                        className={`text-xs ${isSelected ? 'font-semibold' : ''}`}
                                        style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                    >
                                        {alt.label}
                                        {isSelected && (
                                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${handleColor}20`, color: handleColor }}>
                                                Önerildi
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        %{alt.fit_score} Uygun
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Timing Label and Reason */}
            <div className="mt-4 px-4">
                <p
                    className="text-sm font-medium text-center"
                    style={{ color: handleColor }}
                >
                    {getTimingLabel()}
                </p>
                {reason && (
                    <p
                        className="text-xs text-center mt-2"
                        style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
                    >
                        {reason}
                        {onScrollToStories && (
                            <>
                                {' '}
                                <span
                                    onClick={onScrollToStories}
                                    className="underline cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    Gerçek hikayelere buradan ulaş
                                </span>
                            </>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
};

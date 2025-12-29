import React, { useEffect, useState, useRef } from 'react';

interface NaapimMetreProps {
    score: number;       // 0-100
    label: string;       // "Olumlu Yaklaşım"
    leftLabel?: string;  // "YAPMA", "ALMA", "GİTME" etc.
    rightLabel?: string; // "YAP", "AL", "GİT" etc.
    animationDelay?: number; // ms before animation starts
    onScrollToStories?: () => void; // Callback to scroll to stories section
}

export const NaapimMetre: React.FC<NaapimMetreProps> = ({
    score,
    label,
    leftLabel = "YAPMA",
    rightLabel = "YAP",
    animationDelay = 300,
    onScrollToStories
}) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const animationRef = useRef<number | null>(null);

    // Clamp score between 0-100
    const clampedScore = Math.max(0, Math.min(100, score));

    // Smooth animation using requestAnimationFrame with easing
    useEffect(() => {
        const showTimer = setTimeout(() => setIsVisible(true), animationDelay);

        const startAnimation = () => {
            const startTime = performance.now();
            const duration = 1400; // ms
            const startValue = 0;
            const endValue = clampedScore;

            // Easing function: easeOutCubic for smooth deceleration
            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutCubic(progress);
                const currentValue = startValue + (endValue - startValue) * easedProgress;

                setAnimatedScore(Math.round(currentValue));

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        };

        const animTimer = setTimeout(startAnimation, animationDelay + 100);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(animTimer);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [clampedScore, animationDelay]);

    // Calculate handle position (percentage)
    const handlePosition = `${animatedScore}%`;

    // Get color based on score position on gradient
    // Gradient: #EF4444 (0%) → #F59E0B (30%) → #FBBF24 (50%) → #84CC16 (70%) → #10B981 (100%)
    const getScoreColor = (score: number) => {
        if (score <= 30) {
            // Red to Orange: #EF4444 → #F59E0B
            const t = score / 30;
            return `rgb(${Math.round(239 + (245 - 239) * t)}, ${Math.round(68 + (158 - 68) * t)}, ${Math.round(68 + (11 - 68) * t)})`;
        } else if (score <= 50) {
            // Orange to Yellow: #F59E0B → #FBBF24
            const t = (score - 30) / 20;
            return `rgb(${Math.round(245 + (251 - 245) * t)}, ${Math.round(158 + (191 - 158) * t)}, ${Math.round(11 + (36 - 11) * t)})`;
        } else if (score <= 70) {
            // Yellow to Light Green: #FBBF24 → #84CC16
            const t = (score - 50) / 20;
            return `rgb(${Math.round(251 + (132 - 251) * t)}, ${Math.round(191 + (204 - 191) * t)}, ${Math.round(36 + (22 - 36) * t)})`;
        } else {
            // Light Green to Green: #84CC16 → #10B981
            const t = (score - 70) / 30;
            return `rgb(${Math.round(132 + (16 - 132) * t)}, ${Math.round(204 + (185 - 204) * t)}, ${Math.round(22 + (129 - 22) * t)})`;
        }
    };

    const tooltipColor = getScoreColor(animatedScore);

    // Get description based on score
    const getDescription = () => {
        if (clampedScore >= 80) return `Analiz sonuçlarına göre ibre "${rightLabel}" tarafına daha yakındır.`;
        if (clampedScore >= 60) return `Analizimiz, mevcut koşullarınızda olumlu sonuç alabileceğinizi gösteriyor.`;
        if (clampedScore >= 40) return `Her iki yönde de artılar ve eksiler var. Dikkatli düşünün.`;
        if (clampedScore >= 20) return `Bazı riskler mevcut. Alternatifleri değerlendirin.`;
        return `Şu an için bu kararı erteleseniz daha iyi olabilir.`;
    };

    return (
        <div
            className={`naapim-metre transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ marginBottom: '1.5rem' }}
        >
            {/* Metre Container */}
            <div className="relative px-4">
                {/* Bar and Handle Container */}
                <div className="relative" style={{ paddingTop: '44px', paddingBottom: '4px' }}>
                    {/* Handle with Tooltip - positioned to overlap bar */}
                    <div
                        className="absolute"
                        style={{
                            left: handlePosition,
                            bottom: '-2px',
                            transform: 'translateX(-50%)',
                            zIndex: 10
                        }}
                    >
                        {/* Tooltip with background, no shadow */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2"
                            style={{ bottom: '38px' }}
                        >
                            <div
                                className="px-3 py-1.5 rounded-lg whitespace-nowrap text-white text-xs font-semibold"
                                style={{ backgroundColor: tooltipColor }}
                            >
                                %{animatedScore} {label}
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
                                    borderTop: `6px solid ${tooltipColor}`
                                }}
                            />
                        </div>

                        {/* Handle circle - with gradient-matched outline */}
                        <div
                            className="rounded-full"
                            style={{
                                width: '28px',
                                height: '28px',
                                backgroundColor: 'white',
                                border: `3px solid ${tooltipColor}`,
                                boxShadow: `0 2px 8px rgba(0,0,0,0.15), 0 0 0 3px ${tooltipColor}33`
                            }}
                        />
                    </div>

                    {/* Gradient Bar */}
                    <div
                        className="h-3 rounded-full"
                        style={{
                            background: 'linear-gradient(to right, #EF4444 0%, #F59E0B 30%, #FBBF24 50%, #84CC16 70%, #10B981 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                        }}
                    />
                </div>

                {/* Labels Row - Below the bar */}
                <div className="flex justify-between items-center text-xs font-semibold mt-2">
                    <span style={{ color: '#EF4444' }}>{leftLabel}</span>
                    <span
                        className="text-[10px] font-medium tracking-wider uppercase"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        NAAPIM METRE
                    </span>
                    <span style={{ color: '#10B981' }}>{rightLabel}</span>
                </div>
            </div>

            {/* Description with story link */}
            <p
                className="text-center text-xs mt-4 px-4"
                style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
            >
                {getDescription()}
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
        </div>
    );
};

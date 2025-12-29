import React from 'react';
import { Search, Users, Package, Calendar, CheckCircle, Lightbulb, Target, Rocket } from 'lucide-react';

interface MethodStep {
    title: string;
    description: string;
    icon?: string;  // Icon name hint from LLM
}

interface MethodRoadmapProps {
    steps: MethodStep[];
    summary?: string;  // Summary quote at the bottom
    onScrollToStories?: () => void;
}

// Map LLM hints to icons
const ICON_MAP: Record<string, React.ReactNode> = {
    'search': <Search className="w-5 h-5" />,
    'explore': <Search className="w-5 h-5" />,
    'keşif': <Search className="w-5 h-5" />,
    'users': <Users className="w-5 h-5" />,
    'deneme': <Users className="w-5 h-5" />,
    'try': <Users className="w-5 h-5" />,
    'package': <Package className="w-5 h-5" />,
    'ekipman': <Package className="w-5 h-5" />,
    'equipment': <Package className="w-5 h-5" />,
    'calendar': <Calendar className="w-5 h-5" />,
    'rutin': <Calendar className="w-5 h-5" />,
    'routine': <Calendar className="w-5 h-5" />,
    'check': <CheckCircle className="w-5 h-5" />,
    'complete': <CheckCircle className="w-5 h-5" />,
    'idea': <Lightbulb className="w-5 h-5" />,
    'plan': <Lightbulb className="w-5 h-5" />,
    'target': <Target className="w-5 h-5" />,
    'goal': <Target className="w-5 h-5" />,
    'launch': <Rocket className="w-5 h-5" />,
    'start': <Rocket className="w-5 h-5" />,
};

// Default icons for step positions
const DEFAULT_ICONS = [
    <Search className="w-5 h-5" />,
    <Users className="w-5 h-5" />,
    <Package className="w-5 h-5" />,
    <Calendar className="w-5 h-5" />,
    <CheckCircle className="w-5 h-5" />,
];

// Coral color for accents
const ACCENT_COLOR = '#FF6B6B';

export const MethodRoadmap: React.FC<MethodRoadmapProps> = ({
    steps,
    summary,
    onScrollToStories
}) => {
    // Take max 5 steps
    const displaySteps = steps.slice(0, 5);

    // Get icon for a step
    const getIcon = (step: MethodStep, index: number) => {
        if (step.icon) {
            const iconKey = step.icon.toLowerCase();
            if (ICON_MAP[iconKey]) return ICON_MAP[iconKey];
        }
        // Try to match title
        const titleLower = step.title.toLowerCase();
        for (const [key, icon] of Object.entries(ICON_MAP)) {
            if (titleLower.includes(key)) return icon;
        }
        // Default by position
        return DEFAULT_ICONS[index % DEFAULT_ICONS.length];
    };

    return (
        <div
            className="method-roadmap rounded-2xl p-5"
            style={{
                backgroundColor: 'var(--card-background)',
                border: '1px solid var(--card-border)'
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <p
                        className="text-[10px] uppercase tracking-wider font-medium mb-1"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        NAAPIM YOL HARİTASI
                    </p>
                    <h3
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        İzlemeniz Gereken Yöntem
                    </h3>
                </div>
                <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                        backgroundColor: `${ACCENT_COLOR}15`,
                        color: ACCENT_COLOR
                    }}
                >
                    <span>✓</span>
                    <span>{displaySteps.length} Aşamalı Plan</span>
                </div>
            </div>

            {/* Steps Container */}
            <div className="relative">
                {/* Connection Line Removed */}

                {/* Steps */}
                <div className="flex justify-between relative">
                    {displaySteps.map((step, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center text-center"
                            style={{ flex: 1, maxWidth: `${100 / displaySteps.length}%` }}
                        >
                            {/* Icon Circle */}
                            <div
                                className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-2"
                                style={{
                                    backgroundColor: 'var(--card-background)', // Opaque to cover the line
                                    border: `2px solid ${index === 0 ? ACCENT_COLOR : 'var(--neutral-200)'}`,
                                    boxShadow: index === 0 ? `inset 0 0 0 100px ${ACCENT_COLOR}15` : undefined, // Tint for active step
                                }}
                            >
                                <div style={{ color: index === 0 ? ACCENT_COLOR : 'var(--text-muted)' }}>
                                    {getIcon(step, index)}
                                </div>
                                {/* Step number badge */}
                                <div
                                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                    style={{
                                        backgroundColor: index === 0 ? ACCENT_COLOR : 'var(--neutral-300)',
                                        color: 'white'
                                    }}
                                >
                                    {index + 1}
                                </div>
                            </div>

                            {/* Step Title */}
                            <h4
                                className="text-xs font-semibold mb-1"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {step.title}
                            </h4>

                            {/* Step Description */}
                            <p
                                className="text-[10px] leading-tight px-1"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Quote */}
            {summary && (
                <div
                    className="mt-5 pt-4 text-center"
                    style={{ borderTop: '1px solid var(--card-border)' }}
                >
                    <p
                        className="text-xs italic"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        "{summary}"
                        {onScrollToStories && (
                            <>
                                {' '}
                                <span
                                    onClick={onScrollToStories}
                                    className="underline cursor-pointer hover:opacity-80 transition-opacity not-italic"
                                >
                                    Gerçek hikayelere buradan ulaş
                                </span>
                            </>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
};

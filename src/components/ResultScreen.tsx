import React, { useState, useEffect } from 'react';

interface AnimatedNumberProps {
    value: number;
    suffix?: string;
    delay?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, suffix = '', delay = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            const duration = 1200;
            const steps = 25;
            const increment = value / steps;
            let current = 0;

            const interval = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setDisplayValue(value);
                    clearInterval(interval);
                } else {
                    setDisplayValue(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return (
        <span className="tabular-nums">%{displayValue}{suffix}</span>
    );
};

// Pulsing dot component with coral color
const PulsingDot: React.FC = () => (
    <span className="relative flex h-2 w-2">
        <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: '#FF6F61' }}
        />
        <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: '#FF6F61' }}
        />
    </span>
);

export const ResultScreen: React.FC = () => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const explanationBullets = [
        'Durumun belirsizlik içeriyor, küçük adımlarla test etmek riski azaltır.',
        'Destek sistemin bu yaklaşımı destekleyebilir görünüyor.',
        'Aciliyet düşük olduğundan, gözlemleyerek ilerleyebilirsin.',
    ];

    const stats = [
        { label: 'ilk adımı attı', value: 43 },
        { label: 'erteledi', value: 29 },
        { label: 'vazgeçti', value: 18 },
    ];

    return (
        <div className={`space-y-8 px-5 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Main recommendation card */}
            <div
                className="text-center space-y-4 p-6 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
            >
                <div className="flex items-center justify-center gap-2">
                    <PulsingDot />
                    <p className="text-xs tracking-wide uppercase" style={{ color: '#FF6F61' }}>
                        Şu an için en mantıklı yol
                    </p>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Kademeli ilerle
                </h1>

                {/* Next step badge with coral accent */}
                <button
                    onClick={() => document.getElementById('follow-up-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95"
                    style={{
                        backgroundColor: 'rgba(255, 111, 97, 0.1)',
                        color: '#FF6F61',
                        border: '1px solid rgba(255, 111, 97, 0.2)'
                    }}
                >
                    <span>Sonraki adım ne?</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Explanation section */}
            <div
                className="p-5 rounded-xl space-y-4"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
                <h3 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                    Neden bu öneri?
                </h3>
                <div className="space-y-3">
                    {explanationBullets.map((bullet, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 animate-in`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <span
                                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                                style={{
                                    backgroundColor: 'rgba(255, 111, 97, 0.15)',
                                    color: '#FF6F61'
                                }}
                            >
                                {index + 1}
                            </span>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {bullet}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Anonymous stats */}
            <div
                className="p-5 rounded-xl"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
            >
                <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                    Benzer durumda olanlar
                </h3>

                <div className="flex flex-row justify-between items-start gap-2">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-1 text-center"
                        >
                            <span className="text-lg md:text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                <AnimatedNumber value={stat.value} delay={index * 200 + 500} />
                            </span>
                            <span className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

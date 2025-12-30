import React from 'react';
import type { AnalysisResult } from '../services/analysis';
import { Lightbulb } from 'lucide-react';

interface AnalysisReasoningProps {
    reasoning: string;
    alternatives?: AnalysisResult['alternatives'];
}

export const AnalysisReasoning: React.FC<AnalysisReasoningProps> = ({ reasoning, alternatives }) => {
    return (
        <>
            {/* Reasoning */}
            <div className="mb-5">
                <h3
                    className="text-sm font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-muted)' }}
                >
                    NEDEN?
                </h3>
                <p
                    className="leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {reasoning}
                </p>
            </div>

            {/* Alternatives Section */}
            {alternatives && alternatives.length > 0 && (
                <div className="mb-6">
                    <h3
                        className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Lightbulb className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                        DİĞER ALTERNATİFLER
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {alternatives.map((alt, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-2xl flex items-start gap-4"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-secondary)',
                                }}
                            >
                                {/* Soft Purple Badge */}
                                <div
                                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                    }}
                                >
                                    <span className="text-sm font-semibold" style={{ color: '#a78bfa' }}>{idx + 1}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[15px] leading-snug mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {alt.name}
                                    </p>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                        {alt.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

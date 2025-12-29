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
                        className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <Lightbulb className="w-4 h-4" />
                        DİĞER ALTERNATİFLER
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {alternatives.map((alt, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-xl flex items-start gap-3 transition-colors"
                                style={{
                                    border: '1px solid var(--border-secondary)',
                                    backgroundColor: 'var(--bg-secondary)'
                                }}
                            >
                                <div
                                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                                        border: '1px solid rgba(107, 114, 128, 0.2)'
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-gray-400">{idx + 1}</span>
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-gray-700 leading-tight">
                                        {alt.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
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

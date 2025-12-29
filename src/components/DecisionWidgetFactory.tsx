import React from 'react';
import type { AnalysisResult } from '../services/analysis';
import { MethodRoadmap } from './MethodRoadmap';
import { TimingMetre } from './TimingMetre';
import { ComparisonRanking } from './ComparisonRanking';
import { NaapimMetre } from './NaapimMetre';

interface DecisionWidgetFactoryProps {
    analysis: AnalysisResult;
    onScrollToStories?: () => void;
}

export const DecisionWidgetFactory: React.FC<DecisionWidgetFactoryProps> = ({ analysis, onScrollToStories }) => {
    // Widget selection BASED ON decision_type (LLM's explicit choice)
    // Fallback to legacy field-based detection if decision_type is missing

    const decisionType = analysis.decision_type;

    // 1. Method Roadmap - For how-to questions
    if (decisionType === 'method' || (!decisionType && analysis.method_steps && analysis.method_steps.length > 0)) {
        if (analysis.method_steps && analysis.method_steps.length > 0) {
            return (
                <div className="mb-6">
                    <MethodRoadmap
                        steps={analysis.method_steps}
                        summary={analysis.method_summary}
                        onScrollToStories={onScrollToStories}
                    />
                </div>
            );
        }
    }

    // 2. Timing Metre - For timing decisions
    if (decisionType === 'timing' || (!decisionType && analysis.timing_recommendation && analysis.timing_recommendation !== '')) {
        if (analysis.timing_recommendation && analysis.timing_recommendation !== '') {
            return (
                <div className="mb-6">
                    <TimingMetre
                        recommendation={analysis.timing_recommendation}
                        reason={analysis.timing_reason || ''}
                        alternatives={analysis.timing_alternatives}
                        onScrollToStories={onScrollToStories}
                    />
                </div>
            );
        }
    }

    // 3. Comparison Ranking - For comparison decisions (A vs B)
    if (decisionType === 'comparison' || (!decisionType && analysis.ranked_options && analysis.ranked_options.length > 0)) {
        if (analysis.ranked_options && analysis.ranked_options.length > 0) {
            return (
                <div className="mb-6">
                    <ComparisonRanking
                        options={analysis.ranked_options}
                        onScrollToStories={onScrollToStories}
                    />
                </div>
            );
        }
    }

    // 4. Naapim Metre - For binary decisions (default)
    // If decision_type is 'binary' OR if no decision_type and we have a score
    if (decisionType === 'binary' || (!decisionType && analysis.decision_score !== undefined)) {
        return (
            <div className="mb-6">
                <NaapimMetre
                    score={analysis.decision_score ?? 50}
                    label={analysis.score_label || 'Değerlendirme'}
                    leftLabel={analysis.metre_left_label}
                    rightLabel={analysis.metre_right_label}
                    onScrollToStories={onScrollToStories}
                />
            </div>
        );
    }

    return null;
};

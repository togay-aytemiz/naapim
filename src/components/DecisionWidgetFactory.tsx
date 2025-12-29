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
    // Priority: 1. Method Roadmap, 2. Timing Metre, 3. Comparison Ranking, 4. Naapim Metre

    // Method Roadmap - For how-to questions (highest priority)
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

    // Timing Metre - For timing decisions
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

    // Comparison Ranking - For comparison decisions
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

    // Naapim Metre - For binary decisions (lowest priority)
    if (analysis.decision_score !== undefined) {
        return (
            <div className="mb-6">
                <NaapimMetre
                    score={analysis.decision_score}
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

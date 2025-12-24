import React, { useState } from 'react';
import { Check, Clock, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { voteOutcome } from '../../services/voteService';
import { feelingOptions, feelingBadgeColors } from './constants';
import type { Outcome } from './types';

interface StoryCardProps {
    story: Outcome;
    sessionId: string;
}

/**
 * Story Card Component with local feedback state and vote counts
 * Displays a community story with outcome type, feeling, and voting
 */
export const StoryCard: React.FC<StoryCardProps> = ({ story, sessionId }) => {
    // Use vote data from story (from server), with local state for optimistic updates
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(story.user_vote || null);
    const [counts, setCounts] = useState<{ up: number; down: number }>(story.vote_counts || { up: 0, down: 0 });

    const handleVote = (type: 'up' | 'down') => {
        // Toggle off if clicking same button
        if (feedback === type) {
            setFeedback(null);
            // Decrement count optimistically
            setCounts(prev => ({
                ...prev,
                [type]: Math.max(0, prev[type] - 1)
            }));
            return;
        }

        // If switching vote, decrement old and increment new
        if (feedback) {
            setCounts(prev => ({
                up: type === 'up' ? prev.up + 1 : Math.max(0, prev.up - 1),
                down: type === 'down' ? prev.down + 1 : Math.max(0, prev.down - 1)
            }));
        } else {
            // New vote, just increment
            setCounts(prev => ({
                ...prev,
                [type]: prev[type] + 1
            }));
        }

        // Optimistic update
        setFeedback(type);

        // Persist
        if (sessionId) {
            voteOutcome(story.id, type, sessionId).catch(err => {
                console.error('Vote failed silently', err);
            });
        }
    };

    const feelingInfo = feelingOptions.find(f => f.type === story.feeling);
    if (!feelingInfo) return null;

    const colors = feelingBadgeColors[story.feeling || 'neutral'];

    // Outcome type styling
    const outcomeTypeStyles: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
        decided: {
            icon: <Check className="w-3 h-3" />,
            label: 'Karar verdi',
            bg: 'var(--emerald-100)',
            text: 'var(--emerald-700)'
        },
        cancelled: {
            icon: <X className="w-3 h-3" />,
            label: 'Vazgeçti',
            bg: 'var(--red-100)',
            text: 'var(--red-600)'
        },
        thinking: {
            icon: <Clock className="w-3 h-3" />,
            label: 'Düşünüyor',
            bg: 'var(--amber-100)',
            text: 'var(--amber-700)'
        }
    };

    const outcomeStyle = outcomeTypeStyles[story.outcome_type] || outcomeTypeStyles.decided;

    return (
        <div className="p-5 rounded-2xl transition-all duration-300 hover:shadow-sm" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-3">
                {/* Outcome Type Badge */}
                <span
                    className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: outcomeStyle.bg, color: outcomeStyle.text }}
                >
                    {outcomeStyle.icon}
                    {outcomeStyle.label}
                </span>
                {/* Feeling Badge */}
                <span className="text-lg">{feelingInfo.emoji}</span>
                <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                    {feelingInfo.label}
                </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                "{story.outcome_text}"
            </p>
            <div className="flex items-center justify-between mt-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>— Anonim kullanıcı</p>

                {/* Feedback Buttons - Reddit Style */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleVote('up')}
                            className={`p-1.5 rounded-full transition-all duration-200 ${feedback === 'up' ? 'bg-green-100 text-green-600 scale-110' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                            title="Faydalı"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        {counts.up > 0 && (
                            <span className={`text-xs font-medium ${feedback === 'up' ? 'text-green-600' : 'text-gray-400'}`}>
                                {counts.up}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleVote('down')}
                            className={`p-1.5 rounded-full transition-all duration-200 ${feedback === 'down' ? 'bg-red-100 text-red-600 scale-110' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                            title="Faydasız"
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        {counts.down > 0 && (
                            <span className={`text-xs font-medium ${feedback === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                                {counts.down}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

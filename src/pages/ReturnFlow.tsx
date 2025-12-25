import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Clock, X, ChevronDown, ChevronUp, Pencil, Sparkles } from 'lucide-react';
import type { Sentiment } from '../services/analysis';
import { RegistryLoader } from '../services/registryLoader';
import { saveOutcome, type FeelingType } from '../services/saveOutcome';
import { moderateContent } from '../services/moderateContent';
import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

// Extracted modules
import { StoryCard } from './returnFlow/StoryCard';
import {
    sentimentStyles,
    outcomeLabels,
    feelingOptions,
    moderationMessages
} from './returnFlow/constants';
import type { Outcome, SessionData, FlowStep, OutcomeType } from './returnFlow/types';

export const ReturnFlow: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = React.useState(() => new URLSearchParams(window.location.search));

    // Get code from URL query param or location state
    const urlCode = searchParams.get('code') || '';
    const stateCode = location.state?.code || '';
    const initialCode = urlCode || stateCode;

    const [step, setStep] = useState<FlowStep>('enter-code');
    const [code, setCode] = useState(initialCode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);

    // Outcome state
    const [outcomeType, setOutcomeType] = useState<OutcomeType>(null);
    const [outcomeText, setOutcomeText] = useState('');
    const [feeling, setFeeling] = useState<FeelingType | null>(null);
    const [keptDecision, setKeptDecision] = useState(false); // Track if user chose 'aynı karardayım'

    // UI state
    const [showDetails, setShowDetails] = useState(false);
    const [showAllAnswers, setShowAllAnswers] = useState(false);
    const [isModerating, setIsModerating] = useState(false);
    const [moderationError, setModerationError] = useState<string | null>(null);
    const [moderationMessageIndex, setModerationMessageIndex] = useState(0);
    const [communityStories, setCommunityStories] = useState<Outcome[]>([]);
    const [storiesLoading, setStoriesLoading] = useState(false);
    const [hasMoreStories, setHasMoreStories] = useState(false);
    const [storiesOffset, setStoriesOffset] = useState(0);
    const [noExactMatch, setNoExactMatch] = useState(false);

    // Inline reminder state for too-early screen
    const [reminderEmail, setReminderEmail] = useState('');
    const [reminderTime, setReminderTime] = useState<'tomorrow' | '1_week' | '2_weeks'>('1_week');
    const [reminderSubmitted, setReminderSubmitted] = useState(false);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [reminderError, setReminderError] = useState<string | null>(null);

    // Auto-fetch if code in URL or passed from HomeScreen
    useEffect(() => {
        if (initialCode) {
            fetchSession(initialCode);
        }
    }, []);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // Rotating moderation messages
    useEffect(() => {
        if (!isModerating) return;
        const interval = setInterval(() => {
            setModerationMessageIndex(prev => (prev + 1) % moderationMessages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isModerating]);

    // Fetch session data
    const fetchSession = async (codeToFetch: string) => {
        if (!codeToFetch.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ code: codeToFetch.trim().toUpperCase() })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Kod bulunamadı');
                return;
            }

            setSessionData(data);

            // Update URL with code (for sharing/bookmarking)
            const newUrl = `${window.location.pathname}?code=${codeToFetch.trim().toUpperCase()}`;
            window.history.replaceState({}, '', newUrl);

            // TIME-GATING LOGIC
            // User must wait until 07:30 UTC+3 (04:30 UTC) the morning after session creation
            if (data.created_at) {
                const sessionCreated = new Date(data.created_at);
                const now = new Date();

                // Calculate unlock time: next 04:30 UTC after session creation
                // (which is 07:30 UTC+3 = 04:30 UTC)
                const unlockTime = new Date(sessionCreated);
                unlockTime.setUTCHours(4, 30, 0, 0);

                // If session was created after 04:30 UTC, unlock is next day
                if (sessionCreated.getUTCHours() >= 4 && sessionCreated.getUTCMinutes() >= 30 ||
                    sessionCreated.getUTCHours() > 4) {
                    unlockTime.setUTCDate(unlockTime.getUTCDate() + 1);
                }

                // If user is too early, show time-gated message
                if (now < unlockTime) {
                    setStep('too-early');
                    return;
                }
            }

            // Decide which step to show
            if (data.previous_outcomes && data.previous_outcomes.length > 0) {
                // User has previous outcomes - show returning user flow
                setStep('returning-user');
            } else {
                // First time - show welcome back
                setStep('welcome-back');
            }

        } catch (err) {
            console.error('Error fetching session:', err);
            setError('Bir hata oluştu. Lütfen tekrar dene.');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = () => fetchSession(code);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.trim()) handleCodeSubmit();
    };

    // Handle "Keep" - user's decision stayed the same
    const handleKeepDecision = () => {
        if (sessionData?.previous_outcomes?.[0]) {
            setOutcomeType(sessionData.previous_outcomes[0].outcome_type);
            setKeptDecision(true); // Track that user chose to keep decision
            setStep('ask-feeling');
        }
    };

    // Handle "Change" - user wants to update their decision
    const handleChangeDecision = () => {
        setKeptDecision(false); // Reset since user is changing decision
        setStep('choose-outcome');
    };

    // Select outcome type
    const handleOutcomeSelect = (type: OutcomeType) => {
        setOutcomeType(type);
        setModerationError(null);
        setStep('ask-feeling');
    };

    // Select feeling
    const handleFeelingSelect = async (f: FeelingType) => {
        try {
            setFeeling(f);

            setStep('share-outcome');
        } catch (error) {
            console.error("Unexpected error in feeling selection", error);
            setStep('share-outcome');
        }
    };

    // Share outcome
    const handleShare = async () => {
        if (!sessionData || !outcomeType) return;

        setModerationError(null);
        let finalText = outcomeText.trim();

        // Moderate text if provided
        if (finalText) {
            setIsModerating(true);
            setModerationMessageIndex(0);

            try {
                const modResult = await moderateContent(finalText);

                if (!modResult.approved) {
                    setModerationError(modResult.reason || 'Topluluk kurallarına uymuyor.');
                    setIsModerating(false);
                    return;
                }

                if (modResult.corrected_text) {
                    finalText = modResult.corrected_text;
                    setOutcomeText(finalText);
                }
            } catch (err) {
                console.error('Moderation error:', err);
            }

            setIsModerating(false);
        }

        // Save outcome
        setLoading(true);
        try {
            await saveOutcome({
                session_id: sessionData.session_id,
                outcome_type: outcomeType,
                outcome_text: finalText || undefined,
                feeling: feeling || undefined,
                archetype_id: sessionData.archetype_id
            });

            // Fetch community stories before showing them (uses session context for matching)
            await fetchCommunityStories();

            setStep('view-stories');
        } catch (err) {
            console.error('Error saving outcome:', err);
            setStep('view-stories');
        } finally {
            setLoading(false);
        }
    };

    // Fetch community stories from DB - includes vote counts and user votes
    const fetchCommunityStories = async (loadMore = false) => {
        if (!sessionData) return;

        const offset = loadMore ? storiesOffset : 0;

        try {
            setStoriesLoading(true);

            // Build context from session responses for semantic matching
            const context = sessionData.answers
                ? Object.entries(sessionData.answers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')
                : '';

            const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/fetch-community-stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    archetype_id: sessionData.archetype_id,
                    limit: loadMore ? 5 : 10, // Initial load: 10, subsequent: 5
                    offset,
                    session_id: sessionData.session_id, // For user's own votes
                    exclude_session_id: sessionData.session_id,
                    user_question: sessionData.user_question,
                    context
                })
            });

            const data = await response.json();

            // Check if no exact matches (friendly message scenario)
            if (!loadMore) {
                setNoExactMatch(data.no_exact_match || false);
            }

            if (data.stories) {
                if (loadMore) {
                    // Append to existing stories
                    setCommunityStories(prev => [...prev, ...data.stories]);
                } else {
                    // Replace stories
                    setCommunityStories(data.stories);
                }

                // Update pagination state
                if (data.pagination) {
                    setHasMoreStories(data.pagination.has_more);
                    setStoriesOffset(data.pagination.next_offset || offset + data.stories.length);
                }
            }
        } catch (err) {
            console.error('Error fetching community stories:', err);
        } finally {
            setStoriesLoading(false);
        }
    };

    // Infinite scroll - using IntersectionObserver
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (!node || storiesLoading || !hasMoreStories) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreStories && !storiesLoading) {
                    fetchCommunityStories(true);
                }
            },
            { rootMargin: '200px' } // Start loading 200px before reaching bottom
        );

        observer.observe(node);

        // Cleanup on next render
        return () => observer.disconnect();
    }, [hasMoreStories, storiesLoading]);

    // Get sentiment style
    const getSentimentStyle = (sentiment: Sentiment | undefined) => {
        return sentimentStyles[sentiment || 'neutral'] || sentimentStyles.neutral;
    };

    // Get last outcome
    const lastOutcome = sessionData?.previous_outcomes?.[0];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
            <div className="max-w-md mx-auto">

                {/* Step 1: Enter Code */}
                {step === 'enter-code' && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Tekrar hoş geldin!
                            </h1>
                            <p className="text-[var(--text-secondary)] max-w-xs mx-auto">
                                Takip kodunu girerek kaldığın yerden devam edebilirsin.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                onKeyPress={handleKeyPress}
                                placeholder="XXXXXXXX"
                                className="w-full px-5 py-4 text-center text-xl font-mono tracking-widest rounded-2xl"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '2px solid var(--border-primary)',
                                    color: 'var(--text-primary)'
                                }}
                                autoFocus
                            />

                            {error && (
                                <p className="text-center text-sm" style={{ color: 'var(--error-text)' }}>{error}</p>
                            )}

                            <button
                                onClick={handleCodeSubmit}
                                disabled={!code.trim() || loading}
                                className="w-full py-4 rounded-xl font-medium"
                                style={{
                                    backgroundColor: code.trim() ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                                    color: code.trim() ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Yükleniyor...' : 'Devam Et'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                                ← Ana sayfaya dön
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1b: Too Early (Time-Gated) */}
                {step === 'too-early' && sessionData && (() => {
                    // Calculate unlock time for display
                    const sessionCreated = new Date(sessionData.created_at);
                    const unlockTime = new Date(sessionCreated);
                    unlockTime.setUTCHours(4, 30, 0, 0);
                    if (sessionCreated.getUTCHours() >= 4 && sessionCreated.getUTCMinutes() >= 30 ||
                        sessionCreated.getUTCHours() > 4) {
                        unlockTime.setUTCDate(unlockTime.getUTCDate() + 1);
                    }

                    // Format for Turkish locale
                    const timeString = unlockTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    const dateString = unlockTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

                    return (
                        <div className="space-y-8 animate-in">
                            <div className="text-center space-y-4">
                                <div className="text-6xl">⏰</div>
                                <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Biraz sabret!
                                </h1>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    Acele etme, düşünceli kararlar en iyileridir. <br />
                                    Yarın sabah tekrar gel, o zaman hikayeni paylaşabilirsin.
                                </p>
                            </div>

                            {/* Unlock Time Display */}
                            <div className="p-5 rounded-2xl text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Görüntüleyebilirsin:</p>
                                <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {dateString}
                                </p>
                                <p className="text-lg font-medium mt-1" style={{ color: 'var(--coral-primary)' }}>
                                    Saat {timeString}'den itibaren
                                </p>
                            </div>

                            {/* Original Question */}
                            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Sorduğun soru:</p>
                                <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>"{sessionData.user_question}"</p>
                            </div>

                            {/* Reminder CTA (if no reminder set) */}
                            {!sessionData.has_reminder && !reminderSubmitted && (
                                <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: 'rgba(255, 107, 107, 0.08)', border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                                    <p className="text-sm font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                                        🔔 Unutmamak için hatırlatma kur!
                                    </p>
                                    <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                                        Sana e-posta ile haber verelim, böylece doğru zamanda geri dönebilirsin.
                                    </p>

                                    {/* Time Selection Pills */}
                                    <div className="flex justify-center gap-2">
                                        {[
                                            { id: 'tomorrow', label: 'Yarın' },
                                            { id: '1_week', label: '1 Hafta' },
                                            { id: '2_weeks', label: '2 Hafta' }
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => setReminderTime(option.id as any)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${reminderTime === option.id
                                                    ? 'border-[var(--coral-primary)] bg-[var(--coral-primary)] text-white'
                                                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Email + Button */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="email"
                                            autoComplete="email"
                                            value={reminderEmail}
                                            onChange={(e) => setReminderEmail(e.target.value)}
                                            placeholder="E-posta adresin"
                                            className="flex-1 px-4 py-3 rounded-xl text-sm"
                                            style={{
                                                backgroundColor: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!reminderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reminderEmail)) return;
                                                setReminderLoading(true);
                                                setReminderError(null);
                                                try {
                                                    const { scheduleReminder } = await import('../services/emailService');
                                                    const result = await scheduleReminder(
                                                        reminderEmail,
                                                        sessionData.code,
                                                        sessionData.user_question,
                                                        sessionData.session_id,
                                                        sessionData.analysis?.followup_question,
                                                        reminderTime,
                                                        sessionData.previous_outcomes || []
                                                    );
                                                    if (result.success) {
                                                        setReminderSubmitted(true);
                                                    } else {
                                                        setReminderError('Bir hata oluştu.');
                                                    }
                                                } catch {
                                                    setReminderError('Bağlantı hatası.');
                                                } finally {
                                                    setReminderLoading(false);
                                                }
                                            }}
                                            disabled={!reminderEmail || reminderLoading}
                                            className="px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap text-white"
                                            style={{
                                                backgroundColor: reminderEmail ? 'var(--coral-primary)' : 'var(--btn-disabled-bg)',
                                                color: reminderEmail ? 'white' : 'var(--btn-disabled-text)',
                                                opacity: reminderLoading ? 0.7 : 1
                                            }}
                                        >
                                            {reminderLoading ? 'Ayarlanıyor...' : 'Hatırlat'}
                                        </button>
                                    </div>
                                    {reminderError && <p className="text-xs text-center text-red-500">{reminderError}</p>}
                                </div>
                            )}

                            {/* Reminder Success Feedback */}
                            {reminderSubmitted && (
                                <div
                                    className="animate-in text-center p-5 rounded-2xl space-y-3"
                                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                                            <span className="text-xl">🚀</span>
                                        </div>
                                        <p className="font-semibold" style={{ color: 'var(--success-text)' }}>Hatırlatma Kuruldu!</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            <strong>{reminderEmail}</strong> adresine {reminderTime === 'tomorrow' ? 'yarın' : reminderTime === '1_week' ? '1 hafta sonra' : '2 hafta sonra'} haber vereceğiz.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Already has reminder */}
                            {sessionData.has_reminder && (
                                <div className="p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-medium text-sm" style={{ color: 'var(--success-text)' }}>Hatırlatma zaten kurulu!</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sana e-posta ile haber vereceğiz.</p>
                                    </div>
                                </div>
                            )}

                            <div className="text-center">
                                <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                                    ← Ana sayfaya dön
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Step 2: Welcome Back (First Time - No Previous Outcomes) */}
                {step === 'welcome-back' && sessionData && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">👋</div>
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Tekrar merhaba!
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Geçen seferki sorunla ilgili nasıl gidiyor?
                            </p>
                        </div>

                        {/* Original Question */}
                        <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Sorduğun soru:</p>
                            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>"{sessionData.user_question}"</p>
                        </div>

                        {/* Previous Recommendation - AI Analysis Card */}
                        {sessionData.analysis && (() => {
                            const style = getSentimentStyle(sessionData.analysis.sentiment);
                            return (
                                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
                                    <div className="p-5">
                                        {/* AI Badge */}
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: 'white',
                                                    color: 'var(--coral-primary)',
                                                    border: '1px solid var(--coral-primary)'
                                                }}
                                            >
                                                <Sparkles className="w-3.5 h-3.5" fill="currentColor" />
                                                <span>naapim AI</span>
                                                <span style={{ color: style.text, opacity: 0.5 }}>•</span>
                                                <span style={{ color: style.text, opacity: 0.7 }}>Kişiselleştirilmiş Analiz</span>
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <p className="font-semibold text-lg text-center mb-3" style={{ color: style.text }}>{sessionData.analysis.title}</p>

                                        {/* Recommendation */}
                                        <p className="text-sm text-center leading-relaxed" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.recommendation}</p>
                                    </div>

                                    {showDetails && (
                                        <div className="px-5 pb-5 space-y-4">
                                            <div className="h-px" style={{ backgroundColor: style.border }} />
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: style.text, opacity: 0.6 }}>Neden?</p>
                                                <p className="text-sm leading-relaxed" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.reasoning}</p>
                                            </div>
                                            {sessionData.analysis.steps?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: style.text, opacity: 0.6 }}>Önerilen Adımlar</p>
                                                    <ul className="space-y-2">
                                                        {sessionData.analysis.steps.slice(0, 5).map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: style.text, opacity: 0.9 }}>
                                                                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: style.border, color: style.text }}>{i + 1}</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button onClick={() => setShowDetails(!showDetails)} className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium" style={{ color: style.text, borderTop: `1px solid ${style.border}` }}>
                                        <span>{showDetails ? 'Daha az göster' : 'Detayları gör'}</span>
                                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Followup Question */}
                        <div className="space-y-4">
                            <p className="text-center text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                                {sessionData.analysis?.followup_question || `"${sessionData.user_question}" konusunda bir karar verdin mi?`}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button onClick={() => handleOutcomeSelect('decided')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Check className="w-5 h-5" style={{ color: 'var(--emerald-600)' }} /> Evet, bir şeyler oldu!
                                </button>
                                <button onClick={() => handleOutcomeSelect('thinking')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Clock className="w-5 h-5" style={{ color: 'var(--amber-600)' }} /> Henüz düşünüyorum
                                </button>
                                <button onClick={() => handleOutcomeSelect('cancelled')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <X className="w-5 h-5" style={{ color: 'var(--red-500)' }} /> Vazgeçtim
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2b: Returning User (Has Previous Outcomes) */}
                {step === 'returning-user' && sessionData && lastOutcome && (
                    <div className="space-y-6 animate-in">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">👋</div>
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Tekrar hoş geldin!
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Geçen seferden bu yana neler değişti?
                            </p>
                        </div>

                        {/* Original Question */}
                        <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Sorduğun soru:</p>
                            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>"{sessionData.user_question}"</p>
                        </div>

                        {/* Previous Recommendation - AI Analysis Card */}
                        {sessionData.analysis && (() => {
                            const style = getSentimentStyle(sessionData.analysis.sentiment);
                            return (
                                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
                                    <div className="p-5">
                                        {/* AI Badge */}
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: 'rgba(255, 107, 107, 0.15)',
                                                    color: 'var(--coral-primary)'
                                                }}
                                            >
                                                <Sparkles className="w-3.5 h-3.5" fill="currentColor" />
                                                <span>naapim AI</span>
                                                <span style={{ color: style.text, opacity: 0.5 }}>•</span>
                                                <span style={{ color: style.text, opacity: 0.7 }}>Kişiselleştirilmiş Analiz</span>
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <p className="font-semibold text-lg text-center mb-3" style={{ color: style.text }}>{sessionData.analysis.title}</p>

                                        {/* Recommendation */}
                                        <p className="text-sm text-center leading-relaxed" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.recommendation}</p>
                                    </div>

                                    {showDetails && (
                                        <div className="px-5 pb-5 space-y-4">
                                            <div className="h-px" style={{ backgroundColor: style.border }} />
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: style.text, opacity: 0.6 }}>Neden?</p>
                                                <p className="text-sm leading-relaxed" style={{ color: style.text, opacity: 0.9 }}>{sessionData.analysis.reasoning}</p>
                                            </div>
                                            {sessionData.analysis.steps?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: style.text, opacity: 0.6 }}>Önerilen Adımlar</p>
                                                    <ul className="space-y-2">
                                                        {sessionData.analysis.steps.slice(0, 5).map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: style.text, opacity: 0.9 }}>
                                                                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5" style={{ backgroundColor: style.border, color: style.text }}>{i + 1}</span>
                                                                <span>{s}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button onClick={() => setShowDetails(!showDetails)} className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium" style={{ color: style.text, borderTop: `1px solid ${style.border}` }}>
                                        <span>{showDetails ? 'Daha az göster' : 'Detayları gör'}</span>
                                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Last Decision Display */}
                        <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Son paylaşımın:</p>
                            <div className="flex items-center gap-3">
                                {lastOutcome.outcome_type === 'decided' && <Check className="w-6 h-6" style={{ color: 'var(--emerald-600)' }} />}
                                {lastOutcome.outcome_type === 'thinking' && <Clock className="w-6 h-6" style={{ color: 'var(--amber-600)' }} />}
                                {lastOutcome.outcome_type === 'cancelled' && <X className="w-6 h-6" style={{ color: 'var(--red-500)' }} />}
                                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {outcomeLabels[lastOutcome.outcome_type]}
                                </p>
                                {lastOutcome.feeling && (() => {
                                    const feelingInfo = feelingOptions.find(f => f.type === lastOutcome.feeling);
                                    return feelingInfo ? (
                                        <span className="text-lg ml-auto">{feelingInfo.emoji}</span>
                                    ) : null;
                                })()}
                            </div>
                            {lastOutcome.outcome_text && (
                                <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>"{lastOutcome.outcome_text}"</p>
                            )}
                        </div>

                        {/* CTA - Encourage sharing */}
                        <div className="space-y-4">
                            <p className="text-center text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                                Kararını paylaş, başkalarında neler değişmiş gör! ✨
                            </p>

                            <div className="flex flex-col gap-3">
                                <button onClick={handleKeepDecision} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Check className="w-5 h-5" style={{ color: 'var(--emerald-600)' }} /> Aynı karardayım
                                </button>
                                <button onClick={handleChangeDecision} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Pencil className="w-5 h-5" style={{ color: 'var(--blue-600)' }} /> Kararım değişti
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Choose Outcome (Change Decision) */}
                {step === 'choose-outcome' && sessionData && (() => {
                    const lastOutcomeType = sessionData.previous_outcomes?.[0]?.outcome_type;
                    return (
                        <div className="space-y-8 animate-in">
                            <div className="text-center space-y-3">
                                <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {sessionData.analysis?.followup_question || `"${sessionData.user_question}" konusunda ne oldu?`}
                                </h1>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button onClick={() => handleOutcomeSelect('decided')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <Check className="w-5 h-5" style={{ color: 'var(--emerald-600)' }} /> Karar verdim
                                </button>
                                {/* Only show 'thinking' if last outcome wasn't 'thinking' - user is changing their mind */}
                                {lastOutcomeType !== 'thinking' && (
                                    <button onClick={() => handleOutcomeSelect('thinking')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                        <Clock className="w-5 h-5" style={{ color: 'var(--amber-600)' }} /> Hala düşünüyorum
                                    </button>
                                )}
                                <button onClick={() => handleOutcomeSelect('cancelled')} className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <X className="w-5 h-5" style={{ color: 'var(--red-500)' }} /> Vazgeçtim
                                </button>
                            </div>

                            {/* Back button */}
                            <div className="text-center">
                                <button onClick={() => setStep('returning-user')} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                                    ← Geri dön
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Step 4: Ask Feeling */}
                {step === 'ask-feeling' && sessionData && (
                    <div className="space-y-8 animate-in text-center">
                        <div className="space-y-3">
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Bu kararla ilgili nasıl hissediyorsun?
                            </h1>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {feelingOptions.map((f) => (
                                <button
                                    key={f.type}
                                    onClick={() => handleFeelingSelect(f.type)}
                                    disabled={loading}
                                    className="py-5 rounded-xl font-medium flex flex-col items-center gap-2 transition-all duration-200 active:scale-95"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-primary)',
                                        opacity: loading ? 0.5 : 1,
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <span className="text-3xl">{f.emoji}</span>
                                    <span className="text-sm">{f.label}</span>
                                </button>
                            ))}
                        </div>
                        {loading && (
                            <p className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
                                İşleminiz yapılıyor, lütfen bekleyin...
                            </p>
                        )}

                        {/* Back button */}
                        {!loading && (
                            <div className="text-center">
                                <button
                                    onClick={() => setStep(keptDecision ? 'returning-user' : 'choose-outcome')}
                                    className="text-sm hover:underline"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    ← Geri dön
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Share Outcome */}
                {step === 'share-outcome' && sessionData && (
                    <div className="space-y-8 animate-in">
                        <div className="text-center space-y-3">
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Deneyimini paylaş
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Kısaca ne olduğunu anlat. Diğer insanlara ilham olabilirsin.
                            </p>
                        </div>

                        <textarea
                            value={outcomeText}
                            onChange={(e) => { setOutcomeText(e.target.value); setModerationError(null); }}
                            disabled={isModerating || loading}
                            className="w-full p-4 rounded-2xl min-h-[150px] resize-none"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: moderationError ? '2px solid var(--red-400)' : '2px solid var(--border-primary)',
                                color: 'var(--text-primary)',
                                opacity: (isModerating || loading) ? 0.7 : 1
                            }}
                            placeholder="Ne karar verdin? Ne oldu? Nasıl hissettin?"
                        />

                        {moderationError && (
                            <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'var(--red-50)', border: '1px solid var(--red-300)' }}>
                                <X className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--red-500)' }} />
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--red-700)' }}>Topluluk kurallarına uymuyor</p>
                                    <p className="text-sm mt-1" style={{ color: 'var(--red-600)' }}>{moderationError}</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleShare}
                            disabled={isModerating || loading}
                            className="w-full py-4 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--btn-primary-bg)', opacity: (isModerating || loading) ? 0.7 : 1 }}
                        >
                            {isModerating ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span key={moderationMessageIndex} className="animate-in fade-in duration-300">{moderationMessages[moderationMessageIndex]}</span>
                                </div>
                            ) : loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Kaydediliyor...</span>
                                </div>
                            ) : (
                                <>Paylaş ve diğerlerini gör <ChevronDown className="w-5 h-5" /></>
                            )}
                        </button>

                        {/* Back button */}
                        {!isModerating && !loading && (
                            <div className="text-center">
                                <button onClick={() => setStep('ask-feeling')} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                                    ← Geri dön
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5b: Thinking Reminder - Encourage reminder for thinking users */}
                {step === 'thinking-reminder' && sessionData && (
                    <div className="space-y-6 animate-in">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">💭</div>
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Düşünmeye devam et!
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Karar verdiğinde hikayeni paylaşmak için geri gel.
                            </p>
                        </div>

                        {/* Reminder CTA - only show if no existing reminder */}
                        {!sessionData.has_reminder && !reminderSubmitted && (
                            <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: 'rgba(255, 107, 107, 0.08)', border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                                <p className="text-sm font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                                    🔔 Unutmamak için hatırlatma kur!
                                </p>
                                <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                                    Sana e-posta ile haber verelim, böylece doğru zamanda geri dönebilirsin.
                                </p>

                                {/* Time Selection Pills */}
                                <div className="flex justify-center gap-2">
                                    {[
                                        { id: 'tomorrow', label: 'Yarın' },
                                        { id: '1_week', label: '1 Hafta' },
                                        { id: '2_weeks', label: '2 Hafta' }
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setReminderTime(option.id as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${reminderTime === option.id
                                                ? 'border-[var(--coral-primary)] bg-[var(--coral-primary)] text-white'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Email + Button */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="email"
                                        autoComplete="email"
                                        value={reminderEmail}
                                        onChange={(e) => setReminderEmail(e.target.value)}
                                        placeholder="E-posta adresin"
                                        className="flex-1 px-4 py-3 rounded-xl text-sm"
                                        style={{
                                            backgroundColor: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!reminderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reminderEmail)) return;
                                            setReminderLoading(true);
                                            setReminderError(null);
                                            try {
                                                const { scheduleReminder } = await import('../services/emailService');
                                                const result = await scheduleReminder(
                                                    reminderEmail,
                                                    sessionData.code,
                                                    sessionData.user_question,
                                                    sessionData.session_id,
                                                    sessionData.analysis?.followup_question,
                                                    reminderTime,
                                                    sessionData.previous_outcomes || []
                                                );
                                                if (result.success) {
                                                    setReminderSubmitted(true);
                                                } else {
                                                    setReminderError('Bir hata oluştu.');
                                                }
                                            } catch {
                                                setReminderError('Bağlantı hatası.');
                                            } finally {
                                                setReminderLoading(false);
                                            }
                                        }}
                                        disabled={!reminderEmail || reminderLoading}
                                        className="px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap text-white"
                                        style={{
                                            backgroundColor: reminderEmail ? 'var(--coral-primary)' : 'var(--btn-disabled-bg)',
                                            color: reminderEmail ? 'white' : 'var(--btn-disabled-text)',
                                            opacity: reminderLoading ? 0.7 : 1
                                        }}
                                    >
                                        {reminderLoading ? 'Ayarlanıyor...' : 'Hatırlat'}
                                    </button>
                                </div>
                                {reminderError && <p className="text-xs text-center text-red-500">{reminderError}</p>}
                            </div>
                        )}

                        {/* Reminder Success Feedback - after submitting */}
                        {reminderSubmitted && (
                            <div
                                className="animate-in text-center p-5 rounded-2xl space-y-3"
                                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                                        <span className="text-xl">🚀</span>
                                    </div>
                                    <p className="font-semibold" style={{ color: 'var(--success-text)' }}>Hatırlatma Kuruldu!</p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <strong>{reminderEmail}</strong> adresine {reminderTime === 'tomorrow' ? 'yarın' : reminderTime === '1_week' ? '1 hafta sonra' : '2 hafta sonra'} haber vereceğiz.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Already has reminder message */}
                        {sessionData.has_reminder && !reminderSubmitted && (
                            <div className="p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                <span className="text-2xl">✅</span>
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--success-text)' }}>Hatırlatma zaten kurulu!</p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sana e-posta ile haber vereceğiz.</p>
                                </div>
                            </div>
                        )}

                        {/* Go to home link */}
                        <div className="text-center">
                            <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                                ← Ana sayfaya dön
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 6: View Stories */}
                {step === 'view-stories' && sessionData && (
                    <div className="space-y-6 animate-in">
                        <div className="text-center space-y-3">
                            <div className="text-4xl">🎉</div>
                            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Teşekkürler!</h1>
                            <p className="text-[var(--text-secondary)]">Hikayeni paylaştığın için teşekkürler.</p>
                        </div>

                        {/* User's story with feeling */}
                        {(outcomeText.trim() || feeling) && (
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Senin hikayen:</p>
                                {outcomeText.trim() && (
                                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>"{outcomeText}"</p>
                                )}
                                {feeling && (
                                    <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                                        <span className="text-xl">{feelingOptions.find(f => f.type === feeling)?.emoji}</span>
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {feelingOptions.find(f => f.type === feeling)?.label} hissediyorsun
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Expandable Answers Section */}
                        {sessionData.answers && sessionData.archetype_id && Object.keys(sessionData.answers).length > 0 && (() => {
                            const questions = RegistryLoader.getQuestionsForArchetype(sessionData.archetype_id);
                            const allAnswers = Object.entries(sessionData.answers);
                            const answersToShow = showAllAnswers ? allAnswers : allAnswers.slice(0, 3);
                            const hasMore = allAnswers.length > 3;

                            return (
                                <div className="p-4 rounded-2xl relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Senin gibi düşünenler de var:</p>
                                    <div
                                        className="space-y-3 transition-all duration-500 ease-in-out overflow-hidden"
                                        style={{
                                            maxHeight: showAllAnswers ? `${allAnswers.length * 60}px` : '180px',
                                        }}
                                    >
                                        {answersToShow.map(([fieldKey, optionId], index) => {
                                            const question = questions.find(q => q.id === fieldKey);
                                            const option = question?.options.find(o => o.id === optionId);
                                            if (!question || !option) return null;

                                            const isLastVisible = !showAllAnswers && index === 2 && hasMore;

                                            return (
                                                <div
                                                    key={fieldKey}
                                                    className="flex flex-col gap-0.5 transition-opacity duration-300"
                                                    style={{
                                                        opacity: isLastVisible ? 0.4 : 1,
                                                    }}
                                                >
                                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{question.text}</p>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{option.label}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Gradient overlay when collapsed */}
                                    {hasMore && !showAllAnswers && (
                                        <div
                                            className="absolute bottom-12 left-0 right-0 h-16 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(to bottom, transparent, var(--bg-secondary))',
                                            }}
                                        />
                                    )}

                                    {/* Show more/less button */}
                                    {hasMore && (
                                        <button
                                            onClick={() => setShowAllAnswers(!showAllAnswers)}
                                            className="w-full mt-3 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            <span>{showAllAnswers ? 'Daha az göster' : `Tüm cevapları gör (${allAnswers.length})`}</span>
                                            {showAllAnswers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {/* No exact match message */}
                        {noExactMatch && (
                            <div
                                className="p-5 rounded-2xl text-center space-y-3"
                                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                            >
                                <div className="text-2xl">🌱</div>
                                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Henüz benzer deneyim yok
                                </h4>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Seninle tam olarak aynı konuda düşünen birileri henüz hikayelerini paylaşmamış.
                                    Ara sıra uğrayarak yeni hikayeleri görebilirsin!
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    ✨ Senin hikayen başkalarına ilham olacak
                                </p>
                            </div>
                        )}

                        {/* Others' Experiences with Feelings - Real Data */}
                        {communityStories.filter(s => s.feeling && s.outcome_text).length > 0 && (
                            <>
                                <div className="text-center pt-2">
                                    <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Diğerlerinin deneyimleri:</h3>
                                </div>

                                <div className="space-y-4">
                                    {communityStories
                                        .filter(story => story.feeling && story.outcome_text)
                                        .map(story => (
                                            <StoryCard
                                                key={story.id}
                                                story={story}
                                                sessionId={sessionData?.session_id || ''}
                                            />
                                        ))}
                                    {/* Infinite scroll sentinel - auto-loads when visible */}
                                    {hasMoreStories && (
                                        <div
                                            ref={loadMoreRef}
                                            className="py-4 flex items-center justify-center"
                                        >
                                            {storiesLoading && (
                                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                                    Yükleniyor...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="text-center">
                            <button onClick={() => navigate('/')} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                                ← Ana sayfaya dön
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ReturnFlow;

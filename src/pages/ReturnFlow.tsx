import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Clock, X, ChevronDown, ChevronUp, Calendar, CheckCircle, Hourglass, XCircle, ArrowRight, Lock } from 'lucide-react';

import { RegistryLoader } from '../services/registryLoader';
import { saveOutcome, type FeelingType } from '../services/saveOutcome';
import { moderateContent } from '../services/moderateContent';
import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

// Extracted modules
import { StoryCard } from './returnFlow/StoryCard';
import {


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

    // Theme detection for gradient
    const [isDarkMode, setIsDarkMode] = useState(() =>
        document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Outcome state
    const [outcomeType, setOutcomeType] = useState<OutcomeType>(null);
    const [outcomeText, setOutcomeText] = useState('');
    const [feeling, setFeeling] = useState<FeelingType | null>(null);

    const [showDetails, setShowDetails] = useState(false);

    // UI state

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


    // Get last outcome
    const lastOutcome = sessionData?.previous_outcomes?.[0];

    return (
        <div className="min-h-screen py-8 px-4 relative overflow-hidden">

            {/* Page content */}
            <div className="max-w-md mx-auto relative z-10">

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
                        <div className="space-y-6 animate-in">
                            {/* Header Section */}
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Karar Takibi</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span style={{ color: 'var(--text-muted)' }} className="text-sm">Takip Kodu:</span>
                                        <span className="font-mono bg-[var(--bg-secondary)] px-2 py-0.5 rounded text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            #{sessionData.code}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <span>Ana Sayfa</span>
                                </button>
                            </div>

                            {/* White/Elevated Wrapper Card */}
                            <div
                                className="rounded-3xl p-6 md:p-8"
                                style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-secondary)',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
                                }}
                            >
                                <div className="text-center space-y-4 mb-8">
                                    <div className="text-6xl animate-bounce duration-1000">⏰</div>
                                    <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Biraz sabret!
                                    </h1>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Acele etme, düşünceli kararlar en iyileridir. <br />
                                        Yarın sabah tekrar gel, o zaman hikayeni paylaşabilirsin.
                                    </p>
                                </div>

                                {/* Unlock Time Display */}
                                <div className="p-5 rounded-2xl text-center mb-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
                                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Görüntüleyebilirsin:</p>
                                    <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {dateString}
                                    </p>
                                    <p className="text-lg font-medium mt-1" style={{ color: 'var(--coral-primary)' }}>
                                        Saat {timeString}'den itibaren
                                    </p>
                                </div>

                                {/* Original Question */}
                                <div className="p-5 rounded-2xl mb-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}>
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
                            </div>
                        </div>
                    );
                })()}

                {/* Step 2: Welcome Back (First Time - No Previous Outcomes) */}
                {step === 'welcome-back' && sessionData && (
                    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in text-left">
                        {/* Page Header */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Merhaba 🙌</h2>
                            <span className="font-mono px-2 py-0.5 rounded text-xs" style={{ color: '#2b8cee', backgroundColor: 'rgba(43, 140, 238, 0.1)' }}>
                                #{sessionData.code}
                            </span>
                        </div>

                        {/* Part 1: Reflection Card (Hero) */}
                        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ border: '1px solid var(--return-card-border)' }}>
                            {/* Question Section (Top) */}
                            <div className="p-6 sm:p-8" style={{ backgroundColor: 'var(--return-card-top)' }}>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 text-[10px] font-bold uppercase tracking-wide leading-none" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--accent-500)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="mt-[1px]">
                                        {(() => {
                                            const created = new Date(sessionData.created_at);
                                            const now = new Date();
                                            const diffTime = Math.abs(now.getTime() - created.getTime());
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            return diffDays <= 1 ? 'BUGÜN SORDUN' : `${diffDays} GÜN ÖNCE SORDUN`;
                                        })()}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: 'var(--return-card-text-top)' }}>
                                    "{sessionData.user_question}"
                                </h3>
                            </div>

                            {/* AI Analysis Summary (Bottom) */}
                            <div className="p-6 sm:p-8 relative overflow-hidden" style={{ backgroundColor: 'var(--return-card-bottom)', borderTop: '1px solid var(--return-card-border)' }}>
                                {/* Background Decorative Icon */}
                                <div className="absolute -bottom-6 -right-6 opacity-[0.03] pointer-events-none">
                                    <span className="material-symbols-outlined !text-[12rem]" style={{ color: 'var(--text-primary)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                </div>

                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-4" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        naapim AI Önerisi
                                    </div>
                                    <p className="leading-relaxed text-base sm:text-lg font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                                        {sessionData.analysis?.recommendation || "Analiz yüklenemedi."}
                                    </p>

                                    {/* Collapsible Details */}
                                    <div className="mt-4">
                                        {showDetails ? (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="my-4 h-px bg-[var(--border-secondary)] opacity-30" />
                                                <div className="flex flex-col gap-6 text-left">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>NEDEN?</p>
                                                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                            {sessionData.analysis?.reasoning}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>ADIMLAR</p>
                                                        <ul className="space-y-1.5">
                                                            {sessionData.analysis?.steps?.map((st: string, i: number) => (
                                                                <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                                                    {st}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                                <button onClick={() => setShowDetails(false)} className="mt-6 text-xs transition-colors flex items-center gap-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    <ChevronUp className="w-3 h-3" /> Daha Az Göster
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setShowDetails(true)} className="flex items-center gap-1 text-xs font-bold transition-all hover:gap-2" style={{ color: 'var(--coral-500)' }}>
                                                <span>Detayları gör</span>
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Part 2: Status Update Section */}
                        <div className="space-y-8 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700"></div>
                                <h4 className="text-lg font-bold text-center px-4 leading-snug max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>{sessionData.analysis?.followup_question || "Kararının güncel durumu nedir?"}</h4>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700"></div>
                            </div>

                            {/* Options Grid (2x2) */}
                            <div className="flex flex-col gap-3 max-w-xl mx-auto">
                                {/* Option 1: Decided */}
                                <button
                                    onClick={() => handleOutcomeSelect('decided')}
                                    className="group relative p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left hover:scale-[1.01]"
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        borderColor: 'var(--border-primary)',
                                    }}
                                >
                                    <div className="p-3 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 group-hover:bg-green-500/20 transition-colors">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-base mb-0.5" style={{ color: 'var(--text-primary)' }}>Karar Verildi</h5>
                                        <p className="text-xs sm:text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>Bir seçeneği seçtim, uygulamaya başladım.</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                                </button>

                                {/* Option 2: Thinking */}
                                <button
                                    onClick={() => handleOutcomeSelect('thinking')}
                                    className="group relative p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left hover:scale-[1.01]"
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        borderColor: 'var(--border-primary)',
                                    }}
                                >
                                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                                        <Hourglass className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-base mb-0.5" style={{ color: 'var(--text-primary)' }}>Hala Düşünüyorum</h5>
                                        <p className="text-xs sm:text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>Henüz karar vermedim, düşünüyorum.</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                                </button>

                                {/* Option 3: Cancelled/Gave Up (Renamed from Other) */}
                                <button
                                    onClick={() => handleOutcomeSelect('cancelled')}
                                    className="group relative p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left hover:scale-[1.01]"
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        borderColor: 'var(--border-primary)',
                                    }}
                                >
                                    <div className="p-3 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 group-hover:bg-slate-500/20 transition-colors">
                                        <XCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-base mb-0.5" style={{ color: 'var(--text-primary)' }}>Vazgeçildi</h5>
                                        <p className="text-xs sm:text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>Artık bu kararı vermeme gerek kalmadı.</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                                </button>

                            </div>
                        </div>


                        {/* Locked Content Placeholder (Transparent) */}
                        <div className="pt-8 pb-4 text-center space-y-3">
                            <div
                                className="mx-auto w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'var(--bg-secondary)' }}
                            >
                                <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <div>
                                <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Benzer Kararlar ve Deneyimler</h4>
                                <p className="text-sm max-w-sm mx-auto leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    Topluluktaki diğer kullanıcıların bu kararla ilgili istatistiklerini ve yorumlarını görmek için yukarıdaki durumu güncelle.
                                </p>
                            </div>
                        </div>
                    </div>

                )}

                {/* Step 2b: Returning User (Has Previous Outcomes) */}
                {step === 'returning-user' && sessionData && lastOutcome && (
                    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in text-left">
                        {/* Page Header */}
                        {/* Page Header */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Merhaba 🙌</h2>
                            <span className="font-mono px-2 py-0.5 rounded text-xs" style={{ color: '#2b8cee', backgroundColor: 'rgba(43, 140, 238, 0.1)' }}>
                                #{sessionData.code}
                            </span>
                        </div>

                        {/* Part 1: Reflection Card (Hero) */}
                        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ border: '1px solid var(--return-card-border)' }}>
                            {/* Question Section (Top) */}
                            <div className="p-6 sm:p-8" style={{ backgroundColor: 'var(--return-card-top)' }}>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 text-[10px] font-bold uppercase tracking-wide leading-none" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--accent-500)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="mt-[1px]">
                                        {(() => {
                                            const created = new Date(sessionData.created_at);
                                            const now = new Date();
                                            const diffTime = Math.abs(now.getTime() - created.getTime());
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            return diffDays <= 1 ? 'BUGÜN SORDUN' : `${diffDays} GÜN ÖNCE SORDUN`;
                                        })()}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: 'var(--return-card-text-top)' }}>
                                    "{sessionData.user_question}"
                                </h3>
                            </div>

                            {/* AI Analysis Summary (Bottom) */}
                            <div className="p-6 sm:p-8 relative overflow-hidden" style={{ backgroundColor: 'var(--return-card-bottom)', borderTop: '1px solid var(--return-card-border)' }}>
                                {/* Background Decorative Icon */}
                                <div className="absolute -bottom-6 -right-6 opacity-[0.03] pointer-events-none">
                                    <span className="material-symbols-outlined !text-[12rem]" style={{ color: 'var(--text-primary)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                </div>

                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-4" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        naapim AI Önerisi
                                    </div>
                                    <p className="leading-relaxed text-base sm:text-lg font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                                        {sessionData.analysis?.recommendation || "Analiz yüklenemedi."}
                                    </p>

                                    {/* Collapsible Details */}
                                    <div className="mt-4">
                                        {showDetails ? (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="my-4 h-px bg-[var(--border-secondary)] opacity-30" />
                                                <div className="flex flex-col gap-6 text-left">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>NEDEN?</p>
                                                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                            {sessionData.analysis?.reasoning}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>ADIMLAR</p>
                                                        <ul className="space-y-1.5">
                                                            {sessionData.analysis?.steps?.map((st: string, i: number) => (
                                                                <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                                                    {st}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                                <button onClick={() => setShowDetails(false)} className="mt-6 text-xs transition-colors flex items-center gap-1 font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    <ChevronUp className="w-3 h-3" /> Daha Az Göster
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setShowDetails(true)} className="flex items-center gap-1 text-xs font-bold transition-all hover:gap-2" style={{ color: 'var(--coral-500)' }}>
                                                <span>Detayları gör</span>
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Part 2: Current Status Card */}
                        <div className="space-y-6 pt-4">
                            {/* Section Header */}
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Karar Durumunuz</h3>
                            </div>

                            {/* Current Status Card */}
                            <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                {/* Status Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl ${lastOutcome?.outcome_type === 'decided' ? 'bg-green-500/10' :
                                        lastOutcome?.outcome_type === 'thinking' ? 'bg-amber-500/10' :
                                            'bg-slate-500/10'
                                        }`}>
                                        {lastOutcome?.outcome_type === 'decided' && <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-500" />}
                                        {lastOutcome?.outcome_type === 'thinking' && <Hourglass className="w-7 h-7 text-amber-600 dark:text-amber-500" />}
                                        {lastOutcome?.outcome_type === 'cancelled' && <XCircle className="w-7 h-7 text-slate-600 dark:text-slate-400" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                            {lastOutcome?.outcome_type === 'decided' && 'Karar Verildi'}
                                            {lastOutcome?.outcome_type === 'thinking' && 'Hala Düşünüyorum'}
                                            {lastOutcome?.outcome_type === 'cancelled' && 'Vazgeçildi'}
                                        </h4>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {lastOutcome?.outcome_type === 'decided' && 'Bir seçeneği seçtim, uygulamaya başladım.'}
                                            {lastOutcome?.outcome_type === 'thinking' && 'Karar verme süreci devam ediyor.'}
                                            {lastOutcome?.outcome_type === 'cancelled' && 'Bu kararı vermeme gerek kalmadı.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Last Comment Quote */}
                                {lastOutcome?.outcome_text && (
                                    <div className="mb-4">
                                        <blockquote className="pl-4 py-2 text-base italic leading-relaxed" style={{
                                            borderLeftWidth: '4px',
                                            borderLeftColor: 'var(--coral-primary)',
                                            color: 'var(--text-primary)'
                                        }}>
                                            "{lastOutcome.outcome_text}"
                                        </blockquote>
                                    </div>
                                )}

                                {/* Last Update Time */}
                                {lastOutcome?.created_at && (
                                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                        <Calendar className="w-4 h-4" />
                                        <span>Son güncelleme: {new Date(lastOutcome.created_at).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                )}
                            </div>

                            {/* Process History Timeline */}
                            {sessionData.previous_outcomes && sessionData.previous_outcomes.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                        Süreç Geçmişi
                                    </h4>
                                    <div className="space-y-3">
                                        {sessionData.previous_outcomes.map((outcome, index) => (
                                            <div key={outcome.id || index} className="flex items-start gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${index === 0 ? 'bg-[var(--coral-primary)]' : 'bg-slate-400 dark:bg-slate-600'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {outcome.outcome_type === 'decided' && 'Durum güncellendi: Karar Verildi'}
                                                        {outcome.outcome_type === 'thinking' && 'Durum güncellendi: Hala Düşünüyorum'}
                                                        {outcome.outcome_type === 'cancelled' && 'Durum güncellendi: Vazgeçildi'}
                                                    </p>
                                                    {outcome.outcome_text && (
                                                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                                            Not eklendi: "{outcome.outcome_text.substring(0, 50)}{outcome.outcome_text.length > 50 ? '...' : ''}"
                                                        </p>
                                                    )}
                                                    {outcome.created_at && (
                                                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                            {new Date(outcome.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {/* Session Creation */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-slate-400 dark:bg-slate-600" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Karar oluşturuldu</p>
                                                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                                    Soru: {sessionData.user_question?.substring(0, 40)}{sessionData.user_question?.length > 40 ? '...' : ''}
                                                </p>
                                                {sessionData.created_at && (
                                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                        {new Date(sessionData.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Update Button */}
                            <button
                                onClick={() => setStep('choose-outcome')}
                                className="w-full py-4 px-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{
                                    backgroundColor: 'var(--btn-primary-bg)',
                                    color: 'var(--btn-primary-text)'
                                }}
                            >
                                <Check className="w-5 h-5" />
                                Kararımı Güncelle
                            </button>
                            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                Yeni bir gelişme mi var? Durumu değiştir veya not ekle.
                            </p>
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
                                    Kararını güncelle
                                </h1>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Yeni durumunu seç veya mevcut durumda kal.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 max-w-xl mx-auto">
                                {/* Option 1: Decided */}
                                <button
                                    onClick={() => lastOutcomeType !== 'decided' && handleOutcomeSelect('decided')}
                                    disabled={lastOutcomeType === 'decided'}
                                    className={`group relative p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left ${lastOutcomeType === 'decided'
                                            ? 'opacity-60 cursor-not-allowed'
                                            : 'hover:scale-[1.01]'
                                        }`}
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        borderColor: lastOutcomeType === 'decided' ? 'var(--coral-500)' : 'var(--border-primary)',
                                    }}
                                >
                                    <div className="p-3 rounded-full bg-green-500/10 text-green-600 dark:text-green-500">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h5 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Karar Verildi</h5>
                                            {lastOutcomeType === 'decided' && (
                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--coral-primary)] text-white">
                                                    Mevcut
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>Bir seçeneği seçtim, uygulamaya başladım.</p>
                                    </div>
                                    {lastOutcomeType !== 'decided' && (
                                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                                    )}
                                </button>

                                {/* Option 2: Thinking */}
                                <button
                                    onClick={() => lastOutcomeType !== 'thinking' && handleOutcomeSelect('thinking')}
                                    disabled={lastOutcomeType === 'thinking'}
                                    className={`group relative p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left ${lastOutcomeType === 'thinking'
                                            ? 'opacity-60 cursor-not-allowed'
                                            : 'hover:scale-[1.01]'
                                        }`}
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        borderColor: lastOutcomeType === 'thinking' ? 'var(--coral-500)' : 'var(--border-primary)',
                                    }}
                                >
                                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500">
                                        <Hourglass className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h5 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Hala Düşünüyorum</h5>
                                            {lastOutcomeType === 'thinking' && (
                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--coral-primary)] text-white">
                                                    Mevcut
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>Henüz karar vermedim, düşünüyorum.</p>
                                    </div>
                                    {lastOutcomeType !== 'thinking' && (
                                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                                    )}
                                </button>

                                {/* Option 3: Cancelled/Gave Up */}
                                <button
                                    onClick={() => lastOutcomeType !== 'cancelled' && handleOutcomeSelect('cancelled')}
                                    disabled={lastOutcomeType === 'cancelled'}
                                    className={`group relative p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 text-left ${lastOutcomeType === 'cancelled'
                                            ? 'opacity-60 cursor-not-allowed'
                                            : 'hover:scale-[1.01]'
                                        }`}
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        borderColor: lastOutcomeType === 'cancelled' ? 'var(--coral-500)' : 'var(--border-primary)',
                                    }}
                                >
                                    <div className="p-3 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400">
                                        <XCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h5 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Vazgeçildi</h5>
                                            {lastOutcomeType === 'cancelled' && (
                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--coral-primary)] text-white">
                                                    Mevcut
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>Artık bu kararı vermeme gerek kalmadı.</p>
                                    </div>
                                    {lastOutcomeType !== 'cancelled' && (
                                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                                    )}
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
                                    onClick={() => {
                                        if (sessionData?.previous_outcomes && sessionData.previous_outcomes.length > 0) {
                                            setStep('returning-user');
                                        } else {
                                            setStep('welcome-back');
                                        }
                                    }}
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
                    <div className="relative w-full max-w-3xl mx-auto animate-in fade-in duration-700">

                        <div className="text-center mb-8 space-y-4 md:space-y-6">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                                Deneyimini Paylaş
                            </h1>
                            <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>
                                Kısaca ne olduğunu anlat. Hikayen, başkalarının yolunu aydınlatabilir ve ilham kaynağı olabilir.
                            </p>

                            {feeling && (
                                <div className="flex justify-center pt-2">
                                    <div
                                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full shadow-sm border transition-all hover:scale-105"
                                        style={{
                                            backgroundColor: 'var(--bg-elevated)',
                                            borderColor: 'var(--border-secondary)'
                                        }}
                                    >
                                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Hissedilen:</span>
                                        <span className="flex items-center text-sm font-semibold" style={{ color: '#6366f1' }}> {/* Indigo-500-like color */}
                                            <span className="text-base mr-1.5">{feelingOptions.find(f => f.type === feeling)?.emoji}</span>
                                            {feelingOptions.find(f => f.type === feeling)?.label}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative mb-8">
                            <textarea
                                value={outcomeText}
                                onChange={(e) => { setOutcomeText(e.target.value); setModerationError(null); }}
                                disabled={isModerating || loading}
                                className="w-full h-72 p-6 md:p-8 border-0 rounded-3xl text-lg md:text-xl leading-relaxed resize-none transition-all duration-300 focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
                                style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    color: 'var(--text-primary)',
                                    opacity: (isModerating || loading) ? 0.7 : 1
                                }}
                                placeholder="Ne karar verdin? Ne oldu? Nasıl hissettin?"
                            />
                            <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 pointer-events-none opacity-40" style={{ color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>edit_note</span>
                            </div>
                        </div>

                        <div className="max-w-xl mx-auto w-full space-y-5">
                            {/* AI Moderation Note */}
                            <div
                                className="flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-xl border text-center transition-colors"
                                style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.04)',
                                    borderColor: 'rgba(59, 130, 246, 0.15)',

                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm" style={{ color: '#3b82f6', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>Moderasyon naapim AI tarafından yapılmaktadır</span>
                                </div>
                                <span className="text-[10px] sm:text-xs opacity-75 leading-snug max-w-md" style={{ color: 'var(--text-secondary)' }}>
                                    Uygunsuz veya iletişim bilgisi içeren paylaşımlar onaylanmayacaktır.<br className="hidden sm:block" />
                                    Daha akıcı bir okuma deneyimi için dilbilgisi ve yazıma müdahale edilebilir.
                                </span>
                            </div>

                            {moderationError && (
                                <div className="p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200 dark:bg-red-900/10 dark:border-red-800/30 text-left animate-in slide-in-from-top-1">
                                    <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                                    <div>
                                        <p className="font-medium text-sm text-red-700 dark:text-red-400">Topluluk kurallarına uymuyor</p>
                                        <p className="text-sm mt-1 text-red-600 dark:text-red-300">{moderationError}</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleShare}
                                disabled={isModerating || loading}
                                className="w-full text-white text-lg font-medium py-5 px-8 rounded-2xl shadow-xl transform transition-all duration-300 flex items-center justify-center group ring-1 ring-white/10 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:scale-[0.99]"
                                style={{
                                    backgroundColor: '#18181b', // Primary dark
                                    // Dark mode note: user theme has primary as #18181b, but in dark mode button should probably be white or accent. 
                                    // Let's stick to a solid impactful color.
                                }}
                            >
                                {isModerating ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span key={moderationMessageIndex} className="animate-in fade-in duration-300 font-normal opacity-90">{moderationMessages[moderationMessageIndex]}</span>
                                    </div>
                                ) : loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="font-normal opacity-90">Kaydediliyor...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Paylaş ve Ortak Deneyimleri Gör</span>
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {!isModerating && !loading && (
                                <button
                                    onClick={() => setStep('ask-feeling')}
                                    className="w-full flex items-center justify-center transition-colors duration-200 font-medium py-2 text-sm hover:text-[var(--text-primary)]"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <ArrowRight className="mr-1 w-4 h-4 rotate-180" />
                                    Geri
                                </button>
                            )}
                        </div>
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
        </div >
    );
};

export default ReturnFlow;

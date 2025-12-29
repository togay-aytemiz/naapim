import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FollowUpSection } from '../components/FollowUpSection';
import { RecoveryCode } from '../components/RecoveryCode';
import { NaapimMetre } from '../components/NaapimMetre';
import { ComparisonRanking } from '../components/ComparisonRanking';
import { AnalysisService, type AnalysisResult } from '../services/analysis';
import { saveAnalysis } from '../services/saveAnalysis';
import { submitSession } from '../services/session';
import { Sparkles, Users, ShoppingBag, Utensils, Calendar, Plane, Film, Gift, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper types
// type AnalysisStatus = 'loading' | 'analyzing' | 'complete' | 'error';

// @ts-ignore
// import archetypesData from '../../config/registry/archetypes.json';

export const ResultPage = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Load archetypes
    // const archetypes: Archetype[] = (archetypesData as any).archetypes;

    // Session data - initialized from route state, but can be updated from DB fetch
    const [sessionUserInput, setSessionUserInput] = useState<string | undefined>(location.state?.userInput);
    const [sessionAnswers, setSessionAnswers] = useState<Record<string, string> | undefined>(location.state?.answers);
    const [sessionArchetypeId, setSessionArchetypeId] = useState<string | undefined>(location.state?.archetypeId);
    const sessionId = location.state?.sessionId as string | undefined;
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [showRecoveryCode, setShowRecoveryCode] = useState(false);
    const [seededOutcomes, setSeededOutcomes] = useState<any[]>([]);
    const [isLoadingSeeds, setIsLoadingSeeds] = useState(true);
    const [showFullAnalysis, setShowFullAnalysis] = useState(false);

    // Track unlock email data for downstream components - persist to localStorage
    const [unlockEmail, setUnlockEmail] = useState<string | null>(() => {
        if (code) {
            const saved = localStorage.getItem(`unlock_${code}`);
            if (saved) {
                try {
                    return JSON.parse(saved).email || null;
                } catch { return null; }
            }
        }
        return null;
    });
    const [unlockReminderTime, setUnlockReminderTime] = useState<'tomorrow' | '1_week' | '2_weeks'>(() => {
        if (code) {
            const saved = localStorage.getItem(`unlock_${code}`);
            if (saved) {
                try {
                    return JSON.parse(saved).reminderTime || '1_week';
                } catch { return '1_week'; }
            }
        }
        return '1_week';
    });

    // Prevent double API call in React StrictMode
    const hasCalledAnalysis = React.useRef(false);

    // Simplified loading completion
    const finishLoading = React.useCallback(() => {
        // Just stop loading, the UI will update sequentially
        setIsLoading(false);
    }, []);

    // Ref for smooth height animation
    const analysisContentRef = React.useRef<HTMLDivElement>(null);


    useEffect(() => {
        // Guard against double execution (React StrictMode in dev)
        if (hasCalledAnalysis.current) return;

        const performParallelWork = async () => {
            // Case 1: Viewing existing session (code exists and is NOT 'creating')
            // ALWAYS fetch from DB - even if state exists (could be stale on refresh)
            if (code && code !== 'creating') {
                hasCalledAnalysis.current = true;
                setIsLoading(true);

                try {
                    const { fetchAnalysisByCode } = await import('../services/fetchAnalysis');
                    const result = await fetchAnalysisByCode(code);

                    if (result && result.analysis) {
                        setAnalysis(result.analysis as AnalysisResult);
                        // Populate session data from DB for seeded outcomes
                        if (result.user_question) setSessionUserInput(result.user_question);
                        if (result.archetype_id) setSessionArchetypeId(result.archetype_id);
                        if (result.answers) setSessionAnswers(result.answers);
                    } else {
                        console.error('No analysis found in DB for code:', code);
                    }
                } catch (error) {
                    console.error('Error fetching saved analysis:', error);
                    setIsLoading(false); // fast fail on error
                } finally {
                    if (hasCalledAnalysis.current) finishLoading();
                }
            }
            // Case 2: Creating new session (code IS 'creating')
            else if (code === 'creating' && sessionUserInput && sessionAnswers && sessionArchetypeId) {
                hasCalledAnalysis.current = true;
                setIsLoading(true);

                // Start Analysis Generation
                const analysisPromise = AnalysisService.generateAnalysis(sessionUserInput, sessionAnswers, sessionArchetypeId);

                // Start Session Creation
                const sessionPromise = submitSession({
                    user_question: sessionUserInput,
                    archetype_id: sessionArchetypeId,
                    answers: sessionAnswers,
                    decision_type: location.state?.decisionType || 'binary_decision'
                });

                try {
                    // Wait for both
                    const [analysisResult, sessionResult] = await Promise.all([
                        analysisPromise,
                        sessionPromise
                    ]);

                    setAnalysis(analysisResult);

                    const finalSessionId = sessionResult?.session_id;
                    const finalCode = sessionResult?.code;

                    // Update URL now that we have a real code
                    if (finalCode) {
                        navigate(`/result/${finalCode}`, {
                            replace: true,
                            state: { ...location.state, sessionId: finalSessionId }
                        });
                    }

                    // Save analysis to database
                    if (finalSessionId && finalCode) {
                        await saveAnalysis({
                            session_id: finalSessionId,
                            code: finalCode,
                            analysis: analysisResult
                        });
                    }
                } catch (error) {
                    console.error('Error generating result:', error);
                    setIsLoading(false);
                } finally {
                    // Success path uses transition
                    // Note: If error caught above, isLoading is already false, so this might prompt a transition if not careful.
                    // But finishLoading sets isLoading(false) again which is fine.
                    // To be safe, let's only transition if we have analysis or just run it.
                    finishLoading();
                }
            } else {
                // No valid code - stop loading immediately
                setIsLoading(false);
            }
        };
        performParallelWork();
    }, [code, sessionUserInput, sessionAnswers, sessionArchetypeId, sessionId, navigate, location.state]);

    // Separate effect for seeded outcomes - runs after main loading completes
    // User reads the analysis while this loads in background
    useEffect(() => {
        if (isLoading || !analysis || !sessionUserInput || !sessionArchetypeId) return;

        const loadSeededOutcomes = async () => {
            setIsLoadingSeeds(true);
            try {
                // Use readable context format for better LLM understanding
                const context = sessionArchetypeId && sessionAnswers
                    ? AnalysisService.getReadableContext(sessionArchetypeId, sessionAnswers)
                    : '';
                const decisionType = location.state?.decisionType || 'binary_decision';
                const outcomes = await AnalysisService.generateSeededOutcomes(sessionUserInput, sessionArchetypeId, context, code, decisionType);
                setSeededOutcomes(outcomes?.outcomes || []);
            } catch (err) {
                console.warn('Seeded outcomes error:', err);
            } finally {
                setIsLoadingSeeds(false);
            }
        };

        loadSeededOutcomes();
    }, [isLoading, analysis, sessionUserInput, sessionArchetypeId, sessionAnswers]);

    const handleReminderSet = (email: string, time: 'tomorrow' | '1_week' | '2_weeks') => {
        setUnlockEmail(email);
        setUnlockReminderTime(time);

        // Update local storage
        if (code) {
            localStorage.setItem(`unlock_${code}`, JSON.stringify({
                email,
                reminderTime: time,
                timestamp: Date.now()
            }));
        }
    };

    // Check for existing reminder in DB (for refresh scenarios)
    useEffect(() => {
        const checkExistingReminder = async () => {
            if (!code || !unlockEmail) return;

            try {
                const { data, error: dbError } = await supabase
                    .from('email_reminders')
                    .select('schedule_time')
                    .eq('code', code)
                    .eq('email', unlockEmail)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (dbError) throw dbError;

                if (data && data.schedule_time && data.schedule_time !== unlockReminderTime) {

                    setUnlockReminderTime(data.schedule_time as any);

                    // Update local storage too
                    localStorage.setItem(`unlock_${code}`, JSON.stringify({
                        email: unlockEmail,
                        reminderTime: data.schedule_time,
                        timestamp: Date.now()
                    }));
                }
            } catch (err) {
                console.error('Failed to sync reminder:', err);
            }
        };

        checkExistingReminder();
    }, [code, unlockEmail]); // Run when code or email is available

    // Unlock state for "Undecided" path (3 stories) - initialize from localStorage
    const [isStoriesUnlocked, setIsStoriesUnlocked] = useState(() => {
        if (code) {
            const saved = localStorage.getItem(`unlock_${code}`);
            return !!saved;
        }
        return false;
    });

    const handleUnlockStories = () => {
        setIsStoriesUnlocked(true);
        // Smooth scroll to community stories after unlock
        setTimeout(() => {
            document.getElementById('follow-up-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    // Rotating loading messages - more conversational for chat style
    const loadingMessages = [
        "Sorunu analiz ediyorum...",
        "Durumunu değerlendiriyorum...",
        "Öneriler hazırlıyorum...",
        "Detaylara bakıyorum...",
        "Neredeyse hazır..."
    ];

    const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);

    React.useEffect(() => {
        if (!isLoading) return;
        const interval = setInterval(() => {
            setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isLoading, loadingMessages.length]);

    // Trigger transition animation when loading ends - REMOVED (Handled in finishLoading)

    // Main Render
    // UI Layout:
    // 1. User Bubble (Top Right)
    // 2. AI Bubble (Top Left) - Loading or "Done"
    // 3. Analysis Card (Below AI Bubble) - Only when done
    return (
        <div className="flex flex-col items-center pb-16 pt-8">
            <div className="w-full max-w-lg space-y-8">
                {/* User's question - Chat bubble style (same as loaded state) */}
                {sessionUserInput && (
                    <div className="px-5 flex flex-col items-end gap-1 mb-6">
                        {/* Eyebrow */}
                        <span className="text-[10px] font-medium uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>
                            Düşündüğün konu
                        </span>
                        {/* User Bubble */}
                        <div
                            className="chat-bubble max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-md"
                            style={{
                                backgroundColor: 'var(--chat-bubble-bg, #E9EBF0)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                            }}
                        >
                            <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--chat-bubble-text, #1a1a1a)' }}>
                                {sessionUserInput}
                            </p>
                        </div>
                    </div>
                )}








                {/* AI Chat Bubble - Always visible (persists) */}
                <div className="px-5 mb-6">
                    {/* naapim eyebrow */}
                    <span className="text-xs font-medium tracking-wider ml-1 mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        naapim
                    </span>

                    {/* AI Bubble */}
                    <div className="ai-chat-bubble animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-[90%]">
                        <div className={`flex gap-3 ${isLoading ? 'items-start' : 'items-center'}`}>
                            {/* AI Icon - Only show when loading */}
                            {isLoading && (
                                <div
                                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                                    style={{
                                        background: 'linear-gradient(135deg, #FF6F61 0%, #FF8A50 100%)',
                                        transform: 'scale(1)'
                                    }}
                                >
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            )}

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className="text-sm md:text-base font-medium animate-in fade-in duration-300"
                                    style={{ color: 'var(--text-primary)' }}
                                    key={isLoading ? `loading-${loadingMessageIndex}` : 'done'}
                                >
                                    {isLoading ? (
                                        loadingMessages[loadingMessageIndex]
                                    ) : (
                                        <div className="flex flex-col gap-3 text-sm">
                                            {/* Line 1: AI Analysis */}
                                            <span style={{ color: 'var(--text-primary)' }}>
                                                ✨ AI analizin hazır! Sonuçları inceleyebilirsin <span className="text-base leading-none">↓</span>
                                            </span>

                                            {/* Line 2: Real Stories */}
                                            <span style={{ color: 'var(--text-primary)' }}>
                                                👥 <span className="font-semibold">Gerçek kişi hikayelerine</span> göz atmak için{' '}
                                                <span
                                                    role="button"
                                                    onClick={() => document.getElementById('follow-up-section')?.scrollIntoView({ behavior: 'smooth' })}
                                                    className="font-semibold underline decoration-dotted hover:decoration-solid cursor-pointer transition-all"
                                                    style={{ color: 'var(--coral-primary)' }}
                                                >
                                                    buraya tıkla.
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isLoading && (
                                    <div className="flex items-center gap-1.5 mt-3">
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analysis Result Section - Appears below bubble */}
                {!isLoading && (<>
                    <div className="px-5">
                        {/* Analysis Card */}
                        {analysis ? (
                            <div
                                className="rounded-3xl p-6 md:p-8 analysis-card-enter"
                                style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-secondary)',
                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
                                }}
                            >
                                {/* AI Badge */}
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                            color: 'var(--coral-primary)'
                                        }}
                                    >
                                        <Sparkles className="w-3.5 h-3.5" fill="currentColor" />
                                        <span>naapim AI</span>
                                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>Kişiselleştirilmiş Analiz</span>
                                    </span>
                                </div>

                                {/* Title */}
                                <h1
                                    className="text-2xl font-semibold text-center mb-4 max-w-[90%] mx-auto"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {analysis.title}
                                </h1>

                                {/* Naapim Metre - Only for binary decisions (show if no ranked_options) */}
                                {analysis.decision_score !== undefined && (!analysis.ranked_options || analysis.ranked_options.length === 0) && (
                                    <div className="mb-6">
                                        <NaapimMetre
                                            score={analysis.decision_score}
                                            label={analysis.score_label || 'Değerlendirme'}
                                            leftLabel={analysis.metre_left_label}
                                            rightLabel={analysis.metre_right_label}
                                            onScrollToStories={() => document.getElementById('follow-up-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        />
                                    </div>
                                )}

                                {/* Comparison Ranking - For comparison decisions with ranked_options */}
                                {analysis.ranked_options && analysis.ranked_options.length > 0 && (
                                    <div className="mb-6">
                                        <ComparisonRanking
                                            options={analysis.ranked_options}
                                            onScrollToStories={() => document.getElementById('follow-up-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        />
                                    </div>
                                )}

                                {/* Recommendation */}
                                {(() => {
                                    // Sentiment-based colors
                                    const sentimentStyles: Record<string, { bg: string; border: string; text: string }> = {
                                        positive: { bg: 'var(--emerald-50)', border: 'var(--emerald-300)', text: 'var(--emerald-700)' },
                                        cautious: { bg: 'var(--amber-50)', border: 'var(--amber-300)', text: 'var(--amber-700)' },
                                        warning: { bg: 'var(--orange-50)', border: 'var(--orange-300)', text: 'var(--orange-700)' },
                                        negative: { bg: 'var(--red-50)', border: 'var(--red-300)', text: 'var(--red-700)' },
                                        neutral: { bg: 'var(--neutral-100)', border: 'var(--neutral-300)', text: 'var(--neutral-700)' }
                                    };
                                    const style = sentimentStyles[analysis.sentiment] || sentimentStyles.neutral;
                                    return (
                                        <div
                                            className="p-4 rounded-xl mb-6"
                                            style={{
                                                backgroundColor: style.bg,
                                                border: `1px solid ${style.border}`
                                            }}
                                        >
                                            <p
                                                className="font-medium text-center"
                                                style={{ color: style.text }}
                                            >
                                                {analysis.recommendation}
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* Collapsible Analysis Details (NEDEN + ADIMLAR) */}
                                <div className="relative">
                                    {/* Content container with smooth height transition */}
                                    <div
                                        ref={analysisContentRef}
                                        className="transition-[height] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
                                        style={{
                                            height: showFullAnalysis
                                                ? (analysisContentRef.current ? `${analysisContentRef.current.scrollHeight}px` : 'auto')
                                                : '240px'
                                        }}
                                    >
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
                                                {analysis.reasoning}
                                            </p>
                                        </div>

                                        {/* Alternatives Section */}
                                        {analysis.alternatives && analysis.alternatives.length > 0 && (
                                            <div className="mb-6">
                                                <h3
                                                    className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    <Lightbulb className="w-4 h-4" />
                                                    DİĞER ALTERNATİFLER
                                                </h3>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {analysis.alternatives.map((alt, idx) => (
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

                                        {/* Specific Suggestions (Food / Product / Activity) */}
                                        {analysis.specific_suggestions && analysis.specific_suggestions.length > 0 && (
                                            <div className="mb-6">
                                                {(() => {
                                                    // Determine visual style based on suggestion type
                                                    let icon = <ShoppingBag className="w-4 h-4" />;
                                                    let title = "ÖNERİLENLER";

                                                    switch (analysis.suggestion_type) {
                                                        case 'food':
                                                            icon = <Utensils className="w-4 h-4" />;
                                                            title = "ÖNERİLEN LEZZETLER";
                                                            break;
                                                        case 'activity':
                                                            icon = <Calendar className="w-4 h-4" />;
                                                            title = "ÖNERİLEN AKTİVİTELER";
                                                            break;
                                                        case 'travel':
                                                            icon = <Plane className="w-4 h-4" />;
                                                            title = "ÖNERİLEN ROTALAR";
                                                            break;
                                                        case 'media':
                                                            icon = <Film className="w-4 h-4" />;
                                                            title = "ÖNERİLEN İÇERİKLER";
                                                            break;
                                                        case 'gift':
                                                            icon = <Gift className="w-4 h-4" />;
                                                            title = "HEDİYE FİKİRLERİ";
                                                            break;
                                                        case 'product':
                                                        default:
                                                            icon = <ShoppingBag className="w-4 h-4" />;
                                                            title = "ÖNERİLEN MODELLER";
                                                            break;
                                                    }

                                                    return (
                                                        <>
                                                            <h3
                                                                className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                                                                style={{ color: 'var(--text-muted)' }}
                                                            >
                                                                {icon}
                                                                {title}
                                                            </h3>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {analysis.specific_suggestions!.map((item, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="p-3 rounded-xl flex items-start gap-3 transition-colors hover:bg-neutral-50"
                                                                        style={{
                                                                            border: '1px solid var(--border-secondary)',
                                                                            backgroundColor: 'var(--bg-secondary)'
                                                                        }}
                                                                    >
                                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                                                                            <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-sm text-gray-900 leading-tight mb-1">
                                                                                {item.name}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 leading-normal">
                                                                                {item.description}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Pros & Cons Section */}
                                        {(analysis.pros?.length || analysis.cons?.length) && (
                                            <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Artılar */}
                                                {analysis.pros && analysis.pros.length > 0 && (
                                                    <div
                                                        className="p-4 rounded-xl"
                                                        style={{
                                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)'
                                                        }}
                                                    >
                                                        <h4
                                                            className="text-sm font-semibold uppercase tracking-wider mb-3"
                                                            style={{ color: 'var(--emerald-500)' }}
                                                        >
                                                            Artılar
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {analysis.pros.map((pro, idx) => (
                                                                <li key={idx} className="flex items-start gap-2">
                                                                    <span
                                                                        className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                                                                        style={{ backgroundColor: 'var(--emerald-500)' }}
                                                                    />
                                                                    <span
                                                                        className="text-sm"
                                                                        style={{ color: 'var(--text-secondary)' }}
                                                                    >
                                                                        {pro}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Eksiler */}
                                                {analysis.cons && analysis.cons.length > 0 && (
                                                    <div
                                                        className="p-4 rounded-xl"
                                                        style={{
                                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                                        }}
                                                    >
                                                        <h4
                                                            className="text-sm font-semibold uppercase tracking-wider mb-3"
                                                            style={{ color: 'var(--red-500)' }}
                                                        >
                                                            Eksiler
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {analysis.cons.map((con, idx) => (
                                                                <li key={idx} className="flex items-start gap-2">
                                                                    <span
                                                                        className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                                                                        style={{ backgroundColor: 'var(--red-500)' }}
                                                                    />
                                                                    <span
                                                                        className="text-sm"
                                                                        style={{ color: 'var(--text-secondary)' }}
                                                                    >
                                                                        {con}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Steps */}
                                        {analysis.steps && analysis.steps.length > 0 && (
                                            <div>
                                                <h3
                                                    className="text-sm font-semibold uppercase tracking-wider mb-3"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    ÖNERİLEN ADIMLAR
                                                </h3>
                                                <ul className="space-y-3">
                                                    {analysis.steps.map((step, idx) => (
                                                        <li key={idx} className="flex items-start gap-3">
                                                            <span
                                                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                                                                style={{
                                                                    backgroundColor: 'var(--accent-100)',
                                                                    color: 'var(--accent-600)'
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </span>
                                                            <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showFullAnalysis ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                    >
                                        {/* Gradient fade */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(to top, var(--bg-elevated) 0%, var(--bg-elevated) 20%, transparent 100%)'
                                            }}
                                        />
                                        {/* Button container - sits on top of gradient */}
                                        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 z-20">
                                            <button
                                                onClick={() => setShowFullAnalysis(true)}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 hover:shadow-md group animate-[subtleBounce_2s_ease-in-out_infinite]"
                                                style={{
                                                    backgroundColor: 'var(--bg-elevated)',
                                                    border: '1px solid var(--coral-primary)',
                                                    boxShadow: '0 2px 8px rgba(255, 111, 97, 0.15)'
                                                }}
                                            >
                                                <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" style={{ color: 'var(--coral-primary)' }} />
                                                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>naapim AI analizinin tamamını oku</span>
                                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>↓</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collapse button when expanded */}
                                    {showFullAnalysis && (
                                        <button
                                            onClick={() => setShowFullAnalysis(false)}
                                            className="w-full text-center text-[11px] pt-3 transition-all hover:opacity-70"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            Kapat ↑
                                        </button>
                                    )}
                                </div>

                            </div>
                        ) : (
                            <div
                                className="text-center py-10 rounded-xl"
                                style={{ backgroundColor: 'var(--bg-secondary)' }}
                            >
                                <p style={{ color: 'var(--text-muted)' }}>Analiz verilerine ulaşılamadı. (Sayfa yenilenmiş olabilir)</p>
                            </div>
                        )}


                        {/* Legal Disclaimer - Immediately after card, before community section */}
                        <p
                            className="text-xs text-center mt-2 mb-7 px-5"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            naapim AI hata yapabilir. Önemli kararlar için profesyonel danışmanlık alın.
                        </p>

                        {/* AYRICA Divider & Community Button - Outside card */}
                        {analysis && (
                            <div className="mt-6 mb-12 space-y-6">
                                {/* AYRICA Divider */}
                                <div className="relative flex items-center">
                                    <div className="flex-grow border-t border-gray-200 opacity-50"></div>
                                    <span className="flex-shrink-0 mx-4 text-[10px] font-bold tracking-widest text-gray-400 uppercase">AYRICA</span>
                                    <div className="flex-grow border-t border-gray-200 opacity-50"></div>
                                </div>

                                <button
                                    onClick={() => document.getElementById('follow-up-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full py-3.5 px-4  rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={{
                                        background: 'linear-gradient(135deg, #FF6F61 0%, #FF8A50 100%)',
                                        color: 'white',
                                        boxShadow: '0 4px 15px rgba(255, 111, 97, 0.3)'
                                    }}
                                >
                                    <Users className="w-4 h-4" />
                                    <span>Başkaları neler yapıyor?</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>




                    {/* FollowUp Section */}
                    <div className="mt-16">
                        <FollowUpSection
                            seededOutcomes={seededOutcomes}
                            isLoadingSeeds={isLoadingSeeds}
                            isUnlocked={isStoriesUnlocked}
                            onUnlock={handleUnlockStories}
                            onUnlockWithEmail={(email, time) => {
                                setUnlockEmail(email);
                                setUnlockReminderTime(time);
                                // Persist to localStorage for page refresh
                                if (code) {
                                    localStorage.setItem(`unlock_${code}`, JSON.stringify({ email, reminderTime: time }));
                                }
                            }}
                            onShareStory={() => setShowRecoveryCode(true)}
                            code={code}
                            userQuestion={sessionUserInput}
                            sessionId={sessionId}
                            followupQuestion={analysis?.followup_question}
                            unlockEmail={unlockEmail}
                            onEmailUpdate={(newEmail) => {
                                setUnlockEmail(newEmail);
                                // Update localStorage
                                if (code) {
                                    localStorage.setItem(`unlock_${code}`, JSON.stringify({
                                        email: newEmail,
                                        reminderTime: unlockReminderTime
                                    }));
                                }
                            }}
                        />
                    </div>

                    {
                        showRecoveryCode && (
                            <div className="-mt-4">
                                <RecoveryCode
                                    onReminderSet={handleReminderSet}
                                    initialCode={code}
                                    onStartInteraction={() => { }}
                                    userQuestion={sessionUserInput}
                                    seededOutcomes={seededOutcomes}
                                    followupQuestion={analysis?.followup_question}
                                    unlockEmail={unlockEmail}
                                />
                            </div>
                        )
                    }

                    {/* Start over button */}
                    <div className="text-center pt-8 px-5">
                        <button
                            onClick={handleBackToHome}
                            className="btn-text text-neutral-400 hover:text-neutral-600"
                        >
                            Yeni bir karar için baştan başla
                        </button>
                    </div>
                </>)}
            </div >
        </div >
    );
};

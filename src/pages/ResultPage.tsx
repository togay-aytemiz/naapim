
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FollowUpSection } from '../components/FollowUpSection';
import { RecoveryCode } from '../components/RecoveryCode';
import { ReminderOptIn } from '../components/ReminderOptIn';
import { AnalysisService, type AnalysisResult } from '../services/analysis';
import { saveAnalysis } from '../services/saveAnalysis';
import { submitSession } from '../services/session';
import { Sparkles } from 'lucide-react';


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
    const [reminderAlreadySet, setReminderAlreadySet] = useState(false);
    const [showReminderOptIn, setShowReminderOptIn] = useState(true);
    const [seededOutcomes, setSeededOutcomes] = useState<any[]>([]);
    const [isLoadingSeeds, setIsLoadingSeeds] = useState(true);
    const [showAllSteps, setShowAllSteps] = useState(false);

    // Prevent double API call in React StrictMode
    const hasCalledAnalysis = React.useRef(false);


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
                } finally {
                    setIsLoading(false);
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
                    answers: sessionAnswers
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
                } finally {
                    setIsLoading(false);
                }
            } else {
                // No valid code - stop loading
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
                const context = Object.entries(sessionAnswers || {}).map(([k, v]) => `${k}: ${v}`).join('; ');
                const outcomes = await AnalysisService.generateSeededOutcomes(sessionUserInput, sessionArchetypeId, context);
                setSeededOutcomes(outcomes?.outcomes || []);
            } catch (err) {
                console.warn('Seeded outcomes error:', err);
            } finally {
                setIsLoadingSeeds(false);
            }
        };

        loadSeededOutcomes();
    }, [isLoading, analysis, sessionUserInput, sessionArchetypeId, sessionAnswers]);

    const handleReminderSet = (_email: string) => {
        setReminderAlreadySet(true);
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    // Rotating loading messages
    const loadingMessages = [
        "Analiz ediliyor...",
        "Durumun değerlendiriliyor...",
        "Önerilen adımlar belirleniyor...",
        "Çıkarımlar yapılıyor...",
        "Plan hazırlanıyor...",
        "Son detaylar ekleniyor..."
    ];

    const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);

    React.useEffect(() => {
        if (!isLoading) return;
        const interval = setInterval(() => {
            setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isLoading, loadingMessages.length]);

    // Full-page loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
                <div className="text-center space-y-8 max-w-sm">
                    {/* Animated spinner */}
                    <div className="relative mx-auto w-16 h-16">
                        <div
                            className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                            style={{ borderColor: 'var(--border-secondary)', borderTopColor: 'var(--coral-primary)' }}
                        />
                        <div
                            className="absolute inset-2 rounded-full border-4 border-t-transparent animate-spin"
                            style={{ borderColor: 'var(--border-secondary)', borderTopColor: 'var(--charcoal-primary)', animationDirection: 'reverse', animationDuration: '1.5s' }}
                        />
                    </div>

                    {/* Rotating message */}
                    <div className="h-8 overflow-hidden">
                        <p
                            className="text-lg font-medium animate-in fade-in slide-in-from-bottom-2 duration-500"
                            style={{ color: 'var(--text-primary)' }}
                            key={loadingMessageIndex}
                        >
                            {loadingMessages[loadingMessageIndex]}
                        </p>
                    </div>

                    {/* User question reminder */}
                    {sessionUserInput && (
                        <div
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sorunu analiz ediyoruz:</p>
                            <p className="font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>"{sessionUserInput}"</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pb-16 pt-8">
            <div className="w-full max-w-lg space-y-12">
                {/* User's decision context */}
                {sessionUserInput && (
                    <div className="pt-4 text-center px-5">
                        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Düşündüğün konu</p>
                        <p className="font-medium text-lg" style={{ color: 'var(--text-primary)' }}>"{sessionUserInput}"</p>
                    </div>
                )}

                {/* Analysis Result Section */}
                <div className="px-5">
                    {analysis ? (
                        <div
                            className="rounded-2xl p-6 shadow-sm"
                            style={{
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--border-secondary)'
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
                                className="text-2xl font-semibold text-center mb-6"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {analysis.title}
                            </h1>

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

                            {/* Community Button - Accent Styled */}
                            <button
                                onClick={() => document.getElementById('follow-up-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="mb-6 w-full py-3.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                                style={{
                                    backgroundColor: 'var(--coral-primary)',
                                    color: 'white',
                                    boxShadow: '0 2px 12px rgba(255, 107, 107, 0.35)'
                                }}
                            >
                                <span>👥</span>
                                <span>Başkaları neler yapıyor? Öğren</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </button>

                            {/* Reasoning - Single bullet */}
                            <div className="mb-6">
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

                            {/* Collapsible Steps Section */}
                            <div className="mb-6">
                                <h3
                                    className="text-sm font-semibold uppercase tracking-wider mb-4"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    ÖNERİLEN ADIMLAR
                                </h3>

                                <div className="relative">
                                    <ul className="space-y-3">
                                        {analysis.steps.slice(0, showAllSteps ? 5 : 2).map((step, idx) => (
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

                                    {/* Gradient overlay when collapsed */}
                                    {!showAllSteps && analysis.steps.length > 2 && (
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(to top, var(--bg-elevated) 30%, transparent)'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Expand/Collapse Button */}
                                {analysis.steps.length > 2 && (
                                    <button
                                        onClick={() => setShowAllSteps(!showAllSteps)}
                                        className="mt-3 w-full py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                                        style={{
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--border-primary)'
                                        }}
                                    >
                                        {showAllSteps ? (
                                            <>
                                                <span>Kapat</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </>
                                        ) : (
                                            <>
                                                <span>📋</span>
                                                <span>Tüm adımları gör ({analysis.steps.length})</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Legal Disclaimer - Minimal */}
                            <p
                                className="text-xs text-center pt-2"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                naapim AI hata yapabilir. Önemli kararlar için profesyonel danışmanlık alın.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="text-center py-10 rounded-xl"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                            <p style={{ color: 'var(--text-muted)' }}>Analiz verilerine ulaşılamadı. (Sayfa yenilenmiş olabilir)</p>
                        </div>
                    )}
                </div>

                <div className="divider mx-5 opacity-50" />

                <FollowUpSection
                    seededOutcomes={seededOutcomes}
                    isLoadingSeeds={isLoadingSeeds}
                />

                <div className="divider mx-5 opacity-50" />

                <RecoveryCode
                    onReminderSet={handleReminderSet}
                    initialCode={code}
                    onStartInteraction={() => setShowReminderOptIn(false)}
                />

                {!reminderAlreadySet && showReminderOptIn && (
                    <>
                        <div className="divider mx-5 opacity-50" />
                        <ReminderOptIn />
                    </>
                )}

                {/* Start over button */}
                <div className="text-center pt-8 px-5">
                    <button
                        onClick={handleBackToHome}
                        className="btn-text text-neutral-400 hover:text-neutral-600"
                    >
                        Yeni bir karar için baştan başla
                    </button>
                </div>
            </div>
        </div >
    );
};

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RegistryLoader } from '../services/registryLoader';
import { ClassificationService } from '../services/classification';
import { QuestionSelectionService } from '../services/questionSelection';
// @ts-ignore
import registryData from '../../config/registry/archetypes.json';
import type { Archetype } from '../types/registry';

// Extracted components
import { LoadingScreen } from './questionFlow/LoadingScreen';
import { ClarificationScreen } from './questionFlow/ClarificationScreen';
import { BlockedTopicsScreen } from './questionFlow/BlockedTopicsScreen';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;


interface QuestionFlowProps {
    userInput?: string;
    archetypeId?: string;
    selectedFieldKeys?: string[]; // Optional: LLM-selected field keys
    onComplete: (answers: Record<string, string>, archetypeId: string, selectedFieldKeys?: string[], effectiveQuestion?: string) => void;
    onBack: () => void;
}

export const QuestionFlow: React.FC<QuestionFlowProps> = ({
    userInput,
    archetypeId: initialArchetypeId,
    selectedFieldKeys: initialSelectedFieldKeys,
    onComplete,
    onBack
}) => {
    // State for internal classification results
    const [archetypeId, setArchetypeId] = useState<string | undefined>(initialArchetypeId);
    const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[] | undefined>(initialSelectedFieldKeys);

    // Loading state - start loading if we have userInput but no archetype yet
    const [isLoading, setIsLoading] = useState<boolean>(!!userInput && !initialArchetypeId);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    // Clarification state for vague inputs
    const [needsClarification, setNeedsClarification] = useState(false);
    const [clarificationPrompt, setClarificationPrompt] = useState<string | null>(null);
    const [clarifiedInput, setClarifiedInput] = useState('');
    const [effectiveQuestion, setEffectiveQuestion] = useState<string>(userInput || '');

    // Track which userInput has been classified to prevent duplicates
    const classifiedInputRef = useRef<string | null>(null);

    useEffect(() => {
        // If we have an initial ID, ensure state matches (handle prop updates)
        if (initialArchetypeId) {
            setArchetypeId(initialArchetypeId);
            setSelectedFieldKeys(initialSelectedFieldKeys);
            setIsLoading(false);
        }
    }, [initialArchetypeId, initialSelectedFieldKeys]);

    useEffect(() => {
        // Guard: Skip if no userInput, already have archetype, or already classified this input
        if (!userInput || initialArchetypeId || classifiedInputRef.current === userInput) {
            return;
        }

        // Mark this input as being classified BEFORE async work
        classifiedInputRef.current = userInput;

        const classify = async () => {
            setIsLoading(true);
            setNeedsClarification(false);
            console.log('🔍 Starting classification for:', userInput);
            try {
                // Load archetypes for classification
                const archetypes = (registryData as { archetypes: Archetype[] }).archetypes;
                console.log('📋 Loaded archetypes:', archetypes.length);

                // Step 1: Classify
                console.log('🚀 Calling ClassificationService...');
                const classificationResult = await ClassificationService.classifyUserQuestion(userInput, archetypes);
                console.log('✅ Classification result:', classificationResult);

                // Check if clarification is needed
                if (classificationResult.needs_clarification) {
                    console.log('⚠️ Clarification needed:', classificationResult.clarification_prompt);
                    setNeedsClarification(true);
                    setClarificationPrompt(classificationResult.clarification_prompt || 'Lütfen kararınızı biraz daha açıklayın.');
                    setClarifiedInput(userInput); // Pre-fill with original input
                    setIsLoading(false);
                    return;
                }

                // Step 2: Select Questions
                console.log('🚀 Calling QuestionSelectionService...');
                const selectionResult = await QuestionSelectionService.selectQuestions(
                    userInput,
                    classificationResult.archetype_id
                );
                console.log('✅ Selection result:', selectionResult);

                console.log('📝 Setting state:', classificationResult.archetype_id, selectionResult.selectedFieldKeys);
                setArchetypeId(classificationResult.archetype_id);
                setSelectedFieldKeys(selectionResult.selectedFieldKeys);
            } catch (error) {
                console.error('❌ Classification failed:', error);
                // Fallback to default
                setArchetypeId('career_decisions');
            } finally {
                console.log('🏁 Done, setting isLoading to false');
                setIsLoading(false);
            }
        };

        classify();
    }, [userInput, initialArchetypeId]);

    // Rotating loading messages
    useEffect(() => {
        if (!isLoading) return;
        const messages = [
            "İhtiyaçların analiz ediliyor...",
            "Sana özel sorular hazırlanıyor...",
            "Konu başlıkları belirleniyor...",
            "En uygun sorular seçiliyor...",
            "Kişiselleştirilmiş akış oluşturuluyor...",
            "Neredeyse hazır..."
        ];
        const interval = setInterval(() => {
            setLoadingMessageIndex(prev => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isLoading]);

    // Load questions: use selectedFieldKeys if provided, otherwise fall back to archetype default
    const questions = useMemo(() => {
        if (!archetypeId) return [];

        if (selectedFieldKeys && selectedFieldKeys.length > 0) {
            return RegistryLoader.getQuestionsForFieldKeys(selectedFieldKeys);
        }
        return RegistryLoader.getQuestionsForArchetype(archetypeId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [archetypeId, JSON.stringify(selectedFieldKeys)]);

    const [currentIndex, setCurrentIndex] = useState(0);
    // Key is field_key, value is option_id
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Feedback tracking - field_key -> 'helpful' | 'not_helpful'
    const [questionFeedback, setQuestionFeedback] = useState<Record<string, 'helpful' | 'not_helpful'>>({});

    // Save feedback fire-and-forget
    const saveFeedback = useCallback((fieldKey: string, feedback: 'helpful' | 'not_helpful') => {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !archetypeId) return;

        setQuestionFeedback(prev => ({ ...prev, [fieldKey]: feedback }));

        // Fire and forget
        fetch(`${SUPABASE_URL}/functions/v1/save-question-feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                session_id: null, // Will be set after session created
                archetype_id: archetypeId,
                field_key: fieldKey,
                feedback
            })
        }).catch(err => console.warn('Feedback save error:', err));
    }, [archetypeId]);

    // Reset state if questions change (e.g. archetype changes)
    useEffect(() => {
        setCurrentIndex(0);
        setAnswers({});
        setSelectedOptionId(null);
    }, [questions]);

    // Scroll to top when question changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentIndex]);

    const currentQuestion = questions[currentIndex];
    const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

    const handleOptionSelect = useCallback((optionId: string) => {
        if (isTransitioning || !currentQuestion || !archetypeId) return;

        setSelectedOptionId(optionId);
        setIsTransitioning(true);

        setTimeout(() => {
            const newAnswers = { ...answers, [currentQuestion.id]: optionId };
            setAnswers(newAnswers);

            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setSelectedOptionId(null);
            } else {
                // Pass back valid archetypeId and keys
                onComplete(newAnswers, archetypeId, selectedFieldKeys, effectiveQuestion);
            }
            setIsTransitioning(false);
        }, 400); // Wait for animation
    }, [isTransitioning, currentQuestion, answers, currentIndex, questions.length, onComplete, archetypeId, selectedFieldKeys]);

    const handleBack = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            // Restore the previous answer if exists
            const prevQuestion = questions[prevIndex];
            if (prevQuestion && answers[prevQuestion.id]) {
                setSelectedOptionId(answers[prevQuestion.id]);
            } else {
                setSelectedOptionId(null);
            }
        } else {
            onBack();
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!currentQuestion || isTransitioning) return;
            const key = parseInt(e.key);
            if (key >= 1 && key <= currentQuestion.options.length) {
                handleOptionSelect(currentQuestion.options[key - 1].id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQuestion, isTransitioning, handleOptionSelect]);

    // Render Loading State
    if (isLoading) {
        return <LoadingScreen messageIndex={loadingMessageIndex} />;
    }


    // Clarification needed - elegant UI to ask for more details
    if (needsClarification) {
        const handleClarificationSubmit = () => {
            if (!clarifiedInput.trim()) return;
            // Reset classification state and re-classify with clarified input
            classifiedInputRef.current = null;
            setNeedsClarification(false);
            setIsLoading(true);
            const reclassify = async () => {
                try {
                    const archetypes = (registryData as { archetypes: Archetype[] }).archetypes;
                    const classificationResult = await ClassificationService.classifyUserQuestion(clarifiedInput.trim(), archetypes);

                    if (classificationResult.needs_clarification) {
                        setNeedsClarification(true);
                        setClarificationPrompt(classificationResult.clarification_prompt || 'Lütfen biraz daha detay verin.');
                        setIsLoading(false);
                        return;
                    }

                    const selectionResult = await QuestionSelectionService.selectQuestions(
                        clarifiedInput.trim(),
                        classificationResult.archetype_id
                    );
                    setEffectiveQuestion(clarifiedInput.trim());
                    setArchetypeId(classificationResult.archetype_id);
                    setSelectedFieldKeys(selectionResult.selectedFieldKeys);
                } catch (error) {
                    console.error('Reclassification failed:', error);
                    setArchetypeId('career_decisions');
                } finally {
                    setIsLoading(false);
                }
            };
            reclassify();
        };

        return (
            <ClarificationScreen
                clarificationPrompt={clarificationPrompt || 'Lütfen kararınızı biraz daha açıklayın.'}
                clarifiedInput={clarifiedInput}
                onInputChange={setClarifiedInput}
                onSubmit={handleClarificationSubmit}
                onBack={onBack}
            />
        );
    }

    // Blocked topics screen
    if (archetypeId === 'blocked_topics') {
        return <BlockedTopicsScreen onBack={onBack} />;
    }

    if (!currentQuestion) {
        return null; // Or generic error/loading
    }

    return (
        <div className="max-w-xl mx-auto px-5 py-6 w-full min-h-screen flex flex-col">
            {/* User's Question (original or clarified) */}
            {effectiveQuestion && (
                <div className="mb-4 text-center">
                    <p
                        className="text-sm italic"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        "{effectiveQuestion}"
                    </p>
                </div>
            )}

            {/* Header / Progress */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={handleBack}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div
                    className="h-1.5 flex-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--border-secondary)' }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundColor: 'var(--coral-primary)'
                        }}
                    />
                </div>
                <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    {currentIndex + 1}/{questions.length}
                </span>
            </div>

            {/* Question Card */}
            <div className="space-y-6 mt-8">
                <div className="text-center space-y-3">
                    {currentQuestion.categoryLabel && (
                        <span
                            className="text-xs font-bold uppercase tracking-[0.15em]"
                            style={{ color: 'var(--coral-primary)' }}
                        >
                            {currentQuestion.categoryLabel}
                        </span>
                    )}
                    <h2
                        className="text-2xl md:text-3xl font-bold leading-tight max-w-md mx-auto"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {currentQuestion.text}
                    </h2>
                </div>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={option.id}
                            onClick={() => handleOptionSelect(option.id)}
                            disabled={isTransitioning}
                            className={`
                                w-full flex items-center p-5 rounded-2xl border-2 
                                transition-all duration-300 ease-out
                                transform hover:scale-[1.01] active:scale-[0.99]
                                animate-in slide-in-from-bottom-4 fade-in
                            `}
                            style={{
                                animationDelay: `${index * 50}ms`,
                                animationFillMode: 'backwards',
                                borderColor: selectedOptionId === option.id
                                    ? 'var(--coral-primary)'
                                    : 'var(--border-secondary)',
                                backgroundColor: selectedOptionId === option.id
                                    ? 'rgba(255, 107, 107, 0.1)'
                                    : 'var(--surface-primary)',
                                color: selectedOptionId === option.id
                                    ? 'var(--coral-primary)'
                                    : 'var(--text-primary)',
                                boxShadow: selectedOptionId === option.id
                                    ? '0 0 0 1px var(--coral-primary)'
                                    : '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                        >
                            <span className="text-lg font-medium flex-1 text-left">
                                {option.label}
                            </span>
                            <span
                                className="ml-3 w-7 h-7 rounded-md flex items-center justify-center text-sm font-semibold"
                                style={{
                                    backgroundColor: 'var(--border-secondary)',
                                    color: 'var(--text-tertiary)'
                                }}
                            >
                                {index + 1}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Subtle Question Feedback */}
                <div className="flex items-center justify-center gap-3 md:gap-4 pt-4 mt-2">
                    <span
                        className="text-sm md:text-xs"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Bu soru yardımcı oldu mu?
                    </span>
                    <div className="flex gap-3 md:gap-2">
                        <button
                            onClick={() => saveFeedback(currentQuestion.id, 'helpful')}
                            className={`p-2 md:p-1.5 rounded-full transition-all duration-200 ${questionFeedback[currentQuestion.id] === 'helpful'
                                ? 'scale-110'
                                : 'opacity-40 hover:opacity-70'
                                }`}
                            style={{
                                color: questionFeedback[currentQuestion.id] === 'helpful'
                                    ? '#22c55e'  // Green for positive feedback
                                    : 'var(--text-muted)'
                            }}
                            title="Evet, yardımcı oldu"
                        >
                            <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => saveFeedback(currentQuestion.id, 'not_helpful')}
                            className={`p-2 md:p-1.5 rounded-full transition-all duration-200 ${questionFeedback[currentQuestion.id] === 'not_helpful'
                                ? 'scale-110'
                                : 'opacity-40 hover:opacity-70'
                                }`}
                            style={{
                                color: questionFeedback[currentQuestion.id] === 'not_helpful'
                                    ? 'var(--coral-primary)'
                                    : 'var(--text-muted)'
                            }}
                            title="Hayır, bu soru anlamsız"
                        >
                            <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

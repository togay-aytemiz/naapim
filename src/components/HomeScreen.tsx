import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, Users, Shield, Lightbulb, PenLine, MessagesSquare, X } from 'lucide-react';

interface HomeScreenProps {
    onContinue: (input: string) => void;
    onCodeEnter?: (code: string) => void;
    isLoading?: boolean;
}

// Full placeholder questions covering all 8 archetypes
const allPlaceholderQuestions = [
    // career_decisions
    "iş değiştirsem mi?",
    "terfi beklesem mi, başka yere mi geçsem?",
    // parenting_decisions
    "çocuğumu hangi okula göndersem?",
    "ikinci çocuğu düşünsem mi?",
    // relationship_decisions
    "bu ilişkiyi bitirsem mi?",
    "evlenme teklifi etsem mi?",
    // money_finance
    "yatırım yapsam mı?",
    "ev alsam mı, kirada mı kalsam?",
    // health_wellness
    "diyete başlasam mı?",
    "spor salonuna mı yazılsam?",
    // education_learning
    "yüksek lisans yapsam mı?",
    "yazılım kursuna başlasam mı?",
    // lifestyle_change
    "taşınsam mı?",
    "yurt dışında yaşamayı denesem mi?",
    // major_purchase
    "bu arabayı alsam mı?",
    "yeni telefon alsam mı?",
];

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Shuffle on initial load
const placeholderQuestions = shuffleArray(allPlaceholderQuestions);


// Smart active user count based on time of day
const getSmartActiveCount = (): number => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    let baseCount: number;
    let variance: number;

    if (hour >= 0 && hour < 6) {
        baseCount = 15 + Math.floor(hour * 3);
        variance = 8;
    } else if (hour >= 6 && hour < 9) {
        baseCount = 40 + Math.floor((hour - 6) * 20);
        variance = 15;
    } else if (hour >= 9 && hour < 12) {
        baseCount = 110 + Math.floor((hour - 9) * 15);
        variance = 25;
    } else if (hour >= 12 && hour < 14) {
        baseCount = 95 + Math.floor((hour - 12) * 10);
        variance = 20;
    } else if (hour >= 14 && hour < 18) {
        baseCount = 130 + Math.floor((hour - 14) * 5);
        variance = 30;
    } else if (hour >= 18 && hour < 22) {
        baseCount = 150 + Math.floor((hour - 18) * 10);
        variance = 35;
    } else {
        baseCount = 100 - Math.floor((hour - 22) * 25);
        variance = 20;
    }

    const minuteVariation = Math.sin(minute * 0.1) * (variance * 0.3);
    const randomVariation = (Math.random() - 0.5) * variance;

    return Math.max(12, Math.round(baseCount + minuteVariation + randomVariation));
};

// Code format validation - accepts 8-character alphanumeric codes
const isValidCode = (code: string): boolean => {
    const codeRegex = /^[A-Z0-9]{8}$/i;
    return codeRegex.test(code.trim());
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onContinue, onCodeEnter, isLoading = false }) => {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [showSocialProof, setShowSocialProof] = useState(false);
    const [activeCount, setActiveCount] = useState(0);
    const [targetCount] = useState(() => getSmartActiveCount());
    const [questionIndex, setQuestionIndex] = useState(0);
    const [displayedQuestion, setDisplayedQuestion] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [charIndex, setCharIndex] = useState(0);
    const [showCodeEntry, setShowCodeEntry] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync isDarkMode with document's dark class
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode(); // Check on mount

        // Observe changes to the dark class
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    checkDarkMode();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => observer.disconnect();
    }, []);

    const hasEnoughInput = input.trim().split(/\s+/).filter(w => w.length > 0).length >= 3;
    const isCodeValid = isValidCode(codeInput);

    // Smooth typing/deleting animation - only the question part changes
    useEffect(() => {
        if (input) return;

        const currentQuestion = placeholderQuestions[questionIndex];

        if (isTyping) {
            if (charIndex < currentQuestion.length) {
                const timer = setTimeout(() => {
                    setDisplayedQuestion(currentQuestion.slice(0, charIndex + 1));
                    setCharIndex(charIndex + 1);
                }, 55 + Math.random() * 15);
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => setIsTyping(false), 2200);
                return () => clearTimeout(timer);
            }
        } else {
            if (charIndex > 0) {
                const timer = setTimeout(() => {
                    setDisplayedQuestion(currentQuestion.slice(0, charIndex - 1));
                    setCharIndex(charIndex - 1);
                }, 25);
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    setQuestionIndex((prev) => (prev + 1) % placeholderQuestions.length);
                    setIsTyping(true);
                }, 200);
                return () => clearTimeout(timer);
            }
        }
    }, [input, charIndex, isTyping, questionIndex]);

    // Animate social proof
    useEffect(() => {
        const timer = setTimeout(() => setShowSocialProof(true), 800);
        return () => clearTimeout(timer);
    }, []);

    // Count up animation
    useEffect(() => {
        if (showSocialProof) {
            const duration = 1500;
            const steps = 30;
            const increment = targetCount / steps;
            let current = 0;

            const interval = setInterval(() => {
                current += increment;
                if (current >= targetCount) {
                    setActiveCount(targetCount);
                    clearInterval(interval);
                } else {
                    setActiveCount(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(interval);
        }
    }, [showSocialProof, targetCount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (hasEnoughInput && !isLoading) {
            onContinue(input);
        }
    };

    const handleCodeSubmit = () => {
        if (isCodeValid && onCodeEnter) {
            onCodeEnter(codeInput.toUpperCase());
        }
    };

    const handleCodeChange = (value: string) => {
        const formatted = value.toUpperCase().slice(0, 10);
        setCodeInput(formatted);
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    // Placeholder: "Acaba" stays, question types/deletes
    const fullPlaceholder = displayedQuestion ? `Acaba ${displayedQuestion}` : 'Acaba ';

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <header className="w-full flex items-center justify-between px-5 md:px-8 py-3 flex-shrink-0">
                <img
                    src={isDarkMode ? '/logo-beyaz.webp' : '/graphite-logo.webp'}
                    alt="Naapim"
                    className="h-7 md:h-8 w-auto"
                />

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-hover)' }}
                    aria-label="Tema değiştir"
                >
                    {isDarkMode ? (
                        <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center px-5">
                <div className="w-full max-w-lg">
                    {/* Hero text - simplified */}
                    <div className="text-center mb-6">
                        <h1 className={`text-2xl md:text-3xl font-semibold mb-2 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                            Karar vermekte zorlanıyor musun?
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            Senin gibi düşünen binlerce kişiden ilham al.
                        </p>
                    </div>

                    {/* Input section */}
                    <form onSubmit={handleSubmit}>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={input ? '' : fullPlaceholder}
                                className="input-field text-center pr-4"
                                style={{ paddingRight: hasEnoughInput ? '120px' : '1.5rem' }}
                                autoFocus
                            />

                            <button
                                type="submit"
                                className={`
                  absolute right-2 top-1/2 -translate-y-1/2
                  px-5 py-2.5 text-sm font-medium rounded-xl
                  transition-all duration-300 ease-out
                  ${hasEnoughInput || isLoading
                                        ? 'opacity-100 translate-x-0 pointer-events-auto'
                                        : 'opacity-0 translate-x-4 pointer-events-none'
                                    }
                `}
                                style={{
                                    backgroundColor: 'var(--btn-primary-bg)',
                                    color: 'var(--btn-primary-text)'
                                }}
                                disabled={!hasEnoughInput || isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Düşünüyor...</span>
                                    </div>
                                ) : (
                                    'Devam et'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Social proof + Value props - combined */}
                    <div
                        className={`mt-6 text-center transition-all duration-700 ${showSocialProof ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            <span className={`font-medium tabular-nums ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                {activeCount}
                            </span>{' '}
                            kişi şu an bir karar üzerinde düşünüyor
                        </p>

                        <div
                            onClick={() => setShowAIModal(true)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 text-xs font-medium rounded-full cursor-pointer transition-colors ${isDarkMode
                                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                        >
                            <Sparkles className="w-3 h-3" fill="currentColor" />
                            Nasıl çalışır?
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer - With iOS safe area for Safari URL bar */}
            <footer
                className="pb-4 md:pb-5 px-5 flex-shrink-0 relative bottom-8 md:bottom-0"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0))' }}
            >
                <div className="max-w-lg mx-auto text-center">
                    {!showCodeEntry ? (
                        <div className="space-y-1.5">
                            {/* Mobile: Navigate to /return, Desktop: Show inline code entry */}
                            <button
                                onClick={() => {
                                    // Check if mobile (< 768px)
                                    if (window.innerWidth < 768) {
                                        navigate('/return');
                                    } else {
                                        setShowCodeEntry(true);
                                    }
                                }}
                                className="text-sm underline underline-offset-2 transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Takip kodun mu var?
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in space-y-2">
                            <div className="flex gap-2 justify-center">
                                <input
                                    type="text"
                                    value={codeInput}
                                    onChange={(e) => handleCodeChange(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && isCodeValid) {
                                            handleCodeSubmit();
                                        }
                                    }}
                                    maxLength={8}
                                    placeholder="XXXXXXXX"
                                    className="w-36 px-3 py-2 rounded-xl text-center font-mono tracking-wider text-sm uppercase transition-colors"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <button
                                    onClick={handleCodeSubmit}
                                    disabled={!isCodeValid}
                                    className="px-5 py-2 rounded-xl font-medium text-sm transition-all duration-200"
                                    style={{
                                        backgroundColor: isCodeValid ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                                        color: isCodeValid ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                                        cursor: isCodeValid ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Git
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCodeEntry(false);
                                    setCodeInput('');
                                }}
                                className="text-xs transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Vazgeç
                            </button>
                        </div>
                    )}
                </div>
            </footer>

            {/* AI Info Modal */}
            {showAIModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-y-auto"
                    onClick={() => setShowAIModal(false)}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        style={{ animation: 'fadeIn 0.3s ease-out' }}
                    />

                    {/* Modal - slides up on mobile, scales on desktop */}
                    <div
                        className="relative w-full md:max-w-lg md:rounded-3xl rounded-t-3xl p-4 md:p-6 shadow-2xl md:my-4 max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
                        style={{
                            backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                            animation: 'scaleIn 0.3s ease-out',
                            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0))'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle for mobile */}
                        <div className="md:hidden flex justify-center mb-3">
                            <div
                                className="w-10 h-1 rounded-full"
                                style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }}
                            />
                        </div>

                        {/* Close button - hidden on mobile (use drag or backdrop) */}
                        <button
                            onClick={() => setShowAIModal(false)}
                            className="hidden md:flex absolute top-4 right-4 p-2 rounded-full transition-all duration-200 hover:scale-110"
                            style={{
                                color: 'var(--text-muted)',
                                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-6">
                            <div
                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'rgba(255, 111, 97, 0.15)' }}
                            >
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" style={{ color: 'var(--coral-primary)' }} />
                            </div>
                            <h2 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                                naapim AI neden farklı?
                            </h2>
                        </div>

                        {/* Feature Cards - More compact on mobile */}
                        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                            {/* Card 1: Personalized Analysis */}
                            <div
                                className="p-3 md:p-4 rounded-xl md:rounded-2xl"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                                    animation: 'fadeInUp 0.4s ease-out 0.1s backwards'
                                }}
                            >
                                <div className="flex items-start gap-2.5 md:gap-3">
                                    <div
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'rgba(255, 111, 97, 0.12)' }}
                                    >
                                        <Brain className="w-4 h-4" style={{ color: 'var(--coral-primary)' }} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-semibold text-[13px] md:text-sm mb-0.5 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                                            Kişiselleştirilmiş Analiz
                                        </h3>
                                        <p className={`text-xs md:text-sm leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Durumuna özel sorularla derinlemesine analiz
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Community Wisdom */}
                            <div
                                className="p-3 md:p-4 rounded-xl md:rounded-2xl"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                                    animation: 'fadeInUp 0.4s ease-out 0.15s backwards'
                                }}
                            >
                                <div className="flex items-start gap-2.5 md:gap-3">
                                    <div
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)' }}
                                    >
                                        <Users className="w-4 h-4" style={{ color: '#22c55e' }} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-semibold text-[13px] md:text-sm mb-0.5 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                                            Topluluk Bilgeliği
                                        </h3>
                                        <p className={`text-xs md:text-sm leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Benzer durumdaki insanların ne yaptığını gör
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Completely Anonymous */}
                            <div
                                className="p-3 md:p-4 rounded-xl md:rounded-2xl"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                                    animation: 'fadeInUp 0.4s ease-out 0.2s backwards'
                                }}
                            >
                                <div className="flex items-start gap-2.5 md:gap-3">
                                    <div
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'rgba(251, 191, 36, 0.12)' }}
                                    >
                                        <Shield className="w-4 h-4" style={{ color: '#fbbf24' }} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-semibold text-[13px] md:text-sm mb-0.5 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                                            Tamamen Anonim
                                        </h3>
                                        <p className={`text-xs md:text-sm leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Hesap yok, kimlik paylaşımı yok
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Actionable Insights */}
                            <div
                                className="p-3 md:p-4 rounded-xl md:rounded-2xl"
                                style={{
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                                    animation: 'fadeInUp 0.4s ease-out 0.25s backwards'
                                }}
                            >
                                <div className="flex items-start gap-2.5 md:gap-3">
                                    <div
                                        className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)' }}
                                    >
                                        <Lightbulb className="w-4 h-4" style={{ color: '#6366f1' }} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-semibold text-[13px] md:text-sm mb-0.5 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                                            Harekete Geçirebilir İçgörüler
                                        </h3>
                                        <p className={`text-xs md:text-sm leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Ne yapmalısın + neden'i açıklar
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* How it works - Compact horizontal on mobile */}
                        <div
                            className="pt-4 md:pt-4 border-t"
                            style={{
                                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                animation: 'fadeInUp 0.4s ease-out 0.3s backwards'
                            }}
                        >
                            <h3 className={`text-sm md:text-xs font-bold md:font-semibold uppercase tracking-wider mb-4 md:mb-3 ${isDarkMode ? 'text-neutral-300 md:text-neutral-300' : 'text-neutral-600 md:text-neutral-600'}`}>
                                Nasıl Çalışır?
                            </h3>

                            {/* Steps - Horizontal on mobile, vertical on desktop */}
                            <div className="flex md:flex-col gap-3 md:gap-0">
                                {/* Step 1 */}
                                <div className="flex-1 md:flex md:items-start md:gap-3">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)'
                                            }}
                                        >
                                            <PenLine className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </div>
                                        {/* Line - vertical on mobile, hidden connector on md */}
                                        <div className={`hidden md:block w-0.5 h-4 mt-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                                    </div>
                                    <div className="text-center md:text-left mt-1.5 md:mt-0 md:flex-1 md:pb-3">
                                        <p className={`text-[11px] md:text-sm font-medium ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            Yaz
                                        </p>
                                        <p className={`hidden md:block text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Kararını paylaş
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow on mobile */}
                                <div className="flex items-center md:hidden">
                                    <svg className="w-4 h-4" style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>

                                {/* Step 2 */}
                                <div className="flex-1 md:flex md:items-start md:gap-3">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)'
                                            }}
                                        >
                                            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </div>
                                        <div className={`hidden md:block w-0.5 h-4 mt-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                                    </div>
                                    <div className="text-center md:text-left mt-1.5 md:mt-0 md:flex-1 md:pb-3">
                                        <p className={`text-[11px] md:text-sm font-medium ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            Cevapla
                                        </p>
                                        <p className={`hidden md:block text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            AI'ın senin için özel seçtiği sorulara cevap ver
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow on mobile */}
                                <div className="flex items-center md:hidden">
                                    <svg className="w-4 h-4" style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>

                                {/* Step 3 */}
                                <div className="flex-1 md:flex md:items-start md:gap-3">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: 'rgba(255, 111, 97, 0.15)',
                                                color: 'var(--coral-primary)'
                                            }}
                                        >
                                            <MessagesSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left mt-1.5 md:mt-0 md:flex-1">
                                        <p className={`text-[11px] md:text-sm font-medium ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            Keşfet
                                        </p>
                                        <p className={`hidden md:block text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Seninle aynı karar zorluğu çeken insanların hikayelerini gör. Dilersen sen de onlara ilham ol.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={() => setShowAIModal(false)}
                            className="w-full mt-4 md:mt-6 py-3 md:py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                backgroundColor: 'var(--coral-primary)',
                                boxShadow: '0 4px 20px rgba(255, 111, 97, 0.3)',
                                animation: 'fadeInUp 0.4s ease-out 0.35s backwards'
                            }}
                        >
                            Anladım, Başlayalım!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { AIInfoModal } from './shared/AIInfoModal';

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

// Random headline variations
const headlineVariations = [
    "Karar vermekte zorlanıyor musun?",
    "Aklında bir soru mu var?",
    "Bir konuda kararsız mısın?",
    "Kafanı kurcalayan bir şey mi var?",
    "Bir şeye karar veremiyor musun?",
];
const randomHeadline = headlineVariations[Math.floor(Math.random() * headlineVariations.length)];


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
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
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
                        <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                            {randomHeadline}
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
            <AIInfoModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
        </div>
    );
};


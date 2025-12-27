import React, { useState, useEffect, useRef } from 'react';
import { AIInfoModal } from './shared/AIInfoModal';

interface HomeScreenProps {
    onContinue: (input: string) => void;
    onCodeEnter?: (code: string) => void;
    isLoading?: boolean;
}

// Full placeholder questions covering all 8 archetypes
const allPlaceholderQuestions = [
    "iş değiştirsem mi?",
    "terfi beklesem mi, başka yere mi geçsem?",
    "çocuğumu hangi okula göndersem?",
    "ikinci çocuğu düşünsem mi?",
    "bu ilişkiyi bitirsem mi?",
    "evlenme teklifi etsem mi?",
    "yatırım yapsam mı?",
    "ev alsam mı, kirada mı kalsam?",
    "diyete başlasam mı?",
    "spor salonuna mı yazılsam?",
    "yüksek lisans yapsam mı?",
    "yazılım kursuna başlasam mı?",
    "taşınsam mı?",
    "yurt dışında yaşamayı denesem mi?",
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

const mainHeadlines = [
    "Karar vermekte zorlanıyor musun?",
    "Ne yapacağını bilmiyor musun?",
    "Bir türlü emin olamıyor musun?",
    "Aklın karışık, seçenekler fazla mı?",
    "Karar aşamasında takılıp kaldın mı?"
];

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

export const HomeScreen: React.FC<HomeScreenProps> = ({ onContinue }) => {
    const [input, setInput] = useState('');
    const [activeCount, setActiveCount] = useState(0);
    const [targetCount] = useState(() => getSmartActiveCount());
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [textareaHeight, setTextareaHeight] = useState(56);

    // Auto-resize textarea with smooth transition
    const adjustTextareaHeight = () => {
        const textarea = inputRef.current;
        if (textarea) {
            // Create a hidden clone to measure scrollHeight with same width
            const clone = textarea.cloneNode(true) as HTMLTextAreaElement;
            clone.style.height = 'auto';
            clone.style.width = `${textarea.offsetWidth}px`; // Match original width
            clone.style.position = 'absolute';
            clone.style.visibility = 'hidden';
            clone.style.pointerEvents = 'none';
            clone.style.left = '-9999px';
            document.body.appendChild(clone);

            const lineHeight = 28;
            const maxLines = 5;
            const maxHeight = lineHeight * maxLines;
            const newHeight = Math.min(clone.scrollHeight, maxHeight);
            const finalHeight = Math.max(56, newHeight);

            document.body.removeChild(clone);
            setTextareaHeight(finalHeight);
        }
    };

    // Typewriter effect state
    const [questionIndex, setQuestionIndex] = useState(0);
    const [displayedQuestion, setDisplayedQuestion] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [charIndex, setCharIndex] = useState(0);

    // Sync isDarkMode with document's dark class
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode(); // Check on mount
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') checkDarkMode();
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // Count up animation
    useEffect(() => {
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
    }, [targetCount]);

    // Smooth typing/deleting animation
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

    // Ensure auto-focus works on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Random headline
    const [headline, setHeadline] = useState(mainHeadlines[0]);

    useEffect(() => {
        setHeadline(mainHeadlines[Math.floor(Math.random() * mainHeadlines.length)]);
    }, []);

    const handleContinueClick = async () => {
        if (!input.trim()) return;
        onContinue(input);
    };



    const fullPlaceholder = displayedQuestion ? `Acaba ${displayedQuestion}` : 'Acaba ';

    return (
        <div
            className={`relative flex min-h-screen w-full flex-col overflow-hidden font-['Manrope'] selection:bg-blue-200 selection:text-blue-900 ${isDarkMode
                ? 'text-white'
                : 'text-slate-900'
                }`}
            style={{
                background: isDarkMode
                    ? 'radial-gradient(ellipse at top right, #042458ff 0%, #050b26ff 50%, #431e1eff 100%)'
                    : 'radial-gradient(ellipse at top left, #faeaacff 0%, #f8fafc 50%, #a7cdfbff 100%)'
            }}
        >
            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center w-full px-4 relative z-10 scale-90 md:scale-100 transition-transform duration-500">
                <div className="w-full max-w-4xl flex flex-col items-center gap-10 text-center">

                    <div className="flex flex-col gap-6 max-w-3xl">
                        {/* Headline - appears first */}
                        <h1
                            className={`text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.1s_forwards] ${isDarkMode ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}
                        >
                            {headline}
                        </h1>
                        {/* Description - appears second */}
                        <h2
                            className={`text-lg md:text-xl lg:text-2xl font-medium leading-relaxed max-w-2xl mx-auto opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.3s_forwards] ${isDarkMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}
                        >
                            Sadece bir yapay zekaya sormadan, aynı ikilemi yaşamış <span
                                className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                                style={{
                                    backgroundImage: isDarkMode
                                        ? 'linear-gradient(to top, rgba(255, 111, 97, 0.25) 0%, rgba(255, 111, 97, 0.25) 20%, transparent 20%)'
                                        : 'linear-gradient(to top, rgba(255, 111, 97, 0.3) 0%, rgba(255, 111, 97, 0.3) 20%, transparent 20%)',
                                    paddingBottom: '2px'
                                }}
                            >gerçek insanlarla bağlantı kur.</span>
                        </h2>
                    </div>

                    <div className="w-full max-w-2xl flex flex-col gap-6 z-10">
                        {/* Search Bar Container - appears third */}
                        <label
                            className={`group relative flex w-full items-start p-2 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.5s_forwards] ${isDarkMode
                                ? 'bg-[#0f172a]/60 border border-[#334155]/50 shadow-black/20 hover:shadow-black/30 hover:bg-[#0f172a]/80 focus-within:ring-4 focus-within:ring-[#1e3a8a]/50 focus-within:border-[#3b82f6]/50'
                                : 'bg-white shadow-blue-900/5 hover:shadow-blue-900/10'
                                }`}
                        >
                            <div className={`hidden sm:flex pl-4 pt-4 items-center justify-center pointer-events-none ${isDarkMode ? 'text-[#64748b]' : 'text-slate-400'}`}>
                                <span className="material-symbols-outlined text-2xl">search</span>
                            </div>
                            <textarea
                                ref={inputRef}
                                className={`flex-1 max-h-[140px] rounded-xl border-0 bg-transparent pl-4 py-4 leading-7 ${input.trim().length >= 20 ? 'pr-16 sm:pr-40' : 'pr-4'} focus:ring-0 outline-none text-lg md:text-xl resize-none overflow-y-auto scrollbar-hide ${isDarkMode
                                    ? 'text-white placeholder:text-[#64748b]'
                                    : 'text-slate-900 placeholder:text-slate-400'
                                    }`}
                                style={{ height: `${textareaHeight}px`, transition: 'height 0.2s ease-out', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                placeholder={input ? '' : fullPlaceholder}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    adjustTextareaHeight();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleContinueClick();
                                    }
                                }}
                                rows={1}
                                autoFocus
                            />
                            {/* Continue Button - inside input, animated */}
                            <div
                                className="absolute right-2"
                                style={{
                                    top: '50%',
                                    opacity: input.trim().length >= 20 ? 1 : 0,
                                    transform: input.trim().length >= 20 ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(20px)',
                                    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                                    pointerEvents: input.trim().length >= 20 ? 'auto' : 'none'
                                }}
                            >
                                <button
                                    onClick={handleContinueClick}
                                    className="flex items-center justify-center gap-2 w-12 h-12 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 bg-black text-white rounded-full sm:rounded-xl hover:bg-neutral-800 hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold text-sm md:text-base"
                                >
                                    <span className="hidden sm:inline">Devam Et</span>
                                    <span className="material-symbols-outlined text-xl sm:text-sm font-bold">arrow_forward</span>
                                </button>
                            </div>
                        </label>

                        {/* Online count & How it works - appears last */}
                        <div className="flex flex-col items-center gap-3 opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.9s_forwards]">
                            <div className={`flex items-center gap-2 text-sm md:text-base font-medium ${isDarkMode ? 'text-neutral-400' : 'text-slate-600/80'}`}>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <p>{activeCount} kişi şu an bir karar üzerinde düşünüyor</p>
                            </div>

                            <button
                                onClick={() => setShowAIModal(true)}
                                className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-semibold transition-all cursor-pointer shadow-sm backdrop-blur-sm ${isDarkMode
                                    ? 'bg-white/10 border-white/20 text-neutral-300 hover:bg-white/20 hover:text-[var(--coral-primary)]'
                                    : 'bg-white/40 border-white/60 text-slate-600 hover:bg-white hover:text-[var(--coral-primary)]'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                Nasıl çalışır?
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-6 absolute bottom-0">
                {/* Privacy & Terms removed as requested */}
            </footer>

            <AIInfoModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
        </div>
    );
};

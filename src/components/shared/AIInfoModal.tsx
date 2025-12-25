import React, { useState, useEffect } from 'react';
import { X, Sparkles, Brain, Users, Shield, Lightbulb, PenLine, MessagesSquare } from 'lucide-react';

interface AIInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal explaining how the AI-powered decision helper works
 */
export const AIInfoModal: React.FC<AIInfoModalProps> = ({ isOpen, onClose }) => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        }
    }, [isOpen]);

    // ESC key to close on desktop
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && shouldRender && !isClosing) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shouldRender, isClosing]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShouldRender(false);
            onClose();
        }, 280); // Match animation duration
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-hidden ${isClosing ? 'modal-backdrop-closing' : 'modal-backdrop-opening'}`}
            onClick={handleClose}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-md ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            />

            {/* Modal - slides up on mobile, scales on desktop */}
            <div
                className={`relative w-full md:max-w-xl md:rounded-3xl rounded-t-3xl p-5 md:p-8 shadow-2xl md:my-4 max-h-[95vh] md:max-h-[90vh] overflow-y-auto ${isClosing ? 'modal-sheet-closing' : 'modal-sheet'}`}
                style={{
                    backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                    paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0))'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle for mobile */}
                <div className="md:hidden flex justify-center mb-4">
                    <div
                        className="w-10 h-1 rounded-full"
                        style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }}
                    />
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="hidden md:flex absolute top-5 right-5 p-2 rounded-full transition-all duration-200 hover:scale-110"
                    style={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* === NASIL ÇALIŞIR SECTION === */}
                <div style={{ animation: 'fadeInUp 0.4s ease-out 0.05s backwards' }}>
                    <h2 className={`text-xl md:text-2xl font-bold text-center mb-6 md:mb-8 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                        Nasıl Çalışır?
                    </h2>

                    {/* Steps - Horizontal on mobile, vertical timeline on desktop */}
                    <div className="relative">
                        {/* Desktop timeline connector line */}
                        <div
                            className="hidden md:block absolute left-[27px] top-[40px] bottom-[40px] w-0.5"
                            style={{ backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)' }}
                        />

                        {/* Mobile horizontal layout */}
                        <div className="flex md:hidden items-start justify-between gap-2 mb-6">
                            <StepCardMobile
                                step={1}
                                icon={<PenLine className="w-5 h-5" />}
                                title="Yaz"
                                description="Kararını paylaş"
                                color="#6366f1"
                                isDarkMode={isDarkMode}
                            />
                            <div className="flex items-center pt-8">
                                <svg className="w-4 h-4" style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <StepCardMobile
                                step={2}
                                icon={<Sparkles className="w-5 h-5" />}
                                title="Cevapla"
                                description="AI sorularına yanıt ver"
                                color="#f59e0b"
                                isDarkMode={isDarkMode}
                            />
                            <div className="flex items-center pt-8">
                                <svg className="w-4 h-4" style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <StepCardMobile
                                step={3}
                                icon={<MessagesSquare className="w-5 h-5" />}
                                title="Keşfet"
                                description="Hikayeleri gör"
                                color="#10b981"
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        {/* Desktop vertical timeline */}
                        <div className="hidden md:flex flex-col gap-3 mb-8">
                            <StepCardDesktop
                                step={1}
                                icon={<PenLine className="w-5 h-5" />}
                                title="Kararını Yaz"
                                description="Karşılaştığın ikilemi veya kararını bizimle paylaş. AI'ın durumu anlamasının ilk adımı."
                                color="#6366f1"
                                isDarkMode={isDarkMode}
                            />
                            <StepCardDesktop
                                step={2}
                                icon={<Sparkles className="w-5 h-5" />}
                                title="AI Sorularını Cevapla"
                                description="AI sana özelleştirilmiş sorular soracak. Cevapların analizin derinliğini artırır."
                                color="#f59e0b"
                                isDarkMode={isDarkMode}
                            />
                            <StepCardDesktop
                                step={3}
                                icon={<MessagesSquare className="w-5 h-5" />}
                                title="Hikayeleri Keşfet"
                                description="Benzer kararlar alan insanların deneyimlerini gör. Yeni perspektifler kazan."
                                color="#10b981"
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </div>
                </div>

                {/* === NEDEN FARKLI SECTION === */}
                <div
                    className="pt-5 md:pt-6 border-t"
                    style={{
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        animation: 'fadeInUp 0.4s ease-out 0.2s backwards'
                    }}
                >
                    <div className="flex items-center justify-center gap-2 mb-4 md:mb-5">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255, 111, 97, 0.12)' }}
                        >
                            <Sparkles className="w-4 h-4" fill="currentColor" style={{ color: 'var(--coral-primary)' }} />
                        </div>
                        <h3 className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                            naapim AI neden farklı?
                        </h3>
                    </div>

                    {/* Feature Grid - 1 column on mobile, 2x2 on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                        <FeatureCard
                            icon={<Brain className="w-4 h-4" style={{ color: 'var(--coral-primary)' }} />}
                            iconBg="rgba(255, 111, 97, 0.12)"
                            title="Kişiselleştirilmiş Analiz"
                            description="Durumuna özel derinlemesine analiz"
                            isDarkMode={isDarkMode}
                        />
                        <FeatureCard
                            icon={<Users className="w-4 h-4" style={{ color: '#22c55e' }} />}
                            iconBg="rgba(34, 197, 94, 0.12)"
                            title="Topluluk Bilgeliği"
                            description="Benzer durumdaki insanların çözümlerini gör"
                            isDarkMode={isDarkMode}
                        />
                        <FeatureCard
                            icon={<Shield className="w-4 h-4" style={{ color: '#fbbf24' }} />}
                            iconBg="rgba(251, 191, 36, 0.12)"
                            title="Tamamen Anonim"
                            description="Hesap yok, kimlik paylaşımı yok"
                            isDarkMode={isDarkMode}
                        />
                        <FeatureCard
                            icon={<Lightbulb className="w-4 h-4" style={{ color: '#6366f1' }} />}
                            iconBg="rgba(99, 102, 241, 0.12)"
                            title="Harekete Geçirir"
                            description="Ne yapmalısın ve nedenini açıklar"
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleClose}
                    className="w-full mt-5 md:mt-7 py-3.5 md:py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: 'var(--coral-primary)',
                        boxShadow: '0 4px 20px rgba(255, 111, 97, 0.35)',
                        animation: 'fadeInUp 0.4s ease-out 0.35s backwards'
                    }}
                >
                    Anladım, Başlayalım!
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// === SUB-COMPONENTS ===

// Mobile Step Card - Compact horizontal version
interface StepCardMobileProps {
    step: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    isDarkMode: boolean;
}

const StepCardMobile: React.FC<StepCardMobileProps> = ({ step, icon, title, description, color, isDarkMode }) => (
    <div className="flex-1 flex flex-col items-center text-center">
        <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
            style={{
                backgroundColor: `${color}15`,
                color: color
            }}
        >
            {icon}
            <div
                className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}
            >
                {step}
            </div>
        </div>
        <p className={`text-sm font-semibold mb-0.5 ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>
            {title}
        </p>
        <p className={`text-xs leading-tight ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {description}
        </p>
    </div>
);

// Desktop Step Card - Horizontal timeline version
interface StepCardDesktopProps {
    step: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    isDarkMode: boolean;
}

const StepCardDesktop: React.FC<StepCardDesktopProps> = ({ step, icon, title, description, color, isDarkMode }) => (
    <div className="flex items-start gap-4">
        {/* Icon wrapper with solid background to cover the timeline line */}
        <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
                backgroundColor: isDarkMode ? 'rgba(23, 23, 23, 1)' : 'rgba(255, 255, 255, 1)',
                padding: '2px'
            }}
        >
            <div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{
                    backgroundColor: `${color}15`,
                    color: color
                }}
            >
                {icon}
            </div>
            <div
                className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: color }}
            >
                {step}
            </div>
        </div>
        <div className="flex-1 pt-1">
            <h4 className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                {title}
            </h4>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {description}
            </p>
        </div>
    </div>
);

// Feature Card for the "Why Different" section
interface FeatureCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    isDarkMode: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, iconBg, title, description, isDarkMode }) => (
    <div
        className="p-3 md:p-4 rounded-xl"
        style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`
        }}
    >
        <div className="flex items-start gap-3">
            <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: iconBg }}
            >
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <h4 className={`font-semibold text-[13px] md:text-sm mb-0.5 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                    {title}
                </h4>
                <p className={`text-xs leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {description}
                </p>
            </div>
        </div>
    </div>
);

export default AIInfoModal;

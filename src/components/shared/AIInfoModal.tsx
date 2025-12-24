import React from 'react';
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

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-y-auto"
            onClick={onClose}
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
                    onClick={onClose}
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

                {/* Feature Cards */}
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                    <FeatureCard
                        icon={<Brain className="w-4 h-4" style={{ color: 'var(--coral-primary)' }} />}
                        iconBg="rgba(255, 111, 97, 0.12)"
                        title="Kişiselleştirilmiş Analiz"
                        description="Durumuna özel sorularla derinlemesine analiz"
                        animationDelay="0.1s"
                        isDarkMode={isDarkMode}
                    />
                    <FeatureCard
                        icon={<Users className="w-4 h-4" style={{ color: '#22c55e' }} />}
                        iconBg="rgba(34, 197, 94, 0.12)"
                        title="Topluluk Bilgeliği"
                        description="Benzer durumdaki insanların ne yaptığını gör"
                        animationDelay="0.15s"
                        isDarkMode={isDarkMode}
                    />
                    <FeatureCard
                        icon={<Shield className="w-4 h-4" style={{ color: '#fbbf24' }} />}
                        iconBg="rgba(251, 191, 36, 0.12)"
                        title="Tamamen Anonim"
                        description="Hesap yok, kimlik paylaşımı yok"
                        animationDelay="0.2s"
                        isDarkMode={isDarkMode}
                    />
                    <FeatureCard
                        icon={<Lightbulb className="w-4 h-4" style={{ color: '#6366f1' }} />}
                        iconBg="rgba(99, 102, 241, 0.12)"
                        title="Harekete Geçirebilir İçgörüler"
                        description="Ne yapmalısın + neden'i açıklar"
                        animationDelay="0.25s"
                        isDarkMode={isDarkMode}
                    />
                </div>

                {/* How it works section */}
                <HowItWorks isDarkMode={isDarkMode} />

                {/* CTA Button */}
                <button
                    onClick={onClose}
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
    );
};

// Sub-components
interface FeatureCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    animationDelay: string;
    isDarkMode: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, iconBg, title, description, animationDelay, isDarkMode }) => (
    <div
        className="p-3 md:p-4 rounded-xl md:rounded-2xl"
        style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
            animation: `fadeInUp 0.4s ease-out ${animationDelay} backwards`
        }}
    >
        <div className="flex items-start gap-2.5 md:gap-3">
            <div
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: iconBg }}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <h3 className={`font-semibold text-[13px] md:text-sm mb-0.5 ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>
                    {title}
                </h3>
                <p className={`text-xs md:text-sm leading-snug ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {description}
                </p>
            </div>
        </div>
    </div>
);

const HowItWorks: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div
        className="pt-4 md:pt-4 border-t"
        style={{
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            animation: 'fadeInUp 0.4s ease-out 0.3s backwards'
        }}
    >
        <h3 className={`text-sm md:text-xs font-bold md:font-semibold uppercase tracking-wider mb-4 md:mb-3 ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
            Nasıl Çalışır?
        </h3>

        <div className="flex md:flex-col gap-3 md:gap-0">
            <Step
                icon={<PenLine className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                label="Yaz"
                description="Kararını paylaş"
                isDarkMode={isDarkMode}
                showConnector
            />
            <StepArrow isDarkMode={isDarkMode} />
            <Step
                icon={<Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                label="Cevapla"
                description="AI'ın senin için özel seçtiği sorulara cevap ver"
                isDarkMode={isDarkMode}
                showConnector
            />
            <StepArrow isDarkMode={isDarkMode} />
            <Step
                icon={<MessagesSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                label="Keşfet"
                description="Seninle aynı karar zorluğu çeken insanların hikayelerini gör"
                isDarkMode={isDarkMode}
                isPrimary
            />
        </div>
    </div>
);

interface StepProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    isDarkMode: boolean;
    showConnector?: boolean;
    isPrimary?: boolean;
}

const Step: React.FC<StepProps> = ({ icon, label, description, isDarkMode, showConnector, isPrimary }) => (
    <div className="flex-1 md:flex md:items-start md:gap-3">
        <div className="flex flex-col items-center">
            <div
                className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                style={{
                    backgroundColor: isPrimary ? 'rgba(255, 111, 97, 0.15)' : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                    color: isPrimary ? 'var(--coral-primary)' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)')
                }}
            >
                {icon}
            </div>
            {showConnector && (
                <div className={`hidden md:block w-0.5 h-4 mt-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
            )}
        </div>
        <div className="text-center md:text-left mt-1.5 md:mt-0 md:flex-1 md:pb-3">
            <p className={`text-[11px] md:text-sm font-medium ${isDarkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>
                {label}
            </p>
            <p className={`hidden md:block text-xs ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {description}
            </p>
        </div>
    </div>
);

const StepArrow: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <div className="flex items-center md:hidden">
        <svg
            className="w-4 h-4"
            style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    </div>
);

export default AIInfoModal;

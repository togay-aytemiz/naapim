import React, { useState, useEffect } from 'react';
import { X, Sparkles, Users, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'naapim_onboarding_seen';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isClosing, setIsClosing] = useState(false);

    // Check localStorage on mount
    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen) {
            onClose();
        }
    }, []);

    const handleComplete = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 280);
    };

    const handleNext = () => {
        if (currentStep < 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className={`relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl ${isClosing ? 'modal-sheet-closing' : 'modal-sheet'}`}
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-secondary)',
                    maxHeight: '90vh'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleComplete}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--bg-secondary)] z-20 transition-colors"
                    aria-label="Kapat"
                >
                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>

                {/* Sliding Content Container */}
                <div className="overflow-hidden">
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentStep * 100}%)` }}
                    >
                        {/* ========== Step 1: AI Analysis ========== */}
                        <div className="w-full flex-shrink-0 p-6 md:p-8">
                            {/* Step Badge */}
                            <div className="flex items-center gap-2 mb-4">
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255, 111, 97, 0.15) 0%, rgba(255, 138, 80, 0.15) 100%)',
                                        color: 'var(--coral-primary)'
                                    }}
                                >
                                    <Sparkles className="w-3 h-3" />
                                    ADIM 1
                                </span>
                            </div>

                            {/* Title */}
                            <h2
                                className="text-2xl md:text-3xl font-bold mb-3"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Karar Yolculuğuna<br />Hoş Geldin!
                            </h2>

                            {/* Description */}
                            <p
                                className="text-sm md:text-base mb-6 leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                naapim AI, kararlarını anlamana ve en doğru yolu bulmana yardımcı olur.
                            </p>

                            {/* AI Preview Card */}
                            <div
                                className="rounded-2xl overflow-hidden shadow-lg relative"
                                style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-secondary)'
                                }}
                            >
                                <div className="p-4 pb-16">
                                    {/* naapim AI Badge */}
                                    <div className="flex items-center justify-center gap-1.5 mb-3">
                                        <span
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                                color: 'var(--coral-primary)'
                                            }}
                                        >
                                            <Sparkles className="w-3 h-3" fill="currentColor" />
                                            naapim AI
                                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>Kişiselleştirilmiş Analiz</span>
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3
                                        className="text-center text-base font-semibold mb-4"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        İş Teklifini Kabul Etmelisin, Ama Aceleci Olma
                                    </h3>

                                    {/* Mini Timing Meter */}
                                    <div className="mb-4">
                                        <div className="flex justify-center mb-1.5">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-white shadow-sm">
                                                3 Hafta
                                            </span>
                                        </div>
                                        <div
                                            className="h-2 rounded-full relative shadow-inner"
                                            style={{
                                                background: 'linear-gradient(90deg, #22c55e 0%, #84cc16 30%, #eab308 50%, #f97316 70%, #ef4444 100%)'
                                            }}
                                        >
                                            <div
                                                className="absolute w-4 h-4 rounded-full bg-white border-2 border-amber-500 -top-1 shadow-md"
                                                style={{ left: '50%', transform: 'translateX(-50%)' }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1.5 px-1">
                                            <span className="text-[9px] font-medium" style={{ color: 'var(--emerald-600)' }}>HEMEN</span>
                                            <span className="text-[9px] font-medium" style={{ color: 'var(--red-500)' }}>BEKLE</span>
                                        </div>
                                    </div>

                                    {/* Recommendation Box */}
                                    <div
                                        className="p-3 rounded-xl text-center mb-4"
                                        style={{
                                            backgroundColor: 'var(--emerald-50)',
                                            border: '1px solid var(--emerald-300)'
                                        }}
                                    >
                                        <p className="text-xs font-medium" style={{ color: 'var(--emerald-700)' }}>
                                            Biraz beklemen önerilir
                                        </p>
                                    </div>

                                    {/* Pros/Cons Preview */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--emerald-600)' }}>Artıları</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="h-2 rounded" style={{ backgroundColor: 'var(--border-secondary)', width: '100%' }} />
                                                <div className="h-2 rounded" style={{ backgroundColor: 'var(--border-secondary)', width: '80%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--red-500)' }}>Eksileri</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="h-2 rounded" style={{ backgroundColor: 'var(--border-secondary)', width: '90%' }} />
                                                <div className="h-2 rounded" style={{ backgroundColor: 'var(--border-secondary)', width: '70%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* More skeleton lines */}
                                    <div className="space-y-2">
                                        <div className="h-2 rounded" style={{ backgroundColor: 'var(--border-secondary)', width: '100%' }} />
                                        <div className="h-2 rounded" style={{ backgroundColor: 'var(--border-secondary)', width: '85%' }} />
                                    </div>
                                </div>

                                {/* Bottom gradient fade */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(to top, var(--bg-elevated) 0%, var(--bg-elevated) 30%, transparent 100%)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* ========== Step 2: Community Stories ========== */}
                        <div
                            className="w-full flex-shrink-0 p-6 md:p-8"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                            {/* Step Badge */}
                            <div className="flex items-center gap-2 mb-4">
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                                        color: '#3b82f6'
                                    }}
                                >
                                    <Users className="w-3 h-3" />
                                    ADIM 2
                                </span>
                            </div>

                            {/* Title */}
                            <h2
                                className="text-2xl md:text-3xl font-bold mb-3"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Gerçek Hikayelerle<br />Bağlantı Kur
                            </h2>

                            {/* Description */}
                            <p
                                className="text-sm md:text-base mb-5 leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Benzer durumları yaşamış insanların deneyimlerinden ilham al.
                            </p>

                            {/* Story Cards Preview */}
                            <div className="space-y-3">
                                {/* Story Card 1 - Career Decision */}
                                <div
                                    className="p-4 rounded-2xl"
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-secondary)'
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                            style={{
                                                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                                                color: 'var(--emerald-600)'
                                            }}
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Karar verdi</span>
                                        </div>
                                        <span className="text-base">😊</span>
                                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mutlu</span>
                                    </div>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                        İş teklifini kabul ettim ve çok memnunum. Maaş düşük görünüyordu ama kariyer fırsatları harika çıktı...
                                    </p>
                                </div>

                                {/* Story Card 2 - Relationship */}
                                <div
                                    className="p-4 rounded-2xl"
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-secondary)'
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                            style={{
                                                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                                color: 'var(--amber-600)'
                                            }}
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Düşünüyor</span>
                                        </div>
                                        <span className="text-base">🤔</span>
                                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Kararsız</span>
                                    </div>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                        Uzun mesafeli ilişkimiz için şehir değiştirmeyi düşünüyorum ama işimi bırakmak zor...
                                    </p>
                                </div>

                                {/* Story Card 3 */}
                                <div
                                    className="p-4 rounded-2xl"
                                    style={{
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-secondary)'
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                            style={{
                                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                color: 'var(--red-500)'
                                            }}
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span>Vazgeçti</span>
                                        </div>
                                        <span className="text-base">😌</span>
                                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rahatlamış</span>
                                    </div>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                        Evlilik teklifi için çok erken olduğunu anladım. Bir yıl daha bekleyeceğiz...
                                    </p>
                                </div>
                            </div>

                            {/* Subtle slogan */}
                            <p
                                className="text-center text-xs mt-4 italic"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                ✨ ve binlerce gerçek hikaye daha...
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div
                    className="px-6 py-4 flex items-center justify-between border-t"
                    style={{
                        borderColor: 'var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)'
                    }}
                >
                    {/* Step Dots */}
                    <div className="flex items-center gap-2">
                        {[0, 1].map((step) => (
                            <button
                                key={step}
                                onClick={() => setCurrentStep(step)}
                                className={`h-2.5 rounded-full transition-all duration-300 ${currentStep === step ? 'w-6' : 'w-2.5 hover:opacity-70'}`}
                                style={{
                                    backgroundColor: currentStep === step
                                        ? 'var(--coral-primary)'
                                        : 'var(--border-primary)'
                                }}
                                aria-label={`Adım ${step + 1}`}
                            />
                        ))}
                    </div>

                    {/* Next / Start Button */}
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, #FF6F61 0%, #FF8A50 100%)',
                            boxShadow: '0 4px 15px rgba(255, 111, 97, 0.3)'
                        }}
                    >
                        <span>{currentStep === 1 ? 'Hemen Başla!' : 'Devam Et'}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper function to check if onboarding should be shown
export const shouldShowOnboarding = (): boolean => {
    return !localStorage.getItem(STORAGE_KEY);
};

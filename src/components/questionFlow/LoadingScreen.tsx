import React from 'react';

interface LoadingScreenProps {
    messageIndex: number;
    isReady?: boolean;
    onStart?: () => void;
}

// Loading messages in Turkish - rotating at bottom
const loadingMessages = [
    "İhtiyaçların analiz ediliyor...",
    "Sana özel sorular hazırlanıyor...",
    "En uygun sorular seçiliyor...",
    "Neredeyse hazır..."
];

/**
 * Loading screen with informative content and animated progress
 * Explains how questions are prepared while LLM works in background
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ messageIndex, isReady, onStart }) => {
    return (
        <>
            <div className="flex flex-col items-center justify-start px-5 pt-8 pb-10 animate-in fade-in duration-700">
                <div className="max-w-md w-full space-y-6">

                    {/* Main Info Cards */}
                    <div className="space-y-4">
                        {/* Card 1: Expert Questions */}
                        <div
                            className="p-5 rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-1000 ease-out"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                animationDelay: '200ms',
                                animationFillMode: 'backwards'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                    style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)' }}
                                >
                                    📝
                                </div>
                                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Uzman Sorular
                                </h3>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Sana soracağımız sorular <strong style={{ color: 'var(--text-primary)' }}>naapim ekibi</strong> tarafından
                                özenle hazırlandı. Her soru, kararını daha net görmen için tasarlandı.
                            </p>
                        </div>

                        {/* Card 2: AI Selection */}
                        <div
                            className="p-5 rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-1000 ease-out"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                animationDelay: '600ms',
                                animationFillMode: 'backwards'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                    style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                                >
                                    🤖
                                </div>
                                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Akıllı Seçim
                                </h3>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Yapay zeka, yazdığın konuyu anlayıp sana <strong style={{ color: 'var(--text-primary)' }}>en uygun soruları</strong> seçiyor.
                                Gereksiz sorularla vakit kaybetmezsin.
                            </p>
                        </div>

                        {/* Card 3: Community Matching */}
                        <div
                            className="p-5 rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-1000 ease-out"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                animationDelay: '1000ms',
                                animationFillMode: 'backwards'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                                >
                                    👥
                                </div>
                                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Benzer Deneyimler
                                </h3>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Cevapların, seninle <strong style={{ color: 'var(--text-primary)' }}>aynı durumda olan diğer kişilerle</strong> eşleştirme
                                için kullanılacak. Yalnız olmadığını göreceksin.
                            </p>
                        </div>
                    </div>

                    {/* Loading spinner (only when not ready) */}
                    {!isReady && (
                        <div className="text-center space-y-4 pt-4">
                            <div className="relative mx-auto w-8 h-8">
                                <div
                                    className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                                    style={{ borderColor: 'var(--border-secondary)', borderTopColor: 'var(--coral-primary)' }}
                                />
                            </div>
                            <p
                                className="text-sm font-medium animate-in fade-in duration-300"
                                style={{ color: 'var(--text-muted)' }}
                                key={messageIndex}
                            >
                                {loadingMessages[messageIndex % loadingMessages.length]}
                            </p>
                        </div>
                    )}

                    {/* Desktop Button - Inline (under cards) */}
                    {isReady && (
                        <div className="hidden md:block pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <button
                                onClick={onStart}
                                className="w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    backgroundColor: 'var(--coral-primary)',
                                    boxShadow: '0 4px 20px rgba(255, 107, 107, 0.35)'
                                }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>✨</span>
                                    <span>Sorular Hazır — Başlayalım!</span>
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Spacer for mobile fixed button only */}
                    {isReady && <div className="h-24 md:hidden" />}
                </div>
            </div>

            {/* Mobile Button - Fixed at bottom */}
            {isReady && (
                <div
                    className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{
                        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0))',
                        background: 'linear-gradient(to top, var(--bg-primary) 70%, transparent)'
                    }}
                >
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={onStart}
                            className="w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-300"
                            style={{
                                backgroundColor: 'var(--coral-primary)',
                                boxShadow: '0 4px 25px rgba(255, 107, 107, 0.4)',
                                animation: 'pulse-subtle 2s ease-in-out infinite'
                            }}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <span>✨</span>
                                <span>Sorular Hazır — Başlayalım!</span>
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Custom keyframes for subtle pulse */}
            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% { 
                        transform: scale(1);
                        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.35);
                    }
                    50% { 
                        transform: scale(1.02);
                        box-shadow: 0 6px 25px rgba(255, 107, 107, 0.45);
                    }
                }
            `}</style>
        </>
    );
};

export { loadingMessages };

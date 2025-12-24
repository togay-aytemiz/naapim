import React from 'react';

interface LoadingScreenProps {
    messageIndex: number;
}

// Loading messages in Turkish
const loadingMessages = [
    "İhtiyaçların analiz ediliyor...",
    "Sana özel sorular hazırlanıyor...",
    "Konu başlıkları belirleniyor...",
    "En uygun sorular seçiliyor...",
    "Kişiselleştirilmiş akış oluşturuluyor...",
    "Neredeyse hazır..."
];

/**
 * Loading screen with animated spinner and rotating messages
 * Used during classification and question selection
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ messageIndex }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 animate-in fade-in duration-700">
            <div className="text-center space-y-8 max-w-sm">
                {/* Animated spinner - Brand Colors */}
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
                        key={messageIndex}
                    >
                        {loadingMessages[messageIndex] || loadingMessages[0]}
                    </p>
                </div>
            </div>
        </div>
    );
};

export { loadingMessages };

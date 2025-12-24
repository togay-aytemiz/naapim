import React from 'react';

interface BlockedTopicsScreenProps {
    onBack: () => void;
}

/**
 * Screen shown when user asks about blocked topics
 * (financial advice, medical advice, legal advice)
 */
export const BlockedTopicsScreen: React.FC<BlockedTopicsScreenProps> = ({ onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 animate-in fade-in duration-500">
            <div className="text-center space-y-6 max-w-md">
                {/* Warning Icon */}
                <div
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)' }}
                >
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: 'var(--coral-primary)' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <div className="space-y-3">
                    <h2
                        className="text-2xl font-bold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Bu Konuda Yardımcı Olamıyoruz
                    </h2>
                    <p
                        className="text-base leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Finansal yatırım tavsiyeleri, tıbbi/ilaç danışmanlığı ve hukuki konularda profesyonel uzmanlık gerektiğinden bu alanlarda öneri sunamıyoruz.
                    </p>
                </div>

                <div
                    className="p-4 rounded-xl text-left space-y-2"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        Bunun yerine şunları sorabilirsin:
                    </p>
                    <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                        <li>• Kariyer ve iş değişikliği kararları</li>
                        <li>• Ebeveynlik ve çocuk yetiştirme</li>
                        <li>• İlişki ve sosyal hayat</li>
                        <li>• Eğitim ve kişisel gelişim</li>
                        <li>• Yaşam tarzı değişiklikleri</li>
                    </ul>
                </div>

                <button
                    onClick={onBack}
                    className="w-full py-4 rounded-xl font-semibold transition-all hover:opacity-90"
                    style={{
                        backgroundColor: 'var(--coral-primary)',
                        color: 'white'
                    }}
                >
                    Farklı Bir Konu Dene
                </button>
            </div>
        </div>
    );
};

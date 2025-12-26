import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';

interface ClarificationScreenProps {
    clarificationPrompt: string;
    originalQuestion: string;  // The original/accumulated question (readonly)
    additionalInput: string;   // New clarification input
    isUnrealistic?: boolean;   // True if question is fantasy/unrealistic
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    onBack: () => void;
}

/**
 * Clarification screen for when user input is too vague
 * Shows original question as readonly, asks for additional details
 * System will merge original + additional for classification
 * 
 * If isUnrealistic is true, shows a different UI asking user to go back home
 */
export const ClarificationScreen: React.FC<ClarificationScreenProps> = ({
    clarificationPrompt,
    originalQuestion,
    additionalInput,
    isUnrealistic = false,
    onInputChange,
    onSubmit,
    onBack
}) => {
    // Unrealistic question - show different UI
    if (isUnrealistic) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 animate-in fade-in duration-500">
                <div className="text-center space-y-6 max-w-md w-full">
                    {/* Warning Icon */}
                    <div
                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(251, 146, 60, 0.15)' }}
                    >
                        <AlertTriangle className="w-8 h-8" style={{ color: 'var(--amber-500)' }} />
                    </div>

                    {/* Original question - show what they asked */}
                    <div
                        className="p-3 rounded-xl text-sm italic"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-secondary)',
                            color: 'var(--text-muted)',
                        }}
                    >
                        "{originalQuestion}"
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Bu soru gerçek bir karar gibi görünmüyor
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            Naapim, gerçek hayat kararlarında yardımcı olmak için tasarlandı.
                            Kariyer, ilişki, finans, sağlık gibi konularda sana destek olabiliriz.
                        </p>
                    </div>

                    {/* CTA - Go back to homepage */}
                    <button
                        onClick={onBack}
                        className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                            background: 'linear-gradient(135deg, #FF6F61 0%, #FF8A50 100%)',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(255, 111, 97, 0.3)'
                        }}
                    >
                        <Home className="w-5 h-5" />
                        Anasayfaya Dön ve Yeniden Dene
                    </button>

                    {/* Examples */}
                    <div className="pt-2">
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                            Örnek sorular:
                        </p>
                        <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <p>• "İşimi değiştirmeli miyim?"</p>
                            <p>• "Ev almak mı yoksa kiralamak mı daha mantıklı?"</p>
                            <p>• "Yeni bir ilişkiye hazır mıyım?"</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Normal clarification UI
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 animate-in fade-in duration-500">
            <div className="text-center space-y-5 max-w-md w-full">
                {/* Thinking Icon */}
                <div
                    className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                >
                    <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: 'var(--amber-500)' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                {/* Original question - readonly */}
                <div className="text-left w-full">
                    <label
                        className="block text-xs font-medium mb-1.5 uppercase tracking-wide"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Senin sorun
                    </label>
                    <div
                        className="w-full p-3 rounded-xl text-sm"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-secondary)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        "{originalQuestion}"
                    </div>
                </div>

                {/* Clarification prompt */}
                <div className="text-left">
                    <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Biraz daha detay verir misin?
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {clarificationPrompt}
                    </p>
                </div>

                {/* Input for additional clarification */}
                <div className="space-y-3 w-full">
                    <textarea
                        value={additionalInput}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Ek detayları buraya yaz..."
                        className="w-full p-4 rounded-xl resize-none text-sm"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                            minHeight: '80px'
                        }}
                        rows={2}
                        autoFocus
                    />

                    {/* Preview of merged question */}
                    {additionalInput.trim() && (
                        <div
                            className="text-xs p-2 rounded-lg"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-muted)'
                            }}
                        >
                            <span className="font-medium">Birleştirilmiş soru: </span>
                            "{originalQuestion} — {additionalInput.trim()}"
                        </div>
                    )}

                    <button
                        onClick={onSubmit}
                        disabled={!additionalInput.trim()}
                        className="w-full py-3.5 rounded-xl font-medium transition-all duration-200"
                        style={{
                            backgroundColor: additionalInput.trim() ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                            color: additionalInput.trim() ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                            cursor: additionalInput.trim() ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Devam Et
                    </button>
                </div>

                {/* Back button */}
                <button
                    onClick={onBack}
                    className="text-sm hover:underline"
                    style={{ color: 'var(--text-muted)' }}
                >
                    ← Geri dön
                </button>
            </div>
        </div>
    );
};

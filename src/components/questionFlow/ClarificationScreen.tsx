import React from 'react';

interface ClarificationScreenProps {
    clarificationPrompt: string;
    originalQuestion: string;  // The original/accumulated question (readonly)
    additionalInput: string;   // New clarification input
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    onBack: () => void;
}

/**
 * Clarification screen for when user input is too vague
 * Shows original question as readonly, asks for additional details
 * System will merge original + additional for classification
 */
export const ClarificationScreen: React.FC<ClarificationScreenProps> = ({
    clarificationPrompt,
    originalQuestion,
    additionalInput,
    onInputChange,
    onSubmit,
    onBack
}) => {
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

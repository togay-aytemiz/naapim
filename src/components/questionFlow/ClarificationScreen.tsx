import React from 'react';

interface ClarificationScreenProps {
    clarificationPrompt: string;
    clarifiedInput: string;
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    onBack: () => void;
}

/**
 * Clarification screen for when user input is too vague
 * Asks for more details to better classify the question
 */
export const ClarificationScreen: React.FC<ClarificationScreenProps> = ({
    clarificationPrompt,
    clarifiedInput,
    onInputChange,
    onSubmit,
    onBack
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 animate-in fade-in duration-500">
            <div className="text-center space-y-6 max-w-md w-full">
                {/* Thinking Icon */}
                <div
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                >
                    <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: 'var(--amber-500)' }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <div className="space-y-3">
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Biraz daha detay verir misin?
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {clarificationPrompt}
                    </p>
                </div>

                {/* Input for clarification */}
                <div className="space-y-3 w-full">
                    <textarea
                        value={clarifiedInput}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Örneğin: İkinci çocuğu yapmalı mıyız diye düşünüyorum ama emin değilim..."
                        className="w-full p-4 rounded-xl resize-none"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                            minHeight: '100px'
                        }}
                        rows={3}
                        autoFocus
                    />

                    <button
                        onClick={onSubmit}
                        disabled={!clarifiedInput.trim()}
                        className="w-full py-4 rounded-xl font-medium transition-all duration-200"
                        style={{
                            backgroundColor: clarifiedInput.trim() ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                            color: clarifiedInput.trim() ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                            cursor: clarifiedInput.trim() ? 'pointer' : 'not-allowed'
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

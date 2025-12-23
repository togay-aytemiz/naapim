import React, { useState } from 'react';

// Email validation helper
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

interface RecoveryCodeProps {
    onReminderSet?: (email: string) => void;
    initialCode?: string;
    onStartInteraction?: () => void;
}

export const RecoveryCode: React.FC<RecoveryCodeProps> = ({ onReminderSet, initialCode, onStartInteraction }) => {
    const [copied, setCopied] = useState(false);
    const [showSendOptions, setShowSendOptions] = useState(false);
    const [email, setEmail] = useState('');
    const [sendReminder, setSendReminder] = useState(true);
    const [sent, setSent] = useState(false);

    const code = initialCode || 'NY-48K2-P7';
    const isEmailValid = isValidEmail(email);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.log('Copy failed', err);
        }
    };

    const handleSendClick = () => {
        if (!showSendOptions && onStartInteraction) {
            onStartInteraction();
        }
        setShowSendOptions(!showSendOptions);
    };

    const handleSend = () => {
        if (isEmailValid) {
            setSent(true);
            if (sendReminder && onReminderSet) {
                onReminderSet(email);
            }
        }
    };

    return (
        <div id="recovery-code-section" className="space-y-6 px-5 scroll-mt-24">
            <div className="text-center">
                <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    Takip kodun
                </h3>
                <p className="text-helper mt-2 max-w-sm mx-auto">
                    Bu anahtarı sakla. Yarından itibaren geri dönüp hikayeni paylaşabilir ve diğerlerinin deneyimlerini görebilirsin.
                </p>
            </div>

            {/* Code display */}
            <div
                className="rounded-2xl p-6 text-center"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)'
                }}
            >
                <p
                    className="text-2xl md:text-3xl font-mono font-semibold tracking-wider"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {code}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
                <button onClick={handleCopy} className="btn-secondary">
                    {copied ? '✓ Kopyalandı' : 'Kopyala'}
                </button>
                <button
                    onClick={handleSendClick}
                    className="btn-secondary"
                >
                    E-postana gönder
                </button>
            </div>

            {/* Send options (expandable) */}
            {showSendOptions && !sent && (
                <div className="animate-in space-y-4">
                    {/* Email input with inline button */}
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-posta adresin"
                            className="flex-1 px-4 py-3 rounded-xl text-sm transition-colors"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-primary)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!isEmailValid}
                            className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200"
                            style={{
                                backgroundColor: isEmailValid ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                                color: isEmailValid ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                                cursor: isEmailValid ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Gönder
                        </button>
                    </div>

                    {/* Reminder checkbox with trust messaging */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div
                                onClick={() => setSendReminder(!sendReminder)}
                                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
                                style={{
                                    borderColor: sendReminder ? 'var(--success-accent)' : 'var(--border-hover)',
                                    backgroundColor: sendReminder ? 'var(--success-accent)' : 'transparent'
                                }}
                            >
                                {sendReminder && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Geri dönmemi hatırlat
                            </span>
                        </label>

                        {/* Trust messaging */}
                        <p className="text-xs ml-8" style={{ color: 'var(--text-muted)' }}>
                            🔒 E-postan sadece bu hatırlatma için kullanılacak. Pazarlama yok, 3. taraflarla paylaşım yok.
                        </p>
                    </div>
                </div>
            )}

            {/* Success state */}
            {sent && (
                <div
                    className="animate-in text-center p-4 rounded-xl"
                    style={{ backgroundColor: 'var(--success-bg)' }}
                >
                    <p className="font-medium" style={{ color: 'var(--success-text)' }}>
                        ✓ Kod gönderildi!
                    </p>
                    {sendReminder && (
                        <p className="text-sm mt-1" style={{ color: 'var(--success-text)' }}>
                            Geri dönmeni hatırlatacağız.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

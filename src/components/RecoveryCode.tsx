import React, { useState } from 'react';
import { X } from 'lucide-react';

// Email validation helper
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

import { sendCodeEmail } from '../services/emailService';

interface RecoveryCodeProps {
    onReminderSet?: (email: string) => void;
    initialCode?: string;
    onStartInteraction?: () => void;
    userQuestion?: string;
}

export const RecoveryCode: React.FC<RecoveryCodeProps> = ({ onReminderSet, initialCode, onStartInteraction, userQuestion }) => {
    const [copied, setCopied] = useState(false);
    const [showSendOptions, setShowSendOptions] = useState(false);
    const [email, setEmail] = useState('');
    const [sendReminder, setSendReminder] = useState(true);
    const [reminderTime, setReminderTime] = useState<'tomorrow' | '1_week' | '2_weeks'>('1_week');
    const [sent, setSent] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showWhyTomorrow, setShowWhyTomorrow] = useState(false);

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

    const handleSend = async () => {
        if (isEmailValid && !isSending) {
            setIsSending(true);
            setError(null);

            try {
                // Send code email (which now includes the question context)
                const result = await sendCodeEmail(email, code, userQuestion || '');

                if (result.success) {
                    setSent(true);
                    if (sendReminder) {
                        if (onReminderSet) onReminderSet(email);
                        // Schedule reminder in background
                        // Import scheduleReminder separately or move import to top if not present
                        import('../services/emailService').then(({ scheduleReminder }) => {
                            scheduleReminder(
                                email,
                                code,
                                userQuestion || '',
                                undefined,
                                undefined,
                                reminderTime
                            ).catch(err => console.error('Failed to schedule reminder:', err));
                        });
                    }
                } else {
                    setError(result.error || 'E-posta gönderilemedi.');
                }
            } catch (err) {
                console.error('Email send failed:', err);
                setError('Bir hata oluştu.');
            } finally {
                setIsSending(false);
            }
        }
    };

    return (
        <>
            {/* Why Tomorrow Modal */}
            {showWhyTomorrow && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setShowWhyTomorrow(false)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl p-6 animate-in zoom-in-95 duration-200"
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-secondary)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowWhyTomorrow(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                        </button>

                        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Neden yarın?
                        </h3>

                        <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <p>
                                <strong style={{ color: 'var(--text-primary)' }}>Gerçek deneyimler için</strong><br />
                                Kararını verdikten hemen sonra değil, en az bir gece üstüne uyduktan sonra paylaşmanı istiyoruz.
                                Bu sayede daha gerçekçi ve düşünülmüş geri bildirimler topluyoruz.
                            </p>

                            <p>
                                <strong style={{ color: 'var(--text-primary)' }}>Spam ve kötüye kullanımı önlemek için</strong><br />
                                24 saatlik bekleme süresi, sistemi otomatik spam ve anlık duygusal tepkilerden korur.
                                Bu sayede herkes için daha değerli bir topluluk deneyimi yaratıyoruz.
                            </p>

                            <p>
                                <strong style={{ color: 'var(--text-primary)' }}>Düşünceli kararlar için</strong><br />
                                Araştırmalar gösteriyor ki önemli kararlar için bir gece beklemek daha sağlıklı sonuçlar veriyor.
                                Bu süre sana da kararını gözden geçirme fırsatı tanıyor.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowWhyTomorrow(false)}
                            className="mt-6 w-full py-2.5 rounded-xl font-medium"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-secondary)' }}
                        >
                            Anladım
                        </button>
                    </div>
                </div>
            )}

            <div id="recovery-code-section" className="space-y-6 px-5 scroll-mt-24">
                <div className="text-center">
                    <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                        Takip kodun
                    </h3>
                    <p className="text-helper mt-2 max-w-sm mx-auto">
                        Bu anahtarı sakla. <strong>Yarından itibaren</strong> geri dönüp hikayeni paylaşabilir ve diğerlerinin deneyimlerini görebilirsin.
                    </p>
                    <button
                        onClick={() => setShowWhyTomorrow(true)}
                        className="mt-1 text-sm underline hover:no-underline"
                        style={{ color: 'var(--coral-primary)' }}
                    >
                        Neden yarın?
                    </button>
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
                                disabled={!isEmailValid || isSending}
                                className="px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center min-w-[100px]"
                                style={{
                                    backgroundColor: isEmailValid && !isSending ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                                    color: isEmailValid && !isSending ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                                    cursor: isEmailValid && !isSending ? 'pointer' : 'not-allowed',
                                    opacity: isSending ? 0.7 : 1
                                }}
                            >
                                {isSending ? '...' : 'Gönder'}
                            </button>
                        </div>

                        {/* Reminder checkbox with trust messaging */}
                        <div className="space-y-3">
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
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Kararımı verdikten sonra sonucu paylaşmamı hatırlat
                                </span>
                            </label>

                            {sendReminder && (
                                <div className="ml-8 grid grid-cols-3 gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                    {[
                                        { id: 'tomorrow', label: 'Yarın' },
                                        { id: '1_week', label: '1 Hafta' },
                                        { id: '2_weeks', label: '2 Hafta' }
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setReminderTime(option.id as any)}
                                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-all border ${reminderTime === option.id
                                                ? 'border-[var(--success-accent)] bg-[var(--success-bg)] text-[var(--success-text)]'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Trust messaging */}
                            <p className="text-xs ml-8" style={{ color: 'var(--text-muted)' }}>
                                🔒 E-postan sadece bu hatırlatma için kullanılacak. Pazarlama yok, 3. taraflarla paylaşım yok.
                            </p>
                        </div>

                        {error && (
                            <p className="text-sm text-center" style={{ color: 'var(--error-accent, #ef4444)' }}>
                                {error}
                            </p>
                        )}
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
        </>
    );
};

import React, { useState } from 'react';
import { X, Lock, CheckCircle } from 'lucide-react';
import { sendCodeEmail, scheduleReminder } from '../services/emailService';

import { isValidEmail } from '../utils/validation';

interface UnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlock: () => void;
    onUnlockWithEmail?: (email: string, reminderTime: 'tomorrow' | '1_week' | '2_weeks') => void;
    code: string;
    userQuestion?: string;
    sessionId?: string;
    seededOutcomes?: any[];
    followupQuestion?: string;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
    isOpen,
    onClose,
    onUnlock,
    onUnlockWithEmail,
    code,
    userQuestion,
    sessionId,
    seededOutcomes,
    followupQuestion
}) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'success'>('input');
    const reminderTime = '1_week' as const; // Fixed to 1 week

    // Advanced email validation
    const validEmail = isValidEmail(email);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!validEmail) {
            setError('Girdiğin e-posta adresi geçerli görünmüyor.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Send immediate code email (so they have the Key)
            await sendCodeEmail(email, code, userQuestion || '');

            // 2. Schedule the reminder (The "Price" of the unlock)
            const truncatedProof = seededOutcomes?.slice(0, 2).map(o => ({
                outcome_type: o.outcome_type,
                feeling: o.feeling,
                outcome_text: o.outcome_text?.split(' ').slice(0, 6).join(' ') + '...'
            }));

            await scheduleReminder(
                email,
                code,
                userQuestion || '',
                sessionId,
                followupQuestion,
                reminderTime,
                truncatedProof
            );

            setStep('success');

            // Auto close after success and trigger unlock
            setTimeout(() => {
                onUnlockWithEmail?.(email, reminderTime);
                onUnlock();
                onClose();
            }, 2500);

        } catch (err) {
            console.error('Unlock error:', err);
            setError('Bir hata oluştu, lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-300 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden bg-[var(--bg-primary)] shadow-2xl max-h-[95vh] sm:max-h-none overflow-y-auto"
                onClick={e => e.stopPropagation()}
                style={{ border: '1px solid var(--border-secondary)' }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--bg-secondary)] z-10"
                >
                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>

                {step === 'input' ? (
                    <div className="p-6 pb-8 sm:pb-6">
                        {/* Header */}
                        <div className="text-center mb-5">
                            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-amber-100">
                                <Lock className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                Hikayelerin Kilidini Aç
                            </h3>
                            <p className="text-sm mt-1.5 text-[var(--text-secondary)]">
                                E-postanı gir, başkalarının hikayelerini <strong>hemen gör</strong>.
                            </p>
                        </div>

                        {/* Community Banner */}
                        <div
                            className="mb-5 p-3 rounded-xl"
                            style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                border: '1px solid rgba(59, 130, 246, 0.25)'
                            }}
                        >
                            <div className="flex gap-3 items-start">
                                <span className="text-xl flex-shrink-0">🤝</span>
                                <div>
                                    <p className="text-xs font-medium text-[var(--text-primary)] mb-0.5">
                                        Topluluk nasıl büyüyor?
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        Bu hikayeler, zamanla deneyimlerini paylaşan insanlardan oluşuyor. İstersen sen de daha sonra katkıda bulunabilirsin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Email Section */}
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-start gap-2">
                                    <span className="flex-shrink-0">⏰</span>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        1 hafta sonra sana kısa bir hatırlatma göndereceğiz, istersen kararını o zaman paylaşabilirsin.
                                    </p>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="E-posta adresin"
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 text-center">{error}</p>
                            )}

                            {/* Privacy Disclaimer */}
                            <div className="flex items-center gap-2">
                                <span className="flex-shrink-0">🔒</span>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Sadece bu karar için kullanılır, reklam yok, spam yok.
                                </p>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !validEmail}
                                className="w-full py-3.5 rounded-xl font-medium text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: validEmail && !isLoading ? '#EA580C' : '#d4d4d4',
                                    color: validEmail && !isLoading ? 'white' : '#a3a3a3'
                                }}
                            >
                                {isLoading ? 'Açılıyor...' : 'Hikayeleri Göster'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 pb-12 sm:pb-8 text-center bg-emerald-50">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-100">
                            <CheckCircle className="w-8 h-8 text-emerald-600 animate-in zoom-in duration-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-800">
                            Harika Seçim!
                        </h3>
                        <p className="text-sm mt-2 text-emerald-700">
                            Hatırlatman kuruldu. <br />
                            Hikayeler şimdi açılıyor...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

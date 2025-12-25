import React, { useState } from 'react';
import { X, Lock, CheckCircle } from 'lucide-react';
import { sendCodeEmail, scheduleReminder } from '../services/emailService';

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
    const [reminderTime, setReminderTime] = useState<'tomorrow' | '1_week' | '2_weeks'>('1_week');

    // Simple email validation
    const isValidEmail = email.includes('@') && email.includes('.') && email.length > 5;

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!isValidEmail) {
            setError('Geçerli bir e-posta adresi giriniz.');
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-[var(--bg-primary)] shadow-2xl"
                onClick={e => e.stopPropagation()}
                style={{ border: '1px solid var(--border-secondary)' }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--bg-secondary)]"
                >
                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>

                {step === 'input' ? (
                    <div className="p-6">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-amber-100">
                                <Lock className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                Hikayelerin Kilidini Aç
                            </h3>
                            <p className="text-sm mt-1 text-[var(--text-secondary)]">
                                Karar vermekte zorlanıyor musun? <br />
                                Kendine bir hatırlatma kur, başkalarının ne yaptığını <strong>hemen gör.</strong>
                            </p>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-[var(--text-muted)]">
                                    Hatırlatma Zamanı
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'tomorrow', label: 'Yarın' },
                                        { id: '1_week', label: '1 Hafta' },
                                        { id: '2_weeks', label: '2 Hafta' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setReminderTime(opt.id as any)}
                                            className={`py-2 rounded-lg text-xs font-medium transition-all ${reminderTime === opt.id
                                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-secondary)]'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
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

                            <p className="text-[10px] text-center text-[var(--text-muted)] leading-tight px-2">
                                E-postan sadece tek seferlik hatırlatma için kullanılacak. <br />
                                Spam yok, söz veriyoruz. ✌️
                            </p>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !isValidEmail}
                                className="w-full py-3.5 rounded-xl font-medium text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: isValidEmail && !isLoading ? '#EA580C' : '#d4d4d4',
                                    color: isValidEmail && !isLoading ? 'white' : '#a3a3a3'
                                }}
                            >
                                {isLoading ? 'Açılıyor...' : 'Kilidi Aç ve Hatırlat'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-emerald-50">
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

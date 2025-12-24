import React, { useState } from 'react';

// Email validation helper
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

import { scheduleReminder } from '../services/emailService';

interface ReminderOptInProps {
    code?: string;
    userQuestion?: string;
    onReminderSet?: (email: string) => void;
}

export const ReminderOptIn: React.FC<ReminderOptInProps> = ({ code, userQuestion, onReminderSet }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reminderTime, setReminderTime] = useState<'tomorrow' | '1_week' | '2_weeks'>('1_week');
    const [error, setError] = useState<string | null>(null);

    const isEmailValid = isValidEmail(email);

    const handleSubmit = async () => {
        if (isEmailValid && !isLoading) {
            setIsLoading(true);
            setError(null);

            try {
                // Call passing the flexible time
                const result = await scheduleReminder(
                    email,
                    code || '',
                    userQuestion || '',
                    undefined,
                    undefined,
                    reminderTime
                );

                if (result.success) {
                    setSubmitted(true);
                    if (onReminderSet) onReminderSet(email);
                } else {
                    setError('Bir hata oluştu. Lütfen tekrar dene.');
                }
            } catch (err) {
                console.error('Reminder failed:', err);
                setError('Bağlantı hatası.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (submitted) {
        return (
            <div
                className="text-center p-6 rounded-2xl animate-in mx-5"
                style={{ backgroundColor: 'var(--success-bg)' }}
            >
                <p className="font-medium" style={{ color: 'var(--success-text)' }}>
                    ✓ Ayarlandı!
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--success-text)' }}>
                    {reminderTime === 'tomorrow' ? 'Yarın' : reminderTime === '1_week' ? '1 hafta sonra' : '2 hafta sonra'} sana haber vereceğiz.
                </p>
                <p className="text-xs mt-2 opacity-75" style={{ color: 'var(--success-text)' }}>
                    Takip kodun: {code}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5 px-5">
            <div className="text-center">
                <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    Kararını merak ediyoruz
                </h3>
                <p className="text-helper mt-2">
                    Sonuncunda ne olduğuna dair sana bir hatırlatma gönderelim mi?
                </p>
            </div>

            <div className="space-y-3">
                {/* Time Selection Pills */}
                <div className="flex justify-center gap-2">
                    {[
                        { id: 'tomorrow', label: 'Yarın' },
                        { id: '1_week', label: '1 Hafta' },
                        { id: '2_weeks', label: '2 Hafta' }
                    ].map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setReminderTime(option.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${reminderTime === option.id
                                ? 'border-[var(--coral-primary)] bg-[var(--coral-primary)] text-white'
                                : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Inline email input with button */}
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E-posta adresin"
                        className="flex-1 px-4 py-3.5 rounded-xl text-sm transition-all duration-200"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!isEmailValid || isLoading}
                        className="px-6 py-3.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 min-w-[100px]"
                        style={{
                            backgroundColor: isEmailValid && !isLoading ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                            color: isEmailValid && !isLoading ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                            cursor: isEmailValid && !isLoading ? 'pointer' : 'not-allowed',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? '...' : 'Hatırlat'}
                    </button>
                </div>
                {error && <p className="text-xs text-center text-red-500">{error}</p>}

                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    🔒 E-postan sadece bu işlem için kullanılacak.
                </p>
            </div>
        </div>
    );
};

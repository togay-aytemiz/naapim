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
    seededOutcomes?: any[]; // Added prop
    followupQuestion?: string; // Added prop
}

// Helper to truncate social proof for email storage (5-6 words max)
function truncateForEmail(outcomes: any[] | undefined): any[] | undefined {
    if (!outcomes || !Array.isArray(outcomes)) return undefined;
    return outcomes.slice(0, 2).map(o => ({
        outcome_type: o.outcome_type,
        feeling: o.feeling,
        outcome_text: o.outcome_text?.split(' ').slice(0, 6).join(' ') + '...'
    }));
}

export const ReminderOptIn: React.FC<ReminderOptInProps> = ({ code, userQuestion, onReminderSet, seededOutcomes, followupQuestion }) => {
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
                // Truncate social proof for email storage
                const truncatedProof = truncateForEmail(seededOutcomes);

                // Call passing the flexible time, followup question, and social proof data
                const result = await scheduleReminder(
                    email,
                    code || '',
                    userQuestion || '',
                    undefined,
                    followupQuestion, // Pass the followup question
                    reminderTime,
                    truncatedProof // Pass truncated dynamic social proof data
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
                className="animate-in text-center p-6 rounded-2xl space-y-4 shadow-sm border mx-5"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--success-accent)'
                }}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)' }}>
                        <span className="text-2xl">🚀</span>
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                            Hatırlatma Kuruldu
                        </h4>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            <strong>{email}</strong> adresine takip kodunu gönderdik.
                        </p>
                    </div>
                </div>

                <div className="text-sm leading-relaxed p-4 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-text)' }}>
                    <p className="opacity-90">
                        Kararını paylaşıp başkalarının yaşadıklarını görmek için <strong>{reminderTime === 'tomorrow' ? 'Yarın itibariyle' : reminderTime === '1_week' ? '1 hafta sonra' : '2 hafta sonra'}</strong> sana küçük bir hatırlatma yapacağız.
                    </p>
                </div>
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
                        type="text"
                        inputMode="email"
                        autoComplete="email"
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
                        {isLoading ? 'Ayarlanıyor...' : 'Hatırlat'}
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

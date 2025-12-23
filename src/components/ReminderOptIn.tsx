import React, { useState } from 'react';

// Email validation helper
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const ReminderOptIn: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const isEmailValid = isValidEmail(email);

    const handleSubmit = () => {
        if (isEmailValid) {
            setSubmitted(true);
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
                    14 gün sonra sana haber vereceğiz.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5 px-5">
            <div className="text-center">
                <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    14 gün sonra hatırlatalım mı?
                </h3>
                <p className="text-helper mt-2">
                    Sadece bu karar için. Spam yok.
                </p>
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
                    disabled={!isEmailValid}
                    className="px-6 py-3.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200"
                    style={{
                        backgroundColor: isEmailValid ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                        color: isEmailValid ? 'var(--btn-primary-text)' : 'var(--btn-disabled-text)',
                        cursor: isEmailValid ? 'pointer' : 'not-allowed'
                    }}
                >
                    Hatırlat
                </button>
            </div>
        </div>
    );
};

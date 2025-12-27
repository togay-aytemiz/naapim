import React, { useState } from 'react';
import { Sparkles, BarChart3, Brain, Check, RefreshCw } from 'lucide-react';
import { sendCodeEmail, scheduleReminder } from '../services/emailService';
import { isValidEmail } from '../utils/validation';

interface OutcomeExpansionBannerProps {
    email?: string | null;
    code?: string;
    userQuestion?: string;
    sessionId?: string;
    onEmailUpdate?: (newEmail: string) => void;
}

export const OutcomeExpansionBanner: React.FC<OutcomeExpansionBannerProps> = ({
    email,
    code,
    userQuestion,
    sessionId,
    onEmailUpdate
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newEmail, setNewEmail] = useState(email || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdateEmail = async () => {
        if (!isValidEmail(newEmail)) {
            setError('Geçerli bir e-posta adresi girin.');
            return;
        }

        setIsUpdating(true);
        setError(null);

        try {
            // 1. Resend code email to new address
            if (code) {
                await sendCodeEmail(newEmail, code, userQuestion || '');
            }

            // 2. Reschedule reminder to new address
            await scheduleReminder(
                newEmail,
                code || '',
                userQuestion || '',
                sessionId,
                undefined,
                '1_week',
                undefined
            );

            // 3. Update parent state
            onEmailUpdate?.(newEmail);

            setUpdateSuccess(true);
            setIsEditing(false);

            // Reset success indicator after 3 seconds
            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (err) {
            console.error('Email update error:', err);
            setError('Güncelleme başarısız, tekrar deneyin.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div
            className="mt-8 rounded-3xl relative overflow-hidden text-left"
            style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-secondary)',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
            }}
        >
            {/* Main Content Padding */}
            <div className="p-6 md:p-8 pb-6">
                {/* Icon */}
                <div
                    className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 rotate-3 hover:rotate-6 transition-transform duration-300"
                    style={{
                        background: 'linear-gradient(135deg, #FFF0F0 0%, #FFF5F5 100%)',
                        boxShadow: '0 4px 12px rgba(255, 111, 97, 0.15)'
                    }}
                >
                    <Sparkles className="w-7 h-7" style={{ color: 'var(--coral-primary)' }} />
                </div>

                {/* Header */}
                <h3
                    className="text-lg md:text-xl font-bold mb-4 text-center"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Keşfetmeye devam et
                </h3>

                <p
                    className="text-sm text-center mb-8 max-w-sm mx-auto leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Benzer durumlardan <span className="font-medium" style={{ color: 'var(--coral-primary)' }}>ufak bir seçki</span> gördün. <br className="hidden md:block" />
                    Sırada, binlerce hikaye arasından senin için yaptığımız <span className="font-medium" style={{ color: 'var(--text-primary)' }}>özel eşleşmeyi</span> keşfetmek var.
                </p>

                {/* Access Section Wrapper */}
                <div
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: '#F9FAFB' }}
                >
                    {/* Sub-Header */}
                    <h3
                        className="text-sm font-bold mb-4 text-left"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Kendi hikayeni paylaşarak eriş:
                    </h3>

                    {/* Features List */}
                    <div className="space-y-4">
                        {/* Feature 1 */}
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: 'var(--coral-primary)' }}>
                                    <Sparkles className="w-4 h-4" />
                                </span>
                            </div>
                            <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Sana Özel İçerik</h4>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--blue-50)', color: 'var(--blue-600)' }}>
                                    <BarChart3 className="w-4 h-4" />
                                </span>
                            </div>
                            <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Derinlemesine İstatistikler</h4>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--purple-50)', color: 'var(--purple-600)' }}>
                                    <Brain className="w-4 h-4" />
                                </span>
                            </div>
                            <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Topluluk Gücü</h4>
                        </div>
                    </div>
                </div>

                {/* How to Share Banner with Email */}
                <div
                    className="mt-5 p-3 rounded-xl"
                    style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)'
                    }}
                >
                    <div className="flex gap-3 items-start">
                        <span className="text-xl flex-shrink-0">📬</span>
                        <div className="flex-1">
                            <p className="text-xs font-medium text-[var(--text-primary)] mb-0.5">
                                Nasıl paylaşım yaparım?
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed opacity-90">
                                {email ? (
                                    <>
                                        Hiç dert etme. <strong className="font-semibold text-[var(--text-primary)]">{email}</strong> adresine gönderdiğimiz e-postadaki talimatları izleyerek dilediğin zaman hikayeni ekleyebilirsin. Ayrıca 1 hafta sonra sana kısa bir hatırlatma yapacağız.
                                    </>
                                ) : (
                                    'Hiç dert etme. Gönderdiğimiz e-postadaki talimatları izleyerek dilediğin zaman hikayeni ekleyebilirsin. Ayrıca 1 hafta sonra sana kısa bir hatırlatma yapacağız.'
                                )}
                            </p>

                            {/* Email Display/Edit Section */}
                            {email && (
                                <div className="mt-3 pt-3 border-t border-blue-200/50">
                                    <div
                                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isEditing ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div className="space-y-2 pb-2">
                                            <input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                placeholder="Yeni e-posta adresi"
                                                className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-blue-200 focus:outline-none focus:border-blue-400"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleUpdateEmail}
                                                    disabled={isUpdating}
                                                    className="flex-1 px-3 py-2 text-xs font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                                >
                                                    {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                                                </button>
                                                <button
                                                    onClick={() => { setIsEditing(false); setNewEmail(email); setError(null); }}
                                                    className="px-3 py-2 text-xs rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                            {error && (
                                                <p className="text-xs text-red-500">{error}</p>
                                            )}
                                        </div>
                                    </div>

                                    {!isEditing && (
                                        <div className="flex items-center">
                                            {updateSuccess ? (
                                                <span className="flex items-center gap-1 text-[10px] text-green-600">
                                                    <Check className="w-3 h-3" />
                                                    E-posta güncellendi
                                                </span>
                                            ) : (
                                                <span
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    E-postayı değiştir
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

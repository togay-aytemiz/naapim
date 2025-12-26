import React from 'react';
import { Sparkles, BarChart3, Brain } from 'lucide-react';

export const OutcomeExpansionBanner: React.FC = () => {
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

                {/* How to Share Banner */}
                <div
                    className="mt-5 p-3 rounded-xl"
                    style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)'
                    }}
                >
                    <div className="flex gap-3 items-start">
                        <span className="text-xl flex-shrink-0">📬</span>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-primary)] mb-0.5">
                                Nasıl paylaşım yaparım?
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed opacity-90">
                                Hiç dert etme. Gönderdiğimiz e-postadaki talimatları izleyerek dilediğin zaman hikayeni ekleyebilirsin. Ayrıca 1 hafta sonra sana kısa bir hatırlatma yapacağız.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

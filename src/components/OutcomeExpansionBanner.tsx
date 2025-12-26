import React from 'react';
import { Sparkles, BarChart3, Brain, Clock } from 'lucide-react';

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
                    className="text-lg md:text-xl font-bold mb-8 text-center"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Harika! Bu sadece başlangıç.<br />Daha fazlası seni bekliyor!
                </h3>

                {/* Sub-Header */}
                <h3
                    className="text-base font-semibold mb-6 text-left"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Paylaştığında neler olur?
                </h3>

                {/* Features List */}
                <div className="space-y-6">
                    {/* Feature 1 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: 'var(--coral-primary)' }}>
                                <Sparkles className="w-4 h-4" />
                            </span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Sana özel eşleşmeler</h4>
                            <p className="text-xs leading-relaxed opacity-90" style={{ color: 'var(--text-muted)' }}>
                                Binlerce yaşanmış hikaye arasından, durumuna en uygun olanları görürsün.
                            </p>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--blue-50)', color: 'var(--blue-600)' }}>
                                <BarChart3 className="w-4 h-4" />
                            </span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Gelişmiş istatistikler</h4>
                            <p className="text-xs leading-relaxed opacity-90" style={{ color: 'var(--text-muted)' }}>
                                Memnuniyet oranı, pişmanlık durumu ve ortalama karar süresi gibi kritik verileri incelersin.
                            </p>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-0.5">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--purple-50)', color: 'var(--purple-600)' }}>
                                <Brain className="w-4 h-4" />
                            </span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Topluluğa katkı</h4>
                            <p className="text-xs leading-relaxed opacity-90" style={{ color: 'var(--text-muted)' }}>
                                Deneyimin, benzer durumdaki başkalarına yol gösterir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Banner Section */}
            <div
                className="p-5 text-center relative"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-secondary)'
                }}
            >
                <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                    <p className="text-xs leading-relaxed opacity-80" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                        E-postana gönderdiğimiz kodla ister yarın, ister 1 hafta sonra gelip kilidi tamamen açabilirsin.
                    </p>

                    <p className="font-bold text-sm mt-1" style={{ color: 'var(--coral-primary)' }}>
                        Sen de kendi hikayeni paylaş, tüm kapıları arala!
                    </p>
                </div>
            </div>
        </div>
    );
};

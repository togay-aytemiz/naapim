import React from 'react';

interface FollowUpSectionProps {
    followupDays?: number;
}

export const FollowUpSection: React.FC<FollowUpSectionProps> = ({ followupDays = 14 }) => {
    const scrollToRecoveryCode = () => {
        document.getElementById('recovery-code-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div id="follow-up-section" className="flex flex-col items-center px-5 scroll-mt-24">
            <div className="w-full max-w-md space-y-8">
                {/* Conversational intro */}
                <div className="text-center space-y-3">
                    <h3 className="text-xl md:text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
                        Hikaye burada bitmiyor.
                    </h3>
                    <p className="leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Kararını veya attığın adımı paylaş, benzer durumları yaşayan diğer insanların deneyimlerini gör.
                    </p>
                </div>

                {/* Simple exchange card */}
                <div
                    className="rounded-2xl p-6"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-secondary)'
                    }}
                >
                    {/* How it works */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: 'var(--emerald-100)', color: 'var(--emerald-600)' }}
                            >
                                1
                            </div>
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Kararını paylaş
                                </p>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Ne yaptığını veya ne yapmaya karar verdiğini anlat
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: 'var(--emerald-100)', color: 'var(--emerald-600)' }}
                            >
                                2
                            </div>
                            <div>
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Başkalarını gör
                                </p>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Benzer durumları yaşayan insanların hikayeleri açılsın
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                        <p className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            Yarından itibaren deneyimini paylaşabilirsin.
                        </p>
                        <button
                            onClick={scrollToRecoveryCode}
                            className="mt-2 w-full text-center text-sm font-medium hover:underline"
                            style={{ color: 'var(--coral-primary)' }}
                        >
                            Nasıl paylaşırım? ↓
                        </button>
                    </div>
                </div>

                {/* Blurred stories teaser */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                            Başkaları ne yaşıyor?
                        </h3>
                    </div>

                    <div className="space-y-3 relative">
                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent z-20 pointer-events-none" />

                        {/* Story 1: Teaser with visible start */}
                        <div
                            className="p-4 rounded-2xl relative overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                <span className="blur-0 font-medium" style={{ color: 'var(--text-primary)' }}>Başta çok tereddüt etmiştim ama adım atınca...</span>{' '}
                                <span className="blur-[3px] select-none opacity-80">aslında korktuğum gibi olmadığını</span>{' '}
                                <span className="blur-[5px] select-none opacity-60">gördüm. Her şey daha netleşti ve</span>{' '}
                                <span className="blur-[8px] select-none opacity-40">kendimi çok daha iyi hissediyorum.</span>
                            </p>
                        </div>

                        {/* Story 2: Partially blurred */}
                        <div
                            className="p-4 rounded-2xl relative overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <div className="flex items-center gap-3 mb-2 opacity-70 blur-[1px]">
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                <div className="h-4 w-28 bg-gray-200 rounded" />
                            </div>
                            <p className="text-sm leading-relaxed opacity-70">
                                <span className="blur-[2px]" style={{ color: 'var(--text-secondary)' }}>Uzun süre düşündüm ama sonunda...</span>{' '}
                                <span className="blur-[4px] select-none opacity-60">karar verdim ve şimdi çok mutluyum</span>{' '}
                                <span className="blur-[6px] select-none opacity-40">keşke daha önce yapsaymışım.</span>
                            </p>
                        </div>

                        {/* Story 3: More blurred */}
                        <div
                            className="p-4 rounded-2xl relative overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <div className="flex items-center gap-3 mb-2 opacity-50 blur-[2px]">
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                <div className="h-4 w-20 bg-gray-200 rounded" />
                            </div>
                            <div className="space-y-2 opacity-50 blur-[4px]">
                                <div className="h-3 w-full bg-gray-200 rounded" />
                                <div className="h-3 w-4/5 bg-gray-200 rounded" />
                            </div>
                        </div>

                        {/* Story 4: Heavily blurred */}
                        <div
                            className="p-4 rounded-2xl relative overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <div className="flex items-center gap-3 mb-2 opacity-40 blur-[3px]">
                                <div className="w-8 h-8 rounded-full bg-gray-200" />
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                            </div>
                            <div className="space-y-2 opacity-40 blur-[5px]">
                                <div className="h-3 w-full bg-gray-200 rounded" />
                                <div className="h-3 w-3/4 bg-gray-200 rounded" />
                            </div>
                        </div>

                        {/* Lock Icon Overlay */}
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                            <div className="bg-white/90 dark:bg-black/90 p-3 rounded-full shadow-lg backdrop-blur-md">
                                <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                    <button
                        onClick={scrollToRecoveryCode}
                        className="w-full py-3.5 px-6 rounded-xl font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                        style={{ backgroundColor: '#FF6F61' }}
                    >
                        Takip kodunu al ve hikayeni paylaş
                    </button>
                    <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                        Takip kodun ile istediğin zaman geri dönebilirsin
                    </p>
                </div>
            </div>
        </div>
    );
};

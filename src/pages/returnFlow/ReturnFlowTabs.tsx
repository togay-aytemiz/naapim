import React from 'react';
import { Lock, FileText, Users } from 'lucide-react';

interface ReturnFlowTabsProps {
    activeSection: 'my-story' | 'community';
    onSectionChange: (section: 'my-story' | 'community') => void;
    canViewCommunity: boolean;
    onLockedClick?: () => void;
}

export const ReturnFlowTabs: React.FC<ReturnFlowTabsProps> = ({
    activeSection,
    onSectionChange,
    canViewCommunity,
    onLockedClick
}) => {
    const handleTabClick = (section: 'my-story' | 'community') => {
        if (section === 'community' && !canViewCommunity) {
            onLockedClick?.();
            return;
        }
        onSectionChange(section);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const indicatorPosition = activeSection === 'community' && canViewCommunity ? 1 : 0;

    return (
        <div className="hidden md:block mb-8">
            <div className="relative flex border-b" style={{ borderColor: 'var(--border-primary)' }}>
                {/* Sliding Underline Indicator */}
                <div
                    className="absolute bottom-0 h-[2px] bg-[var(--coral-primary)] transition-all duration-300 ease-out"
                    style={{
                        width: '50%',
                        left: indicatorPosition === 0 ? '0%' : '50%',
                    }}
                />

                {/* My Story Tab */}
                <button
                    onClick={() => handleTabClick('my-story')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 transition-colors duration-200 group ${activeSection === 'my-story'
                            ? 'text-[var(--coral-primary)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                >
                    <FileText className={`w-5 h-5 transition-transform duration-200 ${activeSection === 'my-story' ? 'scale-110' : 'group-hover:scale-105'}`} />
                    <span className="font-semibold text-[15px] tracking-tight">Hikayem</span>
                </button>

                {/* Community Tab */}
                <button
                    onClick={() => handleTabClick('community')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 transition-colors duration-200 group ${activeSection === 'community' && canViewCommunity
                            ? 'text-[var(--coral-primary)]'
                            : canViewCommunity
                                ? 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                : 'text-[var(--text-muted)] cursor-not-allowed opacity-40'
                        }`}
                >
                    <div className="relative">
                        <Users className={`w-5 h-5 transition-transform duration-200 ${activeSection === 'community' && canViewCommunity ? 'scale-110' : 'group-hover:scale-105'}`} />
                        {!canViewCommunity && (
                            <Lock className="w-3 h-3 absolute -top-1.5 -right-2 text-amber-500" />
                        )}
                    </div>
                    <span className="font-semibold text-[15px] tracking-tight">Topluluk</span>
                </button>
            </div>
        </div>
    );
};

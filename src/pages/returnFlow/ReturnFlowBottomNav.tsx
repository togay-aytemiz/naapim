import React from 'react';
import { Lock, FileText, Users } from 'lucide-react';

interface ReturnFlowBottomNavProps {
    activeSection: 'my-story' | 'community';
    onSectionChange: (section: 'my-story' | 'community') => void;
    canViewCommunity: boolean;
    onLockedClick?: () => void;
}

export const ReturnFlowBottomNav: React.FC<ReturnFlowBottomNavProps> = ({
    activeSection,
    onSectionChange,
    canViewCommunity,
    onLockedClick
}) => {
    const handleSectionClick = (section: 'my-story' | 'community') => {
        if (section === 'community' && !canViewCommunity) {
            onLockedClick?.();
            return;
        }
        onSectionChange(section);
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Determine indicator position: 0 = left (my-story), 1 = right (community)
    const indicatorPosition = activeSection === 'community' && canViewCommunity ? 1 : 0;

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 w-full z-50 border-t border-[var(--border-primary)] shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* Sliding Indicator */}
            <div
                className="absolute top-0 h-0.5 bg-[var(--coral-primary)] rounded-full transition-all duration-300 ease-out"
                style={{
                    width: 'calc(50% - 32px)',
                    left: indicatorPosition === 0 ? '16px' : 'calc(50% + 16px)',
                }}
            />

            <div className="flex w-full relative">
                {/* My Story Nav Item */}
                <button
                    onClick={() => handleSectionClick('my-story')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all duration-200 ${activeSection === 'my-story'
                        ? 'text-[var(--coral-primary)]'
                        : 'text-[var(--text-muted)]'
                        }`}
                >
                    <FileText className={`w-5 h-5 ${activeSection === 'my-story' ? 'scale-110' : ''} transition-transform duration-200`} />
                    <span className="text-xs font-medium">Hikayem</span>
                </button>

                {/* Community Nav Item */}
                <button
                    onClick={() => handleSectionClick('community')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all duration-200 ${activeSection === 'community' && canViewCommunity
                        ? 'text-[var(--coral-primary)]'
                        : canViewCommunity
                            ? 'text-[var(--text-muted)]'
                            : 'text-[var(--text-muted)] opacity-50'
                        }`}
                >
                    <div className="relative">
                        <Users className={`w-5 h-5 ${activeSection === 'community' && canViewCommunity ? 'scale-110' : ''} transition-transform duration-200`} />
                        {!canViewCommunity && (
                            <Lock className="w-3 h-3 absolute -top-1 -right-2" />
                        )}
                    </div>
                    <span className="text-xs font-medium">Topluluk</span>
                </button>
            </div>
        </nav>
    );
};

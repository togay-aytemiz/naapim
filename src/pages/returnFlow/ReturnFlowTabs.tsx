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
    const handleCommunityClick = () => {
        if (canViewCommunity) {
            onSectionChange('community');
        } else {
            onLockedClick?.();
        }
    };

    return (
        <div className="hidden md:flex items-center justify-center gap-2 mb-8">
            {/* My Story Tab */}
            <button
                onClick={() => onSectionChange('my-story')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeSection === 'my-story'
                    ? 'bg-[var(--coral-primary)] text-white shadow-lg'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
            >
                <FileText className="w-4 h-4" />
                Hikayem
            </button>

            {/* Community Tab */}
            <button
                onClick={handleCommunityClick}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${activeSection === 'community' && canViewCommunity
                    ? 'bg-[var(--coral-primary)] text-white shadow-lg'
                    : canViewCommunity
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
                    }`}
            >
                <Users className="w-4 h-4" />
                Topluluk
                {!canViewCommunity && <Lock className="w-3 h-3 ml-1" />}
            </button>
        </div>
    );
};

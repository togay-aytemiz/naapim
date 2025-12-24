import React, { type ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    icon?: ReactNode;
    variant?: 'default' | 'muted' | 'primary';
    size?: 'sm' | 'md';
    onClick?: () => void;
    className?: string;
}

/**
 * Reusable Badge/Chip component with dark mode support
 */
export const Badge: React.FC<BadgeProps> = ({
    children,
    icon,
    variant = 'default',
    size = 'md',
    onClick,
    className = ''
}) => {
    const isDarkMode = document.documentElement.classList.contains('dark');

    const baseClasses = `
        inline-flex items-center gap-1.5 rounded-full font-medium transition-colors
        ${onClick ? 'cursor-pointer' : ''}
    `;

    const sizeClasses = {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-xs'
    };

    const variantStyles = {
        default: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
        },
        muted: {
            backgroundColor: isDarkMode ? 'rgba(38, 38, 38, 1)' : 'rgba(245, 245, 245, 1)',
            color: isDarkMode ? 'rgba(163, 163, 163, 1)' : 'rgba(115, 115, 115, 1)'
        },
        primary: {
            backgroundColor: 'rgba(255, 111, 97, 0.15)',
            color: 'var(--coral-primary)'
        }
    };

    const hoverStyles = onClick ? {
        ...(isDarkMode
            ? { ':hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } }
            : { ':hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' } }
        )
    } : {};

    return (
        <span
            className={`${baseClasses} ${sizeClasses[size]} ${className}`}
            style={{
                ...variantStyles[variant],
                ...hoverStyles
            }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

export default Badge;

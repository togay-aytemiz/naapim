import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    isTransparent?: boolean;
    isDarkMode: boolean;
    toggleTheme: () => void;
    showStatusButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    isTransparent = false,
    isDarkMode,
    toggleTheme,
    showStatusButton = false
}) => {
    const navigate = useNavigate();

    return (
        <header className={`w-full flex items-center justify-between px-6 py-4 z-50 transition-all duration-300 ${isTransparent ? 'absolute top-0 left-0 bg-transparent' : 'relative bg-[var(--bg-primary)]'}`}>
            {/* Logo Section */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigate('/')}
                    className="h-8 w-auto flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none"
                    aria-label="Anasayfa"
                >
                    <img
                        src={isDarkMode ? '/logo-beyaz.webp' : (isTransparent ? '/graphite-logo.webp' : '/logo.webp')}
                        alt="NeYapsam Logo"
                        className="h-full w-auto object-contain"
                    />
                </button>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-black/5 ${isDarkMode
                        ? 'text-white hover:bg-white/10'
                        : (isTransparent ? 'text-slate-600 hover:text-slate-900' : 'text-[var(--text-secondary)]')
                        }`}
                    aria-label="Tema değiştir"
                >
                    <span className="material-symbols-outlined text-xl">
                        {isDarkMode ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                {showStatusButton && (
                    <button
                        onClick={() => navigate('/return')}
                        className={`flex px-4 py-2 items-center justify-center rounded-full transition-all shadow-sm text-xs font-medium ${isDarkMode
                            ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                            : (isTransparent
                                ? 'bg-white/50 backdrop-blur-sm border border-white/60 text-slate-900 hover:bg-white'
                                : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50')
                            }`}
                    >
                        <span className="sm:hidden">Takip No</span>
                        <span className="hidden sm:inline">Takip Kodu ile Sorgula</span>
                    </button>
                )}
            </div>
        </header>
    );
};

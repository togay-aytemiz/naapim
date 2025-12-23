import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    isHomePage?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isHomePage = false }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isQuestionsPage = location.pathname === '/questions';

    useEffect(() => {
        // Check initial dark mode
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Observe changes to the dark class
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    checkDarkMode();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
    };

    const handleLogoClick = () => {
        if (isQuestionsPage) {
            // Show confirmation on questions page
            setShowExitConfirm(true);
        } else {
            // Direct navigation on other pages
            navigate('/');
        }
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        navigate('/');
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    // Homepage: use background images based on theme
    // Other pages: use solid background color based on theme
    const backgroundStyle = isHomePage
        ? {
            backgroundImage: `url('${isDarkMode ? '/sarı-mavi-dark.webp' : '/sarı-mavi.webp'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
        }
        : {};

    // Logo rules:
    // Homepage light: graphite-logo.webp (handled in HomeScreen)
    // Homepage dark: logo-beyaz.webp (handled in HomeScreen)
    // Other pages light: logo.webp
    // Other pages dark: logo-beyaz.webp
    const getLogoSrc = () => {
        return isDarkMode ? '/logo-beyaz.webp' : '/logo.webp';
    };

    return (
        <div
            className={`min-h-screen ${!isHomePage ? 'bg-[var(--bg-primary)]' : ''}`}
            style={backgroundStyle}
        >
            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in">
                    <div
                        className="mx-4 w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in"
                        style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                        <h3
                            className="text-lg font-semibold mb-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Emin misin?
                        </h3>
                        <p
                            className="text-sm mb-6"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Cevapların kaybolacak. Ana sayfaya dönmek istiyor musun?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelExit}
                                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-colors"
                                style={{
                                    backgroundColor: 'var(--btn-secondary-bg)',
                                    color: 'var(--btn-secondary-text)'
                                }}
                            >
                                Devam et
                            </button>
                            <button
                                onClick={handleConfirmExit}
                                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-colors"
                                style={{
                                    backgroundColor: 'var(--accent-500)',
                                    color: 'white'
                                }}
                            >
                                Evet, çık
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header for non-homepage screens */}
            {!isHomePage && (
                <header className="w-full flex items-center justify-between px-5 md:px-8 py-3">
                    <button
                        onClick={handleLogoClick}
                        className="focus:outline-none transition-opacity hover:opacity-80"
                    >
                        <img
                            src={getLogoSrc()}
                            alt="Ne Yapsam"
                            className="h-7 md:h-8 w-auto"
                        />
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--bg-hover)' }}
                        aria-label="Tema değiştir"
                    >
                        {isDarkMode ? (
                            <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </header>
            )}
            {children}
        </div>
    );
};

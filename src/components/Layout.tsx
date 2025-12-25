import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';

interface LayoutProps {
    children: React.ReactNode;
    isHomePage?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isHomePage = false }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const navigate = useNavigate();

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
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };



    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        navigate('/');
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    // Logo rules are now handled by the Header component

    return (
        <div
            className={`min-h-screen min-h-dvh flex flex-col ${!isHomePage ? 'bg-[var(--bg-primary)]' : ''}`}
            style={{
                // iOS safe area insets - homepage: no top padding so background extends to status bar
                paddingTop: isHomePage ? '0' : 'env(safe-area-inset-top, 0)',
                paddingLeft: 'env(safe-area-inset-left, 0)',
                paddingRight: 'env(safe-area-inset-right, 0)',
            }}
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

            <Header
                isTransparent={isHomePage}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                showStatusButton={isHomePage}
            />

            <main className="flex-grow" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
                {children}
            </main>
        </div>
    );
};

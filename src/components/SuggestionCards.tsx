import React from 'react';
import type { AnalysisResult } from '../services/analysis';
import { ShoppingBag, Utensils, Calendar, Plane, Film, Gift } from 'lucide-react';

interface SuggestionCardsProps {
    suggestions?: AnalysisResult['specific_suggestions'];
    type?: AnalysisResult['suggestion_type'];
}

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({ suggestions, type }) => {
    if (!suggestions || suggestions.length === 0) return null;

    // Determine visual style based on suggestion type
    let icon = <ShoppingBag className="w-4 h-4" style={{ color: '#0d9488' }} />;
    let title = "ÖNERİLENLER";

    switch (type) {
        case 'food':
            icon = <Utensils className="w-4 h-4" style={{ color: '#0d9488' }} />;
            title = "ÖNERİLEN LEZZETLER";
            break;
        case 'activity':
            icon = <Calendar className="w-4 h-4" style={{ color: '#0d9488' }} />;
            title = "ÖNERİLEN AKTİVİTELER";
            break;
        case 'travel':
            icon = <Plane className="w-4 h-4" style={{ color: '#0d9488' }} />;
            title = "ÖNERİLEN ROTALAR";
            break;
        case 'media':
            icon = <Film className="w-4 h-4" style={{ color: '#0d9488' }} />;
            title = "ÖNERİLEN İÇERİKLER";
            break;
        case 'gift':
            icon = <Gift className="w-4 h-4" style={{ color: '#0d9488' }} />;
            title = "HEDİYE FİKİRLERİ";
            break;
        case 'product':
        default:
            icon = <ShoppingBag className="w-4 h-4" style={{ color: '#0d9488' }} />;
            title = "ÖNERİLEN MODELLER";
            break;
    }

    return (
        <div className="mb-6">
            <h3
                className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"
                style={{ color: 'var(--text-muted)' }}
            >
                {icon}
                {title}
            </h3>
            <div className="grid grid-cols-1 gap-3">
                {suggestions.map((item, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-2xl flex items-start gap-4"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-secondary)',
                        }}
                    >
                        {/* Soft Teal Badge */}
                        <div
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                backgroundColor: 'rgba(13, 148, 136, 0.15)',
                            }}
                        >
                            <span className="text-sm font-semibold" style={{ color: '#2dd4bf' }}>{idx + 1}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[15px] leading-snug mb-1" style={{ color: 'var(--text-primary)' }}>
                                {item.name}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

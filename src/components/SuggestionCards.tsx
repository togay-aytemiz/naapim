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
    let icon = <ShoppingBag className="w-4 h-4" />;
    let title = "ÖNERİLENLER";

    switch (type) {
        case 'food':
            icon = <Utensils className="w-4 h-4" />;
            title = "ÖNERİLEN LEZZETLER";
            break;
        case 'activity':
            icon = <Calendar className="w-4 h-4" />;
            title = "ÖNERİLEN AKTİVİTELER";
            break;
        case 'travel':
            icon = <Plane className="w-4 h-4" />;
            title = "ÖNERİLEN ROTALAR";
            break;
        case 'media':
            icon = <Film className="w-4 h-4" />;
            title = "ÖNERİLEN İÇERİKLER";
            break;
        case 'gift':
            icon = <Gift className="w-4 h-4" />;
            title = "HEDİYE FİKİRLERİ";
            break;
        case 'product':
        default:
            icon = <ShoppingBag className="w-4 h-4" />;
            title = "ÖNERİLEN MODELLER";
            break;
    }

    return (
        <div className="mb-6">
            <h3
                className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: 'var(--text-muted)' }}
            >
                {icon}
                {title}
            </h3>
            <div className="grid grid-cols-1 gap-3">
                {suggestions.map((item, idx) => (
                    <div
                        key={idx}
                        className="p-3 rounded-xl flex items-start gap-3 transition-colors hover:bg-neutral-50"
                        style={{
                            border: '1px solid var(--border-secondary)',
                            backgroundColor: 'var(--bg-secondary)'
                        }}
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-100 shadow-sm">
                            <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-gray-900 leading-tight mb-1">
                                {item.name}
                            </p>
                            <p className="text-xs text-gray-500 leading-normal">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

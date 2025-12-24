import type { FeelingType } from '../../services/saveOutcome';

// Sentiment styles for analysis display
export const sentimentStyles: Record<string, { bg: string; border: string; text: string }> = {
    positive: { bg: 'var(--emerald-50)', border: 'var(--emerald-300)', text: 'var(--emerald-700)' },
    cautious: { bg: 'var(--amber-50)', border: 'var(--amber-300)', text: 'var(--amber-700)' },
    warning: { bg: 'var(--orange-50)', border: 'var(--orange-300)', text: 'var(--orange-700)' },
    negative: { bg: 'var(--red-50)', border: 'var(--red-300)', text: 'var(--red-700)' },
    neutral: { bg: 'var(--neutral-100)', border: 'var(--neutral-300)', text: 'var(--neutral-700)' }
};

// Outcome type labels in Turkish
export const outcomeLabels: Record<string, string> = {
    decided: 'Karar verdim',
    thinking: 'Hala düşünüyorum',
    cancelled: 'Vazgeçtim'
};

// Feeling labels and icons
export const feelingOptions: { type: FeelingType; label: string; emoji: string; color: string }[] = [
    { type: 'happy', label: 'Mutlu', emoji: '😊', color: 'var(--emerald-600)' },
    { type: 'neutral', label: 'Nötr', emoji: '😐', color: 'var(--neutral-500)' },
    { type: 'regret', label: 'Pişman', emoji: '😔', color: 'var(--amber-600)' },
    { type: 'uncertain', label: 'Kararsız', emoji: '🤔', color: 'var(--blue-600)' }
];

// Moderation loading messages
export const moderationMessages = [
    "Topluluk kurallarına uygunluğu kontrol ediliyor...",
    "Yazım yanlışları düzeltiliyor...",
    "Dilbilgisi kurallarına bakılıyor...",
    "Mesajın inceleniyor...",
    "İçerik güvenliği değerlendiriliyor...",
    "Son düzenlemeler yapılıyor...",
    "Neredeyse bitti..."
];

// Badge colors for feeling display
export const feelingBadgeColors: Record<string, { bg: string; text: string }> = {
    happy: { bg: 'var(--emerald-100)', text: 'var(--emerald-700)' },
    neutral: { bg: 'var(--neutral-200)', text: 'var(--neutral-700)' },
    regret: { bg: 'var(--amber-100)', text: 'var(--amber-700)' },
    uncertain: { bg: 'var(--blue-100)', text: 'var(--blue-700)' }
};

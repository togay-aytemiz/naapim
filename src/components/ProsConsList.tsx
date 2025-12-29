import React from 'react';

interface ProsConsListProps {
    pros?: string[];
    cons?: string[];
}

export const ProsConsList: React.FC<ProsConsListProps> = ({ pros, cons }) => {
    if ((!pros || pros.length === 0) && (!cons || cons.length === 0)) return null;

    return (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Artılar */}
            {pros && pros.length > 0 && (
                <div
                    className="p-4 rounded-xl"
                    style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}
                >
                    <h4
                        className="text-sm font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--emerald-500)' }}
                    >
                        Artılar
                    </h4>
                    <ul className="space-y-2">
                        {pros.map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span
                                    className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                                    style={{ backgroundColor: 'var(--emerald-500)' }}
                                />
                                <span
                                    className="text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {pro}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Eksiler */}
            {cons && cons.length > 0 && (
                <div
                    className="p-4 rounded-xl"
                    style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                >
                    <h4
                        className="text-sm font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--red-500)' }}
                    >
                        Eksiler
                    </h4>
                    <ul className="space-y-2">
                        {cons.map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span
                                    className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                                    style={{ backgroundColor: 'var(--red-500)' }}
                                />
                                <span
                                    className="text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {con}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

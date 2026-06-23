import React from 'react';

export default function EvidenceGallery({ assets }) {
    if (!assets || assets.length === 0) {
        return (
            <div className="border border-dashed border-[var(--color-rule)] rounded-sm p-6 text-center text-sm text-[var(--color-ink-soft)]">
                No evidence or media records linked to this grant and month.
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule">
                <h3 className="font-display text-base font-semibold tracking-tight">Linked evidence & media</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--color-rule)]">
                {assets.map(asset => (
                    <div key={asset.record_id} className="bg-[var(--color-paper-raised)] flex flex-col">
                        <div className="aspect-video bg-[var(--color-rule-soft)] overflow-hidden relative">
                            <img
                                src={`/images/${asset.file_name}`}
                                alt={asset.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            <span className="absolute top-2 left-2 bg-[var(--color-ink)]/85 text-[var(--color-paper)] text-[9px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-sm">
                                {asset.record_type === 'news_clipping' ? 'News clipping' : 'Image'}
                            </span>
                        </div>
                        <div className="p-3 flex-1">
                            <h4 className="text-xs font-semibold text-[var(--color-ink)] leading-snug">{asset.title}</h4>
                            <p className="text-[11px] text-[var(--color-ink-soft)] mt-1 leading-relaxed line-clamp-3">
                                {asset.summary_or_caption}
                            </p>
                            <p className="text-[10px] font-mono-num text-[var(--color-ink-soft)] mt-2 pt-2 border-t border-[var(--color-rule-soft)]">
                                {asset.record_id}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
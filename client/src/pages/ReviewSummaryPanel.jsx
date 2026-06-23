import React, { useState, useEffect } from 'react';
import client from '../api/client.js';
import ExportButton from '../components/shared/ExportButton.jsx';

function Section({ title, items, accentVar }) {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">{title}</h4>
            <ul className="space-y-1.5">
                {items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--color-ink)] leading-relaxed">
                        <span className="inline-block w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: `var(${accentVar})` }} />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function ReviewSummaryPanel({ filters, aiEnabled }) {
    const [insight, setInsight] = useState(null);
    const [narrative, setNarrative] = useState('');
    const [source, setSource] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!filters.month) return;
        setLoading(true);
        setNarrative('');
        client.getReviewSummary(filters).then(res => {
            if (res.success) setInsight(res.data);
            setLoading(false);
        });
    }, [filters]);

    const generate = async () => {
        if (!insight) return;
        setGenerating(true);
        try {
            const res = await client.generateReviewNarrative(insight);
            if (res.success) {
                setNarrative(res.narrative);
                setSource(res.source);
            }
        } finally {
            setGenerating(false);
        }
    };

    if (loading || !insight) {
        return <div className="h-40 bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm animate-pulse" />;
    }

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule flex items-center justify-between">
                <div>
                    <h3 className="font-display text-base font-semibold tracking-tight">Monthly review summary</h3>
                    <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
                        {insight.month}{insight.previousMonth ? ` · compared to ${insight.previousMonth}` : ' · no prior month for comparison'}
                    </p>
                </div>
                <button
                    onClick={generate}
                    disabled={generating}
                    className="bg-[var(--color-accent)] text-[var(--color-paper)] text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                    {generating ? 'Writing…' : 'Generate narrative'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-rule)]">
                <div className="bg-[var(--color-paper-raised)] p-5 space-y-4">
                    <Section title="Achievements" items={insight.achievements} accentVar="--color-on-track" />
                </div>
                <div className="bg-[var(--color-paper-raised)] p-5 space-y-4">
                    <Section title="Risks" items={insight.risks} accentVar="--color-at-risk" />
                </div>
            </div>

            <div className="px-5 py-4 ledger-rule">
                <Section title="Discussion points for review meeting" items={insight.discussionPoints} accentVar="--color-accent" />
            </div>

            {narrative && (
                <div className="px-5 py-4">
                    <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">{narrative}</div>
                    <div className="mt-4 pt-3 border-t border-[var(--color-rule-soft)] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${source === 'groq' ? 'bg-[var(--color-on-track)]' : 'bg-[var(--color-behind)]'}`} />
                            <span className="text-[11px] text-[var(--color-ink-soft)]">
                                {source === 'groq' ? 'AI-generated, grounded in the structured insight above' : 'Deterministic fallback — AI unavailable'}
                            </span>
                        </div>
                        <ExportButton text={narrative} filename={`review-summary-${insight.month}.txt`} />
                    </div>
                </div>
            )}
        </div>
    );
}
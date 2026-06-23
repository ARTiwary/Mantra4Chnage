import React, { useState, useEffect } from 'react';
import client from '../api/client.js';

const PRIORITY_STYLE = {
    High: { text: 'text-[var(--color-at-risk)]', bg: 'bg-[var(--color-at-risk-bg)]' },
    Medium: { text: 'text-[var(--color-behind)]', bg: 'bg-[var(--color-behind-bg)]' },
    Low: { text: 'text-[var(--color-on-track)]', bg: 'bg-[var(--color-on-track-bg)]' }
};

export default function RecommendedActions({ filters }) {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!filters.month) return;
        setLoading(true);
        client.getRecommendedActions(filters).then(res => {
            if (res.success) setActions(res.data);
            setLoading(false);
        });
    }, [filters]);

    if (loading) {
        return <div className="h-32 bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm animate-pulse" />;
    }

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule flex items-center justify-between">
                <h3 className="font-display text-base font-semibold tracking-tight">Recommended next actions</h3>
                <span className="font-mono-num text-[11px] text-[var(--color-ink-soft)]">{actions.length} actions</span>
            </div>

            {actions.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-[var(--color-ink-soft)]">
                    No urgent follow-up actions generated for this filter selection.
                </div>
            ) : (
                <div className="divide-y divide-[var(--color-rule)]">
                    {actions.map(a => {
                        const style = PRIORITY_STYLE[a.priority] || PRIORITY_STYLE.Medium;
                        return (
                            <div key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm ${style.bg} ${style.text}`}>
                                    {a.priority}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--color-ink)]">{a.title}</p>
                                    <p className="text-[12px] text-[var(--color-ink-soft)] mt-0.5">{a.context}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[var(--color-ink-soft)]">
                                        <span><strong className="font-medium text-[var(--color-ink)]">Owner:</strong> {a.owner}</span>
                                        <span><strong className="font-medium text-[var(--color-ink)]">Due:</strong> <span className="font-mono-num">{a.dueDate}</span></span>
                                        <span><strong className="font-medium text-[var(--color-ink)]">Metric:</strong> {a.linkedMetric}</span>
                                        <span><strong className="font-medium text-[var(--color-ink)]">Status:</strong> {a.status}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
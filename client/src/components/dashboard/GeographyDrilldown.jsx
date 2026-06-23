import React, { useState, useEffect } from 'react';
import client from '../../api/client.js';
import RiskBadge from './RiskBadge.jsx';
import ExportButton from '../shared/ExportButton.jsx';

export default function GeographyDrilldown({ type, name, month, onClose }) {
    const [insight, setInsight] = useState(null);
    const [narrative, setNarrative] = useState('');
    const [source, setSource] = useState(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        setInsight(null);
        setNarrative('');
        client.getGeographySummary(type, name, month).then(res => {
            if (res.success) setInsight(res.data);
        });
    }, [type, name, month]);

    const generate = async () => {
        if (!insight) return;
        setGenerating(true);
        try {
            const res = await client.generateGeographyNarrative(insight);
            if (res.success) {
                setNarrative(res.narrative);
                setSource(res.source);
            }
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--color-ink)]/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div
                className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm max-w-xl w-full max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-3 ledger-rule flex items-center justify-between sticky top-0 bg-[var(--color-paper-raised)]">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                            {type === 'district' ? 'District' : 'Block'} report
                        </p>
                        <h3 className="font-display text-base font-semibold tracking-tight">{name}</h3>
                    </div>
                    <button onClick={onClose} className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] text-xl leading-none px-2">×</button>
                </div>

                {!insight ? (
                    <div className="p-8 text-center text-sm text-[var(--color-ink-soft)]">Loading…</div>
                ) : (
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <RiskBadge status={insight.calculatedRisk} />
                            {insight.movement && (
                                <span className="font-mono-num text-[11px] text-[var(--color-ink-soft)]">
                                    {insight.movement.attendanceRateDelta >= 0 ? '+' : ''}{insight.movement.attendanceRateDelta.toFixed(1)}pp attendance vs {insight.previousMonth}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
                            <Stat label="Completion" value={`${(insight.headline.completionRate * 100).toFixed(1)}%`} />
                            <Stat label="Evidence" value={`${(insight.headline.evidenceRate * 100).toFixed(1)}%`} />
                            <Stat label="Attendance" value={`${(insight.headline.overallAttendanceRate * 100).toFixed(1)}%`} />
                        </div>

                        <button
                            onClick={generate}
                            disabled={generating}
                            className="w-full bg-[var(--color-accent)] text-[var(--color-paper)] text-xs font-semibold uppercase tracking-wider px-4 py-2.5 rounded-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                            {generating ? 'Writing…' : 'Generate geography update'}
                        </button>

                        {narrative && (
                            <div>
                                <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">{narrative}</div>
                                <div className="mt-3 pt-3 border-t border-[var(--color-rule-soft)] flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-[var(--color-ink-soft)]">
                                        {source === 'groq' ? 'AI-generated' : 'Deterministic fallback'}
                                    </span>
                                    <ExportButton text={narrative} filename={`${name.replace(/\s+/g, '-').toLowerCase()}-${month}.txt`} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="bg-[var(--color-paper-raised)] p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">{label}</div>
            <div className="font-mono-num text-lg font-semibold mt-1">{value}</div>
        </div>
    );
}
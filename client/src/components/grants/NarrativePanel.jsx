import React, { useState } from 'react';
import client from '../../api/client.js';

export default function NarrativePanel({ performance, finances, aiEnabled }) {
    const [narrative, setNarrative] = useState('');
    const [source, setSource] = useState(null); // 'groq' | 'deterministic'
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if (!performance) return;
        setLoading(true);
        try {
            const res = await client.generateNarrative(performance, finances);
            if (res.success) {
                setNarrative(res.narrative);
                setSource(res.source);
            }
        } catch (err) {
            setNarrative('Could not generate a narrative right now. Try again in a moment.');
            setSource('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule flex items-center justify-between">
                <div>
                    <h3 className="font-display text-base font-semibold tracking-tight">Report section</h3>
                    <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
                        {aiEnabled ? 'Generated from computed facts via Groq' : 'AI disabled — deterministic fact summary'}
                    </p>
                </div>
                <button
                    onClick={generate}
                    disabled={loading || !performance}
                    className="bg-[var(--color-accent)] text-[var(--color-paper)] text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                    {loading ? 'Generating…' : 'Generate report section'}
                </button>
            </div>

            <div className="p-5">
                {narrative ? (
                    <>
                        <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap font-body">
                            {narrative}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[var(--color-rule-soft)] flex items-center gap-2">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${source === 'groq' ? 'bg-[var(--color-on-track)]' : 'bg-[var(--color-behind)]'}`} />
                            <span className="text-[11px] text-[var(--color-ink-soft)]">
                                {source === 'groq'
                                    ? 'AI-generated narrative — grounded in the fact panel above, no figures invented'
                                    : 'Deterministic fact summary — same facts, assembled without an AI call'}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 text-sm text-[var(--color-ink-soft)]">
                        Generate a report-ready paragraph built only from the facts shown above.
                    </div>
                )}
            </div>
        </div>
    );
}
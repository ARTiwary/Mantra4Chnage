import React from 'react';
import RiskBadge from '../dashboard/RiskBadge.jsx';

function FactStat({ label, value }) {
    return (
        <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">{label}</div>
            <div className="font-mono-num text-xl font-semibold text-[var(--color-ink)]">{value}</div>
        </div>
    );
}

export default function GrantFactPanel({ performance, finances }) {
    if (!performance) {
        return (
            <div className="border border-dashed border-[var(--color-rule)] rounded-sm p-10 text-center text-sm text-[var(--color-ink-soft)]">
                Select a grant and reporting month to view its fact panel.
            </div>
        );
    }

    const pct = (v) => `${((v || 0) * 100).toFixed(1)}%`;

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule flex items-center justify-between">
                <div>
                    <h3 className="font-display text-base font-semibold tracking-tight">{performance.grant_name}</h3>
                    <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
                        {performance.donor} · {performance.covered_districts}
                    </p>
                </div>
                <RiskBadge status={performance.risk_status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-rule)]">
                <div className="bg-[var(--color-paper-raised)] p-4">
                    <FactStat label="Schools sampled" value={performance.sampled_school_records} />
                </div>
                <div className="bg-[var(--color-paper-raised)] p-4">
                    <FactStat label="Completion rate" value={pct(performance.pbl_completion_rate)} />
                </div>
                <div className="bg-[var(--color-paper-raised)] p-4">
                    <FactStat label="Evidence rate" value={pct(performance.evidence_submission_rate)} />
                </div>
                <div className="bg-[var(--color-paper-raised)] p-4">
                    <FactStat label="Attendance rate" value={pct(performance.attendance_rate)} />
                </div>
            </div>

            <div className="px-5 py-4 ledger-rule">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                    Milestone summary
                </div>
                <p className="text-sm text-[var(--color-ink)] leading-relaxed">{performance.milestone_summary || 'No milestone notes for this period.'}</p>
            </div>

            <div className="px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
                    Budget utilization by line
                </div>
                <div className="space-y-3">
                    {finances.map(f => (
                        <div key={f.budget_line}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-[var(--color-ink)]">{f.budget_line}</span>
                                <span className="font-mono-num text-[var(--color-ink-soft)]">{pct(f.cumulative_utilization_rate)}</span>
                            </div>
                            <div className="h-1.5 bg-[var(--color-rule-soft)] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${Math.min((f.cumulative_utilization_rate || 0) * 100, 100)}%`,
                                        backgroundColor: (f.cumulative_utilization_rate || 0) > 0.9 ? 'var(--color-at-risk)' : 'var(--color-accent)'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                    {finances.length === 0 && (
                        <p className="text-xs text-[var(--color-ink-soft)]">No finance rows for this period.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
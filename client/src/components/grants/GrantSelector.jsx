import React from 'react';

const FIELD_CLS = "w-full bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm px-3 py-2 text-sm font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors cursor-pointer appearance-none";

export default function GrantSelector({ grants, months, selectedGrant, selectedMonth, onGrantChange, onMonthChange }) {
    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule">
                <span className="font-display text-sm font-semibold tracking-tight">Select grant & reporting month</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--color-rule)]">
                <div className="bg-[var(--color-paper-raised)] px-4 py-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                        Grant
                    </label>
                    <select value={selectedGrant} onChange={(e) => onGrantChange(e.target.value)} className={FIELD_CLS}>
                        <option value="">Choose a grant…</option>
                        {grants.map(g => (
                            <option key={g.grant_id} value={g.grant_id}>
                                {g.grant_name} — {g.donor}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="bg-[var(--color-paper-raised)] px-4 py-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                        Reporting month
                    </label>
                    <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className={FIELD_CLS}>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
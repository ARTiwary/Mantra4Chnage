import React from 'react';

const FIELD_CLS = "w-full bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm px-3 py-2 text-sm font-medium text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors cursor-pointer appearance-none";

export default function FilterBar({ filters, options, onChange }) {
    const handle = (e) => {
        const { name, value } = e.target;
        onChange(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'district' ? { block: '' } : {})
        }));
    };

    // Only show blocks belonging to the selected district, once one is chosen
    const visibleBlocks = filters.district
        ? options.blocks.filter(b => b.startsWith(filters.district + ' -'))
        : options.blocks;

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule flex items-center justify-between">
                <span className="font-display text-sm font-semibold tracking-tight">Filter this review</span>
                <span className="font-mono-num text-[11px] text-[var(--color-ink-soft)]">
                    {filters.month || 'all months'}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-px bg-[var(--color-rule)]">
                <FilterField label="Month">
                    <select name="month" value={filters.month} onChange={handle} className={FIELD_CLS}>
                        {options.months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </FilterField>

                <FilterField label="District">
                    <select name="district" value={filters.district} onChange={handle} className={FIELD_CLS}>
                        <option value="">All districts</option>
                        {options.districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </FilterField>

                <FilterField label="Block">
                    <select name="block" value={filters.block} onChange={handle} className={FIELD_CLS} disabled={!filters.district}>
                        <option value="">All blocks</option>
                        {visibleBlocks.map(b => <option key={b} value={b}>{b.split(' - ')[1] || b}</option>)}
                    </select>
                </FilterField>

                <FilterField label="Grade">
                    <select name="grade" value={filters.grade} onChange={handle} className={FIELD_CLS}>
                        <option value="">All grades</option>
                        {options.grades.map(g => <option key={g} value={g}>Class {g}</option>)}
                    </select>
                </FilterField>

                <FilterField label="Subject">
                    <select name="subject" value={filters.subject} onChange={handle} className={FIELD_CLS}>
                        <option value="">All subjects</option>
                        {options.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </FilterField>
            </div>
        </div>
    );
}

function FilterField({ label, children }) {
    return (
        <div className="bg-[var(--color-paper-raised)] px-4 py-3">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                {label}
            </label>
            {children}
        </div>
    );
}
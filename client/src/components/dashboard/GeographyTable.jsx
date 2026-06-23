import React from 'react';
import RiskBadge, { riskBarColor } from './RiskBadge.jsx';

export default function GeographyTable({ title, rows, emptyLabel = 'No records for this selection', onRowClick }) {
    const sorted = [...rows].sort((a, b) => a.overallAttendanceRate - b.overallAttendanceRate);

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm flex flex-col">
            <div className="px-5 py-3 ledger-rule flex items-baseline justify-between">
                <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
                <span className="font-mono-num text-[11px] text-[var(--color-ink-soft)]">{rows.length} entries</span>
            </div>

            {sorted.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-[var(--color-ink-soft)]">{emptyLabel}</div>
            ) : (
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[480px]">
                        <thead>
                            <tr className="ledger-rule">
                                <th className="w-1.5"></th>
                                <th className="py-2 pl-2 pr-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">Name</th>
                                <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] text-right">Schools</th>
                                <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] text-right">Completion</th>
                                <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] text-right">Attendance</th>
                                <th className="py-2 pl-3 pr-5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((r, i) => (
                                <tr
                                    key={r.name}
                                    className={`${i < sorted.length - 1 ? 'ledger-rule' : ''} ${onRowClick ? 'cursor-pointer hover:bg-[var(--color-paper)] transition-colors' : ''}`}
                                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                                >
                                    <td className="w-1.5 p-0">
                                        <div className="w-1.5 h-full" style={{ backgroundColor: riskBarColor(r.calculatedRisk) }} />
                                    </td>
                                    <td className="py-2.5 pl-2 pr-3 text-sm font-medium">{r.name}</td>
                                    <td className="py-2.5 px-3 text-sm font-mono-num text-right text-[var(--color-ink-soft)]">{r.totalSchools}</td>
                                    <td className="py-2.5 px-3 text-sm font-mono-num text-right">{(r.completionRate * 100).toFixed(1)}%</td>
                                    <td className="py-2.5 px-3 text-sm font-mono-num text-right">{(r.overallAttendanceRate * 100).toFixed(1)}%</td>
                                    <td className="py-2.5 pl-3 pr-5 text-right">
                                        <RiskBadge status={r.calculatedRisk} size="sm" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
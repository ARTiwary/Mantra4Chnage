import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SERIES = [
    { key: 'completionRate', label: 'Completion', color: '#c25e2e' },
    { key: 'evidenceRate', label: 'Evidence', color: '#2f6b4f' },
    { key: 'overallAttendanceRate', label: 'Attendance', color: '#1c2b24' }
];

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm px-3 py-2 shadow-sm">
            <div className="font-mono-num text-[11px] text-[var(--color-ink-soft)] mb-1">{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[var(--color-ink-soft)]">{p.name}</span>
                    <span className="font-mono-num font-medium ml-auto">{(p.value * 100).toFixed(1)}%</span>
                </div>
            ))}
        </div>
    );
}

export default function TrendChart({ monthlySummaries }) {
    if (!monthlySummaries || monthlySummaries.length === 0) return null;

    return (
        <div className="bg-[var(--color-paper-raised)] border border-[var(--color-rule)] rounded-sm">
            <div className="px-5 py-3 ledger-rule flex items-center justify-between">
                <h3 className="font-display text-base font-semibold tracking-tight">Trend across reporting months</h3>
                <div className="flex items-center gap-4">
                    {SERIES.map(s => (
                        <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-soft)]">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.label}
                        </span>
                    ))}
                </div>
            </div>
            <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySummaries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke="var(--color-rule-soft)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}
                            axisLine={{ stroke: 'var(--color-rule)' }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={(v) => `${Math.round(v * 100)}%`}
                            tick={{ fontSize: 11, fill: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {SERIES.map(s => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color}
                                strokeWidth={2}
                                dot={{ r: 3, strokeWidth: 0, fill: s.color }}
                                activeDot={{ r: 5 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
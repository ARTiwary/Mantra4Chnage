import React from 'react';

function MovementTag({ delta }) {
    if (delta === undefined || delta === null) return null;
    const isUp = delta > 0;
    const isFlat = delta === 0;
    const color = isFlat ? 'text-[var(--color-ink-soft)]' : isUp ? 'text-[var(--color-on-track)]' : 'text-[var(--color-at-risk)]';
    const arrow = isFlat ? '→' : isUp ? '↑' : '↓';
    return (
        <span className={`font-mono-num text-[11px] font-medium ${color}`}>
            {arrow} {Math.abs(delta).toFixed(1)}pp
        </span>
    );
}

export default function KpiCards({ data }) {
    if (!data) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="bg-[var(--color-paper-raised)] p-5 h-28 animate-pulse" />
                ))}
            </div>
        );
    }

    const movement = data.movement;

    const cards = [
        {
            label: 'Schools participating',
            value: `${data.conductedCount.toLocaleString()}`,
            sub: `of ${data.totalSchools.toLocaleString()} schools`,
            delta: null
        },
        {
            label: 'PBL completion rate',
            value: `${(data.completionRate * 100).toFixed(1)}%`,
            sub: 'conducted this month',
            delta: movement?.completionRateDelta
        },
        {
            label: 'Evidence submission rate',
            value: `${(data.evidenceRate * 100).toFixed(1)}%`,
            sub: 'verified uploads',
            delta: movement?.evidenceRateDelta
        },
        {
            label: 'Attendance rate',
            value: `${(data.overallAttendanceRate * 100).toFixed(1)}%`,
            sub: `${data.totalEnrollment.toLocaleString()} students enrolled`,
            delta: movement?.attendanceRateDelta
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-rule)] border border-[var(--color-rule)]">
            {cards.map((c, i) => (
                <div key={i} className="bg-[var(--color-paper-raised)] p-5 flex flex-col justify-between min-h-28">
                    <span className="font-display text-[13px] text-[var(--color-ink-soft)] leading-tight">{c.label}</span>
                    <div>
                        <div className="font-mono-num text-3xl font-semibold tracking-tight text-[var(--color-ink)] mt-1">
                            {c.value}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[11px] text-[var(--color-ink-soft)]">{c.sub}</span>
                            <MovementTag delta={c.delta} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
import React from 'react';

const RISK_STYLES = {
    'On Track': { text: 'text-[var(--color-on-track)]', bg: 'bg-[var(--color-on-track-bg)]', dot: 'bg-[var(--color-on-track)]' },
    'Behind':   { text: 'text-[var(--color-behind)]',   bg: 'bg-[var(--color-behind-bg)]',   dot: 'bg-[var(--color-behind)]' },
    'At Risk':  { text: 'text-[var(--color-at-risk)]',  bg: 'bg-[var(--color-at-risk-bg)]',  dot: 'bg-[var(--color-at-risk)]' },
    'Critical': { text: 'text-[var(--color-critical)]', bg: 'bg-[var(--color-critical-bg)]', dot: 'bg-[var(--color-critical)]' }
};

const DEFAULT_STYLE = { text: 'text-ink-soft', bg: 'bg-rule-soft', dot: 'bg-ink-soft' };


export default function RiskBadge({ status, size = 'md' }) {
    const style = RISK_STYLES[status] || DEFAULT_STYLE;
    const sizing = size === 'sm'
        ? 'text-[10px] px-2 py-0.5 gap-1.5'
        : 'text-xs px-2.5 py-1 gap-2';

    return (
        <span className={`inline-flex items-center font-medium rounded-sm ${style.bg} ${style.text} ${sizing}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
            {status || 'Unknown'}
        </span>
    );
}

export function riskBarColor(status) {
    switch (status) {
        case 'On Track': return 'var(--color-on-track)';
        case 'Behind': return 'var(--color-behind)';
        case 'At Risk': return 'var(--color-at-risk)';
        case 'Critical': return 'var(--color-critical)';
        default: return 'var(--color-rule)';
    }
}
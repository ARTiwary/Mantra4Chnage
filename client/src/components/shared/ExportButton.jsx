import React, { useState } from 'react';

export default function ExportButton({ text, filename = 'report.txt' }) {
    const [copied, setCopied] = useState(false);

    if (!text) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // Clipboard API can fail in non-HTTPS/non-permitted contexts;
            // fail silently rather than throwing in the UI.
        }
    };

    const handleDownload = () => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleCopy}
                className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-sm border border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
                {copied ? 'Copied' : 'Copy'}
            </button>
            <button
                onClick={handleDownload}
                className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-sm border border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
                Download .txt
            </button>
        </div>
    );
}
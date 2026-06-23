import React, { useState } from 'react';
import ReviewDashboard from './pages/ReviewDashboard.jsx';
import GrantReporting from './pages/GrantReporting.jsx';

const TABS = [
    { id: 'dashboard', label: 'Program review', detail: 'Filters, KPIs, district & block performance' },
    { id: 'grants', label: 'Grant reporting', detail: 'Facts, evidence, report-ready narrative' }
];

export default function App() {
    const [tab, setTab] = useState('dashboard');
    const active = TABS.find(t => t.id === tab);

    return (
        <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex flex-col lg:flex-row">
            {/* Vertical tab rail — the signature layout element: a numbered
                ledger index rather than a boxed sidebar nav. */}
            <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-[var(--color-rule)] shrink-0 bg-[var(--color-paper-raised)]">
                <div className="px-6 py-6 border-b border-[var(--color-rule)]">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">Mantra4Change</p>
                    <h1 className="font-display text-xl font-semibold tracking-tight mt-1 leading-tight">
                        PBL Program<br />Intelligence
                    </h1>
                </div>
                <nav className="flex lg:flex-col">
                    {TABS.map((t, i) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`group flex-1 lg:flex-none text-left px-6 py-4 border-b lg:border-b border-[var(--color-rule)] transition-colors relative ${
                                tab === t.id ? 'bg-[var(--color-paper)]' : 'hover:bg-[var(--color-paper)]/60'
                            }`}
                        >
                            <span
                                className="absolute left-0 top-0 bottom-0 w-0.5"
                                style={{ backgroundColor: tab === t.id ? 'var(--color-accent)' : 'transparent' }}
                            />
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono-num text-[11px] text-[var(--color-ink-soft)]">0{i + 1}</span>
                                <span className={`text-sm font-semibold ${tab === t.id ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'}`}>
                                    {t.label}
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-ink-soft)] mt-1 hidden lg:block">{t.detail}</p>
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="border-b border-[var(--color-rule)] bg-[var(--color-paper-raised)] px-6 sm:px-10 py-5">
                    <h2 className="font-display text-lg font-semibold tracking-tight">{active.label}</h2>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{active.detail}</p>
                </header>
                <main className="flex-1 px-6 sm:px-10 py-8 max-w-[1400px] w-full mx-auto">
                    {tab === 'dashboard' ? <ReviewDashboard /> : <GrantReporting />}
                </main>
            </div>
        </div>
    );
}
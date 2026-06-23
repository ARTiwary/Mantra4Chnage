import React, { useState, useEffect } from 'react';
import client from '../api/client.js';
import GrantSelector from '../components/grants/GrantSelector.jsx';
import GrantFactPanel from '../components/grants/GrantFactPanel.jsx';
import EvidenceGallery from '../components/grants/EvidenceGallery.jsx';
import NarrativePanel from '../components/grants/NarrativePanel.jsx';

export default function GrantReporting() {
    const [grants, setGrants] = useState([]);
    const [months, setMonths] = useState([]);
    const [selectedGrant, setSelectedGrant] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [details, setDetails] = useState(null);
    const [aiEnabled, setAiEnabled] = useState(false);

    useEffect(() => {
        client.getGrantList().then(res => {
            if (res.success) {
                setGrants(res.data.grants);
                setMonths(res.data.months);
                setSelectedGrant(res.data.grants[0]?.grant_id || '');
                setSelectedMonth(res.data.months[res.data.months.length - 1] || '');
            }
        });
        client.getAiStatus().then(res => {
            if (res.success) setAiEnabled(res.data.aiEnabled);
        });
    }, []);

    useEffect(() => {
        if (!selectedGrant || !selectedMonth) return;
        client.getGrantDetails(selectedGrant, selectedMonth).then(res => {
            if (res.success) setDetails(res.data);
        });
    }, [selectedGrant, selectedMonth]);

    return (
        <div className="space-y-6">
            <GrantSelector
                grants={grants}
                months={months}
                selectedGrant={selectedGrant}
                selectedMonth={selectedMonth}
                onGrantChange={setSelectedGrant}
                onMonthChange={setSelectedMonth}
            />

            {!aiEnabled && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-behind)] bg-[var(--color-behind-bg)] px-4 py-2.5 rounded-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-behind)]" />
                    AI narrative generation is disabled (no GROQ_API_KEY configured). Report sections will use the deterministic fact summary — every dashboard metric and fact panel still works fully.
                </div>
            )}

            <GrantFactPanel performance={details?.performance} finances={details?.finances || []} />
            <EvidenceGallery assets={details?.media || []} />
            <NarrativePanel performance={details?.performance} finances={details?.finances || []} aiEnabled={aiEnabled} />
        </div>
    );
}
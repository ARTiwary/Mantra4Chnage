import React, { useState, useEffect } from 'react';
import client from '../api/client.js';
import FilterBar from '../components/filters/FilterBar.jsx';
import KpiCards from '../components/dashboard/KpiCards.jsx';
import TrendChart from '../components/dashboard/TrendChart.jsx';
import GeographyTable from '../components/dashboard/GeographyTable.jsx';
import GeographyDrilldown from '../components/dashboard/GeographyDrilldown.jsx';
import ReviewSummaryPanel from './ReviewSummaryPanel.jsx';
import RecommendedActions from './RecommendedActions.jsx';

const EMPTY_OPTIONS = { months: [], districts: [], blocks: [], subjects: [], grades: [] };

export default function ReviewDashboard() {
    const [filters, setFilters] = useState({ month: '', district: '', block: '', subject: '', grade: '' });
    const [options, setOptions] = useState(EMPTY_OPTIONS);
    const [summary, setSummary] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [trend, setTrend] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drilldown, setDrilldown] = useState(null); // Tracks modal popup state: { type, name } | null
    const [aiEnabled, setAiEnabled] = useState(false);

    // 1. Check if the backend has AI features enabled on startup
    useEffect(() => {
        client.getAiStatus().then(res => {
            if (res.success) setAiEnabled(res.data.aiEnabled);
        });
    }, []);

    // 2. Load dropdown filters once on startup, default to the latest available month
    useEffect(() => {
        client.getFilters().then(res => {
            if (res.success) {
                setOptions(res.data);
                const latestMonth = res.data.months[res.data.months.length - 1] || '';
                setFilters(f => ({ ...f, month: latestMonth }));
            }
        });
    }, []);

    // 3. Re-fetch numbers, districts, and blocks every time a filter dropdown changes
    useEffect(() => {
        if (!filters.month) return;
        setLoading(true);
        Promise.all([
            client.getSummary(filters),
            client.getDistrictBreakdown(filters),
            client.getBlockBreakdown(filters)
        ]).then(([summaryRes, districtRes, blockRes]) => {
            if (summaryRes.success) setSummary(summaryRes.data);
            if (districtRes.success) setDistricts(districtRes.data);
            if (blockRes.success) setBlocks(blockRes.data);
            setLoading(false);
        });
    }, [filters]);

    // 4. Populate the historical lines for the Trend Chart component
    useEffect(() => {
        if (options.months.length === 0) return;
        const { month, ...rest } = filters;
        Promise.all(
            options.months.map(m => client.getSummary({ ...rest, month: m }))
        ).then(results => {
            setTrend(
                results.map((res, i) => ({
                    month: options.months[i],
                    completionRate: res.success ? res.data.completionRate : 0,
                    evidenceRate: res.success ? res.data.evidenceRate : 0,
                    overallAttendanceRate: res.success ? res.data.overallAttendanceRate : 0
                }))
            );
        });
    }, [options.months, filters.district, filters.block, filters.subject, filters.grade]);

    return (
        <div className="space-y-6">
            {/* Filter Dropdowns Layout Block */}
            <FilterBar filters={filters} options={options} onChange={setFilters} />
            
            {/* High-Level Headline Stat Panels */}
            <KpiCards data={summary} />
            
            {/* Historical Progress Over Time Chart */}
            <TrendChart monthlySummaries={trend} />

            {/* Regional Performance Grids */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <GeographyTable
                    title="District performance"
                    rows={districts}
                    onRowClick={(row) => setDrilldown({ type: 'district', name: row.name })}
                />
                <GeographyTable
                    title="Block performance"
                    rows={blocks}
                    onRowClick={(row) => setDrilldown({ type: 'block', name: row.name })}
                />
            </div>
            <p className="text-[11px] text-[var(--color-ink-soft)] -mt-3">Click any row to open its detailed report.</p>

            {/* Empty State Guard */}
            {!loading && summary && summary.totalSchools === 0 && (
                <div className="text-center py-12 text-sm text-[var(--color-ink-soft)] border border-dashed border-[var(--color-rule)] rounded-sm">
                    No schools match this filter combination. Try widening the selection.
                </div>
            )}

            {/* Summary narrative generators and priority action list items */}
            {filters.month && <ReviewSummaryPanel filters={filters} aiEnabled={aiEnabled} />}
            {filters.month && <RecommendedActions filters={filters} />}

            {/* Pop-up Window Modal Drawer Trigger */}
            {drilldown && (
                <GeographyDrilldown
                    type={drilldown.type}
                    name={drilldown.name}
                    month={filters.month}
                    onClose={() => setDrilldown(null)}
                />
            )}
        </div>
    );
}
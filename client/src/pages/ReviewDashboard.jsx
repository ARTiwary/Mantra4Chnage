import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client.js';
import FilterBar from '../components/filters/FilterBar.jsx';
import KpiCards from '../components/dashboard/KpiCards.jsx';
import TrendChart from '../components/dashboard/TrendChart.jsx';
import GeographyTable from '../components/dashboard/GeographyTable.jsx';

const EMPTY_OPTIONS = { months: [], districts: [], blocks: [], subjects: [], grades: [] };

export default function ReviewDashboard() {
    const [filters, setFilters] = useState({ month: '', district: '', block: '', subject: '', grade: '' });
    const [options, setOptions] = useState(EMPTY_OPTIONS);
    const [summary, setSummary] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [trend, setTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load filter options once, default month = latest available
    useEffect(() => {
        client.getFilters().then(res => {
            if (res.success) {
                setOptions(res.data);
                const latestMonth = res.data.months[res.data.months.length - 1] || '';
                setFilters(f => ({ ...f, month: latestMonth }));
            }
        });
    }, []);

    // Refetch summary + breakdowns whenever filters change
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

    // Trend chart: fetch summary for every available month (independent of
    // the month filter, but respecting district/block/subject/grade so the
    // trend reflects the same geography slice the reviewer is looking at)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.months, filters.district, filters.block, filters.subject, filters.grade]);

    return (
        <div className="space-y-6">
            <FilterBar filters={filters} options={options} onChange={setFilters} />
            <KpiCards data={summary} />
            <TrendChart monthlySummaries={trend} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <GeographyTable title="District performance" rows={districts} />
                <GeographyTable title="Block performance" rows={blocks} />
            </div>

            {!loading && summary && summary.totalSchools === 0 && (
                <div className="text-center py-12 text-sm text-[var(--color-ink-soft)] border border-dashed border-[var(--color-rule)] rounded-sm">
                    No schools match this filter combination. Try widening the selection.
                </div>
            )}
        </div>
    );
}
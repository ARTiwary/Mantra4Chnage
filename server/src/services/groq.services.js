import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

/**
 * Groq Narrative Service
 *
 * Hard guardrail (per assignment spec): every narrative-generating workflow
 * must still produce a usable, fact-grounded report section even if AI is
 * disabled or unreachable. This service NEVER throws past its own
 * boundary — every code path returns usable text, either AI-generated or
 * a deterministic fallback built directly from computed facts.
 */
export class GroqService {
    static isEnabled() {
        return Boolean(groq);
    }

    // ---- Grant Reporting Assistant -----------------------------------------

    static buildFallbackNarrative(basePerformance, financeData = []) {
        const pct = (v) => `${((v || 0) * 100).toFixed(1)}%`;

        const financeLine = financeData.length > 0
            ? financeData
                .map(f => `${f.budget_line}: ${pct(f.cumulative_utilization_rate)} utilized`)
                .join('; ')
            : 'No finance records available for this period.';

        return [
            `Grant ${basePerformance.grant_name || basePerformance.grant_id} (${basePerformance.donor || 'donor not specified'}) — ${basePerformance.reporting_month || ''} reporting period.`,
            `PBL completion rate: ${pct(basePerformance.pbl_completion_rate)}. Evidence submission rate: ${pct(basePerformance.evidence_submission_rate)}. Attendance rate: ${pct(basePerformance.attendance_rate)}.`,
            `Current risk status: ${basePerformance.risk_status || 'Not classified'}.`,
            `Budget utilization — ${financeLine}`,
            `Milestone summary: ${basePerformance.milestone_summary || 'Not provided.'}`,
            '[Deterministic fact summary — AI narrative generation is disabled or unavailable]'
        ].join('\n');
    }

    static async generateGrantNarrative({ performanceData, financeData }) {
        const basePerformance = (performanceData && performanceData[0]) || {};
        const fallbackText = this.buildFallbackNarrative(basePerformance, financeData || []);

        const prompt = `
You are a monitoring & evaluation narrative assistant for an education NGO.
Write a professional, report-ready paragraph for a donor using ONLY the data below.
Do not invent any names, numbers, locations, or achievements not present in this data.

GRANT CONTEXT:
- Grant ID: ${basePerformance.grant_id}
- Donor: ${basePerformance.donor}
- Program: ${basePerformance.grant_name}
- Covered Districts: ${basePerformance.covered_districts}
- Reporting Month: ${basePerformance.reporting_month}

COMPUTED METRICS:
- Sampled Schools: ${basePerformance.sampled_school_records}
- PBL Completion Rate: ${((basePerformance.pbl_completion_rate || 0) * 100).toFixed(1)}%
- Evidence Submission Rate: ${((basePerformance.evidence_submission_rate || 0) * 100).toFixed(1)}%
- Attendance Rate: ${((basePerformance.attendance_rate || 0) * 100).toFixed(1)}%
- Risk Status: ${basePerformance.risk_status}
- Milestone Summary: ${basePerformance.milestone_summary}

FINANCE UTILIZATION:
${JSON.stringify((financeData || []).map(f => ({
    line: f.budget_line,
    utilization: `${((f.cumulative_utilization_rate || 0) * 100).toFixed(1)}%`,
    note: f.finance_note
})))}

INSTRUCTIONS:
1. Write 3-4 sentences, professional and objective tone.
2. Flag any metric that looks like it needs attention (e.g. low attendance, low evidence rate, low utilization).
3. Use only the figures given above — do not estimate, round dramatically, or add unstated context.
`.trim();

        return this._callWithFallback(prompt, fallbackText);
    }

    // ---- Monthly Review Summary (Tier 2) -----------------------------------

    static async generateReviewSummaryNarrative(insight) {
        const fallbackText = this.buildReviewSummaryFallback(insight);

        const prompt = `
You are writing a program review summary for an education NGO's monthly leadership meeting.
Use ONLY the structured data below. Do not invent districts, numbers, or events not listed.

REPORTING MONTH: ${insight.month}${insight.previousMonth ? ` (previous: ${insight.previousMonth})` : ''}

HEADLINE METRICS:
- Total schools: ${insight.headline.totalSchools}
- Schools that conducted PBL: ${insight.headline.conductedCount}
- Completion rate: ${(insight.headline.completionRate * 100).toFixed(1)}%
- Evidence submission rate: ${(insight.headline.evidenceRate * 100).toFixed(1)}%
- Attendance rate: ${(insight.headline.overallAttendanceRate * 100).toFixed(1)}%
- Risk distribution: ${JSON.stringify(insight.headline.riskDistribution)}

MONTH-OVER-MONTH MOVEMENT:
${insight.movement ? JSON.stringify(insight.movement) : 'No prior month available for comparison.'}

ACHIEVEMENTS (already computed deterministically):
${insight.achievements.map(a => `- ${a}`).join('\n')}

RISKS (already computed deterministically):
${insight.risks.map(r => `- ${r}`).join('\n')}

PRIORITY DISTRICTS NEEDING FOLLOW-UP:
${insight.priorityDistricts.map(d => `- ${d.name}: ${d.risk} (${(d.attendanceRate * 100).toFixed(1)}% attendance)`).join('\n') || 'None flagged.'}

PRIORITY BLOCKS NEEDING FOLLOW-UP:
${insight.priorityBlocks.map(b => `- ${b.name}: ${b.risk} (${(b.attendanceRate * 100).toFixed(1)}% attendance)`).join('\n') || 'None flagged.'}

INSTRUCTIONS:
1. Write a short program review summary (5-7 sentences) covering achievements, risks, and where to focus follow-up.
2. Use a clear, neutral tone suitable for a leadership meeting.
3. Use only the figures and names listed above — do not add unstated districts, percentages, or events.
`.trim();

        return this._callWithFallback(prompt, fallbackText);
    }

    static buildReviewSummaryFallback(insight) {
        return [
            `Program Review Summary — ${insight.month}`,
            `${insight.headline.conductedCount} of ${insight.headline.totalSchools} schools conducted PBL (${(insight.headline.completionRate * 100).toFixed(1)}% completion). Evidence submission: ${(insight.headline.evidenceRate * 100).toFixed(1)}%. Attendance: ${(insight.headline.overallAttendanceRate * 100).toFixed(1)}%.`,
            '',
            'Achievements:',
            ...insight.achievements.map(a => `- ${a}`),
            '',
            'Risks:',
            ...insight.risks.map(r => `- ${r}`),
            '',
            'Priority follow-up:',
            ...insight.priorityDistricts.slice(0, 3).map(d => `- ${d.name} (district): ${d.risk}`),
            ...insight.priorityBlocks.slice(0, 3).map(b => `- ${b.name} (block): ${b.risk}`),
            '',
            '[Deterministic summary — AI narrative generation is disabled or unavailable]'
        ].join('\n');
    }

    // ---- Program Reporting Assistant (Tier 2) ------------------------------

    static async generateGeographyNarrative(insight) {
        const fallbackText = this.buildGeographyFallback(insight);

        const prompt = `
You are writing a short program update for one geography in an education monitoring program.
Use ONLY the structured data below. Do not invent facts not listed.

GEOGRAPHY: ${insight.geographyName} (${insight.geographyType})
REPORTING MONTH: ${insight.month}${insight.previousMonth ? ` (previous: ${insight.previousMonth})` : ''}
RISK STATUS: ${insight.calculatedRisk}

METRICS:
- Total schools: ${insight.headline.totalSchools}
- Schools that conducted PBL: ${insight.headline.conductedCount}
- Completion rate: ${(insight.headline.completionRate * 100).toFixed(1)}%
- Evidence submission rate: ${(insight.headline.evidenceRate * 100).toFixed(1)}%
- Attendance rate: ${(insight.headline.overallAttendanceRate * 100).toFixed(1)}%

MONTH-OVER-MONTH MOVEMENT:
${insight.movement ? JSON.stringify(insight.movement) : 'No prior month available for comparison.'}

INSTRUCTIONS:
1. Write 3-4 sentences summarizing this geography's status and whether it needs follow-up.
2. Use only the figures given above.
`.trim();

        return this._callWithFallback(prompt, fallbackText);
    }

    static buildGeographyFallback(insight) {
        return [
            `${insight.geographyName} — ${insight.month}`,
            `Status: ${insight.calculatedRisk}.`,
            `${insight.headline.conductedCount} of ${insight.headline.totalSchools} schools conducted PBL (${(insight.headline.completionRate * 100).toFixed(1)}% completion). Attendance: ${(insight.headline.overallAttendanceRate * 100).toFixed(1)}%. Evidence: ${(insight.headline.evidenceRate * 100).toFixed(1)}%.`,
            insight.movement ? `Attendance moved ${insight.movement.attendanceRateDelta >= 0 ? '+' : ''}${insight.movement.attendanceRateDelta.toFixed(1)}pp since ${insight.previousMonth}.` : 'No prior month available for comparison.',
            '[Deterministic summary — AI narrative generation is disabled or unavailable]'
        ].join('\n');
    }

    // ---- Shared core --------------------------------------------------------

    static async _callWithFallback(prompt, fallbackText) {
        if (!groq) {
            console.log('[GroqService] No API key configured — using deterministic fallback.');
            return { narrative: fallbackText, source: 'deterministic', usedAi: false };
        }

        try {
            const response = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.2,
                max_tokens: 500
            });

            const text = response.choices?.[0]?.message?.content;
            if (!text) {
                return { narrative: fallbackText, source: 'deterministic', usedAi: false };
            }

            return { narrative: text, source: 'groq', usedAi: true };
        } catch (error) {
            console.error('[GroqService] Groq API call failed, using fallback:', error.message);
            return {
                narrative: `${fallbackText}\n\n[Note: AI narrative generation failed (${error.message}); showing deterministic fallback instead.]`,
                source: 'deterministic',
                usedAi: false,
                error: error.message
            };
        }
    }
}
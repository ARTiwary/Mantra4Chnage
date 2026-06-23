import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

/**
 * Groq Narrative Service
 *
 * Hard guardrail (per assignment spec): the grant reporting workflow must
 * still produce a usable, fact-grounded report section even if AI is
 * disabled or unreachable. This service NEVER throws past its own
 * boundary — every code path returns usable text, either AI-generated or
 * a deterministic fallback built directly from computed facts.
 *
 * The fallback is not a placeholder string — it's a real, readable summary
 * assembled from the same fact set passed to the LLM, so disabling AI
 * degrades quality, not function.
 */
export class GroqService {
    static isEnabled() {
        return Boolean(groq);
    }

    /**
     * Build the deterministic fallback narrative from computed facts only.
     * Used both as the AI-disabled output and as the recovery path if the
     * Groq call fails.
     */
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

    /**
     * Produce a report-ready narrative paragraph from grant performance and
     * finance facts. Uses Groq if configured; otherwise returns the
     * deterministic fallback directly. Never reaches outside the provided
     * data — the prompt explicitly instructs the model not to invent facts.
     */
    static async generateGrantNarrative({ performanceData, financeData }) {
        const basePerformance = (performanceData && performanceData[0]) || {};
        const fallbackText = this.buildFallbackNarrative(basePerformance, financeData || []);

        if (!groq) {
            console.log('[GroqService] No API key configured — using deterministic fallback.');
            return { narrative: fallbackText, source: 'deterministic', usedAi: false };
        }

        try {
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

            const response = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.2,
                max_tokens: 400
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
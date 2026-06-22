import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq SDK safely if an API key is provided
const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

export class GroqService {
    /**
     * Produces synthesized text for reports based on financial and performance data arrays
     */
    static async generateGrantNarrative({ performanceData, financeData }) {
        // Fallback text engine if Groq is disabled
        const basePerformance = performanceData[0] || {};
        const fallbackText = basePerformance.draft_report_text || 
            `Summary Report for ${basePerformance.grant_name || 'Grant'}: Completion rate reached ${(basePerformance.pbl_completion_rate * 100 || 0).toFixed(1)}% with an attendance rate of ${(basePerformance.attendance_rate * 100 || 0).toFixed(1)}%. Budget utilization remains within baseline targets. [Deterministic Fallback Output]`;

        if (!groq) {
            console.log('Groq client not configured. Using deterministic text fallback.');
            return fallbackText;
        }

        try {
            const prompt = `
You are an expert M&E narrative assistant at Mantra4Change.
Review these metrics carefully and generate a professional, report-ready text paragraph for the donor. 

GRANT CONTEXT:
- Grant ID: ${basePerformance.grant_id}
- Donor Name: ${basePerformance.donor}
- Program Name: ${basePerformance.grant_name}
- Target Districts: ${basePerformance.covered_districts}
- Reporting Period: ${basePerformance.reporting_month}

COMPUTED METRICS:
- Total Sampled Schools: ${basePerformance.sampled_school_records}
- PBL Project Completion: ${(basePerformance.pbl_completion_rate * 100 || 0).toFixed(1)}%
- Evidence Submission Rate: ${(basePerformance.evidence_submission_rate * 100 || 0).toFixed(1)}%
- Overall Student Attendance: ${(basePerformance.attendance_rate * 100 || 0).toFixed(1)}%
- Current Core Implementation Status: ${basePerformance.risk_status}

FINANCIAL UTILIZATION STATUS:
${JSON.stringify(financeData.map(f => ({ line: f.budget_line, rate: (f.cumulative_utilization_rate * 100).toFixed(1) + '%', status: f.finance_note })))}

INSTRUCTIONS:
1. Synthesize compliance vectors smoothly into 3-4 professional sentences.
2. Highlight areas needing corrective action (e.g., if attendance or evidence is low).
3. Do not invent any names, numbers, or facts outside of the provided variables.
4. Keep the output clean, objective, and print-ready.
`;

            const response = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama3-8b-8192',
                temperature: 0.2
            });

            return response.choices[0]?.message?.content || fallbackText;

        } catch (error) {
            console.error('Groq connection error occurred:', error.message);
            return `${fallbackText} \n\n*(Note: Narrative fallback triggered due to upstream connection constraints)*`;
        }
    }
}
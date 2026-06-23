import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import db from '../db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDataDir = path.join(__dirname, '../../data');

function cleanNumber(val) {
    if (!val) return 0;
    const cleaned = val.toString().replace(/[\s,%]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function seedPrimaryPblData() {
    console.log('--- Seeding Primary PBL Monthly Datasets ---');
    const files = [
        { month: '2025-07', filename: 'PBL_School_Response_Data_July_2025.csv' },
        { month: '2025-08', filename: 'PBL_School_Response_Data_August_2025.csv' },
        { month: '2025-09', filename: 'PBL_School_Response_Data_September_2025.csv' }
    ];

    const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO school_responses (
            reporting_month, timestamp, school_name, school_code, district_name, block_details,
            conducted_pbl, evidence_submitted, classes_covered, subject_taught,
            class6_enrollment, class6_attendance_science, class6_attendance_math,
            class7_enrollment, class7_attendance_science, class7_attendance_math,
            class8_enrollment, class8_attendance_science, class8_attendance_math,
            derived_total_enrollment, derived_total_attendance, derived_attendance_rate, derived_risk_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN TRANSACTION;');

    try {
        for (const fileSpec of files) {
            const filePath = path.join(rootDataDir, 'primary', fileSpec.filename);
            if (!fs.existsSync(filePath)) {
                console.warn(`File missing, skipping: ${fileSpec.filename}`);
                continue;
            }

            const rawContent = fs.readFileSync(filePath, 'utf-8');
            const records = parse(rawContent, { columns: true, skip_empty_lines: true });

            console.log(`Processing ${records.length} rows for month: ${fileSpec.month}`);

            for (const row of records) {
                insertStmt.run(
                    fileSpec.month, 
                    row['Timestamp'] || '', 
                    row['What is the name of your school?'] || '', 
                    row["What is your school's synthetic school code?"] || '', 
                    row['What is the name of your district?'] || '', 
                    row['Block Details'] || '',
                    row['Was the PBL project conducted in your school this month?'] || 'No', 
                    row['Was evidence submitted for the completed PBL project?'] || 'No', 
                    row['In which class/classes did you conduct the PBL project?'] || '', 
                    row['Which subject do you teach?'] || '',
                    cleanNumber(row['Total number of students enrolled in Class 6, including all sections']),
                    cleanNumber(row['Average student attendance during the Class 6 PBL Science session. If you did not teach Science in Class 6, enter 0.']),
                    cleanNumber(row['Average student attendance during the Class 6 PBL Math session. If you did not teach Math in Class 6, enter 0.']),
                    cleanNumber(row['Total number of students enrolled in Class 7, including all sections']),
                    cleanNumber(row['Average student attendance during the Class 7 PBL Science session. If you did not teach Science in Class 7, enter 0.']),
                    cleanNumber(row['Average student attendance during the Class 7 PBL Math session. If you did not teach Math in Class 7, enter 0.']),
                    cleanNumber(row['Total number of students enrolled in Class 8, including all sections']),
                    cleanNumber(row['Average student attendance during the Class 8 PBL Science session. If you did not teach Science in Class 8, enter 0.']),
                    cleanNumber(row['Average student attendance during the Class 8 PBL Math session. If you did not teach Math in Class 8, enter 0.']),
                    cleanNumber(row['Derived: Total enrollment across Classes 6-8']),
                    cleanNumber(row['Derived: Total attendance across PBL Science and Math sessions']),
                    cleanNumber(row['Derived: Overall PBL attendance rate']),
                    row['Derived: Risk status'] || 'Critical'
                );
            }
        }
        db.exec('COMMIT;');
        console.log('Primary PBL responses seeded successfully.');
    } catch (err) {
        db.exec('ROLLBACK;');
        console.error('Failed to seed primary responses:', err);
        throw err;
    }
}

function seedGrantReportingEvidence() {
    console.log('\n--- Seeding Grant Reporting Metrics & Asset Records ---');

    // 1. Finance Seeding
    const financePath = path.join(rootDataDir, 'grants', '01_Grant_Profile_and_Finance.csv');
    if (fs.existsSync(financePath)) {
        const data = parse(fs.readFileSync(financePath, 'utf-8'), { columns: true, skip_empty_lines: true });
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO grant_finances (
                grant_id, donor, grant_name, period_start, period_end, covered_districts,
                reporting_month, budget_line, approved_budget_units, monthly_utilized_units,
                cumulative_utilized_units, cumulative_utilization_rate, finance_note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        db.exec('BEGIN TRANSACTION;');
        try {
            for (const row of data) {
                stmt.run(
                    row['grant_id'], row['donor'], row['grant_name'], row['period_start'], row['period_end'], row['covered_districts'],
                    row['reporting_month'], row['budget_line'], cleanNumber(row['approved_budget_units']),
                    cleanNumber(row['monthly_utilized_units']), cleanNumber(row['cumulative_utilized_units']),
                    cleanNumber(row['cumulative_utilization_rate']), row['finance_note'] || ''
                );
            }
            db.exec('COMMIT;');
            console.log(`Seeded ${data.length} grant finance budget rows.`);
        } catch (err) {
            db.exec('ROLLBACK;');
            throw err;
        }
    }

    // 2. Performance Seeding
    const performancePath = path.join(rootDataDir, 'grants', '02_Grant_Performance_and_Report_Material.csv');
    if (fs.existsSync(performancePath)) {
        const data = parse(fs.readFileSync(performancePath, 'utf-8'), { columns: true, skip_empty_lines: true });
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO grant_performance (
                grant_id, donor, grant_name, reporting_month, period_end_date, report_due_date,
                report_status, covered_districts, sampled_school_records, schools_completed_pbl,
                pbl_completion_rate, schools_with_evidence, evidence_submission_rate,
                total_enrollment, total_attendance, attendance_rate, risk_status, milestone_summary, draft_report_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        db.exec('BEGIN TRANSACTION;');
        try {
            for (const row of data) {
                stmt.run(
                    row['grant_id'], row['donor'], row['grant_name'], row['reporting_month'], row['period_end_date'], row['report_due_date'],
                    row['report_status'], row['covered_districts'], cleanNumber(row['sampled_school_records']),
                    cleanNumber(row['schools_completed_pbl']), cleanNumber(row['pbl_completion_rate']),
                    cleanNumber(row['schools_with_evidence']), cleanNumber(row['evidence_submission_rate']),
                    cleanNumber(row['total_enrollment']), cleanNumber(row['total_attendance']),
                    cleanNumber(row['attendance_rate']), row['risk_status'], row['milestone_summary'], row['draft_report_text']
                );
            }
            db.exec('COMMIT;');
            console.log(`Seeded ${data.length} grant performance rows.`);
        } catch (err) {
            db.exec('ROLLBACK;');
            throw err;
        }
    }

    // 3. Evidence/Media Index Seeding
    const mediaPath = path.join(rootDataDir, 'grants', '03_Evidence_and_Media_Index.csv');
    if (fs.existsSync(mediaPath)) {
        const data = parse(fs.readFileSync(mediaPath, 'utf-8'), { columns: true, skip_empty_lines: true });
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO evidence_media_index (
                record_id, record_type, grant_id, donor, reporting_month,
                district, title, summary_or_caption, file_name, relative_path, usage_note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        db.exec('BEGIN TRANSACTION;');
        try {
            for (const row of data) {
                stmt.run(
                    row['record_id'], row['record_type'], row['grant_id'], row['donor'], row['reporting_month'],
                    row['district'], row['title'], row['summary_or_caption'], row['file_name'], row['relative_path'], row['usage_note']
                );
            }
            db.exec('COMMIT;');
            console.log(`Seeded ${data.length} evidence/media index rows.`);
        } catch (err) {
            db.exec('ROLLBACK;');
            throw err;
        }
    }
}

try {
    seedPrimaryPblData();
    seedGrantReportingEvidence();
    console.log('\nAll datasets seeded successfully into SQLite.');
    process.exit(0);
} catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
}
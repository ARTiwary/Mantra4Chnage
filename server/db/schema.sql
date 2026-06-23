-- Table for Primary Monthly PBL School Responses
CREATE TABLE IF NOT EXISTS school_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporting_month TEXT NOT NULL,          -- e.g., '2025-07'
    timestamp TEXT,
    school_name TEXT NOT NULL,
    school_code TEXT NOT NULL,              -- e.g., 'SYN-011-AAAK'
    district_name TEXT NOT NULL,            -- e.g., 'District AL'
    block_details TEXT NOT NULL,            -- e.g., 'District AL - Block 007'
    conducted_pbl TEXT NOT NULL,            -- 'Yes' or 'No'
    evidence_submitted TEXT NOT NULL,       -- 'Yes' or 'No'
    classes_covered TEXT,                   -- e.g., 'Classes 6, 7 and 8'
    subject_taught TEXT,                    -- e.g., 'Math and Science'
    class6_enrollment INTEGER DEFAULT 0,
    class6_attendance_science INTEGER DEFAULT 0,
    class6_attendance_math INTEGER DEFAULT 0,
    class7_enrollment INTEGER DEFAULT 0,
    class7_attendance_science INTEGER DEFAULT 0,
    class7_attendance_math INTEGER DEFAULT 0,
    class8_enrollment INTEGER DEFAULT 0,
    class8_attendance_science INTEGER DEFAULT 0,
    class8_attendance_math INTEGER DEFAULT 0,
    derived_total_enrollment INTEGER DEFAULT 0,
    derived_total_attendance INTEGER DEFAULT 0,
    derived_attendance_rate REAL DEFAULT 0.0,
    derived_risk_status TEXT NOT NULL,       -- 'On Track', 'Behind', 'At Risk', 'Critical'
    UNIQUE(reporting_month, school_code)
);

-- Table for Grant Profiles and Finances (01_Grant_Profile_and_Finance.csv)
CREATE TABLE IF NOT EXISTS grant_finances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id TEXT NOT NULL,
    donor TEXT NOT NULL,
    grant_name TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    covered_districts TEXT NOT NULL,
    reporting_month TEXT NOT NULL,
    budget_line TEXT NOT NULL,
    approved_budget_units REAL DEFAULT 0,
    monthly_utilized_units REAL DEFAULT 0,
    cumulative_utilized_units REAL DEFAULT 0,
    cumulative_utilization_rate REAL DEFAULT 0.0,
    finance_note TEXT,
    UNIQUE(grant_id, reporting_month, budget_line)
);

-- Table for Grant Performance Reports (02_Grant_Performance_and_Report_Material.csv)
CREATE TABLE IF NOT EXISTS grant_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id TEXT NOT NULL,
    donor TEXT NOT NULL,
    grant_name TEXT NOT NULL,
    reporting_month TEXT NOT NULL,
    period_end_date TEXT,
    report_due_date TEXT,
    report_status TEXT,
    covered_districts TEXT NOT NULL,
    sampled_school_records INTEGER DEFAULT 0,
    schools_completed_pbl INTEGER DEFAULT 0,
    pbl_completion_rate REAL DEFAULT 0.0,
    schools_with_evidence INTEGER DEFAULT 0,
    evidence_submission_rate REAL DEFAULT 0.0,
    total_enrollment INTEGER DEFAULT 0,
    total_attendance INTEGER DEFAULT 0,
    attendance_rate REAL DEFAULT 0.0,
    risk_status TEXT,
    milestone_summary TEXT,
    draft_report_text TEXT,
    UNIQUE(grant_id, reporting_month)
);

-- Table for Evidence and Media Index (03_Evidence_and_Media_Index.csv)
CREATE TABLE IF NOT EXISTS evidence_media_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id TEXT UNIQUE NOT NULL,
    record_type TEXT NOT NULL,              -- 'image' or 'news_clipping'
    grant_id TEXT NOT NULL,
    donor TEXT NOT NULL,
    reporting_month TEXT NOT NULL,
    district TEXT NOT NULL,
    title TEXT NOT NULL,
    summary_or_caption TEXT,
    file_name TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    usage_note TEXT
);

-- Indexes for dashboard aggregation performance
CREATE INDEX IF NOT EXISTS idx_responses_month_dist ON school_responses(reporting_month, district_name);
CREATE INDEX IF NOT EXISTS idx_responses_block ON school_responses(block_details);
CREATE INDEX IF NOT EXISTS idx_responses_risk ON school_responses(derived_risk_status);
CREATE INDEX IF NOT EXISTS idx_finances_grant ON grant_finances(grant_id, reporting_month);
CREATE INDEX IF NOT EXISTS idx_performance_grant ON grant_performance(grant_id, reporting_month);
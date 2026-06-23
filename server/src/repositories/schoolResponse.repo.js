import db from '../../db/connection.js';

export class SchoolResponseRepository {
    /**
     * Query school records matching active filter parameters.
     * Grade filtering happens in JS after the SQL query because the source
     * data stores classes as a free-text string ("Classes 6, 7 and 8")
     * rather than a normalized column — filtering in SQL would require a
     * fragile LIKE pattern per grade anyway, so doing it in JS keeps the
     * matching logic in one readable place.
     */
    static getFilteredResponses({ month, district, block, subject, grade } = {}) {
        let sql = `SELECT * FROM school_responses WHERE 1=1`;
        const params = [];

        if (month) {
            sql += ` AND reporting_month = ?`;
            params.push(month);
        }
        if (district) {
            sql += ` AND district_name = ?`;
            params.push(district);
        }
        if (block) {
            sql += ` AND block_details = ?`;
            params.push(block);
        }
        if (subject) {
            sql += ` AND subject_taught LIKE ?`;
            params.push(`%${subject}%`);
        }

        const stmt = db.prepare(sql);
        let rows = stmt.all(...params);

        if (grade) {
            const gradeMapping = { '6': 'Class 6', '7': 'Class 7', '8': 'Class 8' };
            const targetToken = gradeMapping[grade] || grade;
            rows = rows.filter(r => r.classes_covered && r.classes_covered.includes(targetToken));
        }

        return rows;
    }

    /**
     * Distinct values for populating filter dropdowns.
     */
    static getDistinctFilters() {
        const months = db.prepare(`SELECT DISTINCT reporting_month FROM school_responses ORDER BY reporting_month ASC`).all().map(r => r.reporting_month);
        const districts = db.prepare(`SELECT DISTINCT district_name FROM school_responses ORDER BY district_name ASC`).all().map(r => r.district_name);
        const blocks = db.prepare(`SELECT DISTINCT block_details FROM school_responses ORDER BY block_details ASC`).all().map(r => r.block_details);
        const subjects = ['Science', 'Math', 'Math and Science'];
        const grades = ['6', '7', '8'];

        return { months, districts, blocks, subjects, grades };
    }

    /**
     * Returns the reporting month immediately prior to the given month, IF
     * it exists in the data. Used for month-over-month movement.
     */
    static getPreviousMonth(month) {
        const months = db.prepare(`SELECT DISTINCT reporting_month FROM school_responses ORDER BY reporting_month ASC`).all().map(r => r.reporting_month);
        const idx = months.indexOf(month);
        if (idx <= 0) return null;
        return months[idx - 1];
    }
}
import db from '../../db/connection.js';

export class SchoolResponseRepository {
    /**
     * Query all school records with active front-end filter parameters
     */
    static getFilteredResponses({ month, district, block, subject, grade }) {
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
        
        // Execute dynamic query compilation
        const stmt = db.prepare(sql);
        let rows = stmt.all(...params);

        // Filter by grade layer programmatically if requested
        if (grade) {
            const gradeMapping = { '6': 'Class 6', '7': 'Class 7', '8': 'Class 8' };
            const targetToken = gradeMapping[grade] || grade;
            rows = rows.filter(r => r.classes_covered && r.classes_covered.includes(targetToken));
        }

        return rows;
    }

    /**
     * Gather list of distinctive dimensions to populate dropdown selectors
     */
    static getDistinctFilters() {
        const months = db.prepare(`SELECT DISTINCT reporting_month FROM school_responses ORDER BY reporting_month DESC`).all().map(r => r.reporting_month);
        const districts = db.prepare(`SELECT DISTINCT district_name FROM school_responses ORDER BY district_name ASC`).all().map(r => r.district_name);
        const blocks = db.prepare(`SELECT DISTINCT block_details FROM school_responses ORDER BY block_details ASC`).all().map(r => r.block_details);
        const subjects = ['Science', 'Math', 'Math and Science'];

        return { months, districts, blocks, subjects };
    }
}
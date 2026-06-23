import db from '../../db/connection.js';

export class GrantRepository {
    static getAllProfiles() {
        return db.prepare(`SELECT DISTINCT grant_id, donor, grant_name FROM grant_performance ORDER BY grant_id ASC`).all();
    }

    static getDistinctMonths() {
        return db.prepare(`SELECT DISTINCT reporting_month FROM grant_performance ORDER BY reporting_month ASC`).all().map(r => r.reporting_month);
    }

    static getPerformanceById(grantId, month) {
        let sql = `SELECT * FROM grant_performance WHERE grant_id = ?`;
        const params = [grantId];
        if (month) {
            sql += ` AND reporting_month = ?`;
            params.push(month);
        }
        sql += ` ORDER BY reporting_month ASC`;
        return db.prepare(sql).all(...params);
    }

    static getFinancesById(grantId, month) {
        let sql = `SELECT * FROM grant_finances WHERE grant_id = ?`;
        const params = [grantId];
        if (month) {
            sql += ` AND reporting_month = ?`;
            params.push(month);
        }
        sql += ` ORDER BY budget_line ASC`;
        return db.prepare(sql).all(...params);
    }

    static getMediaAssets(grantId, month) {
        let sql = `SELECT * FROM evidence_media_index WHERE grant_id = ?`;
        const params = [grantId];
        if (month) {
            sql += ` AND reporting_month = ?`;
            params.push(month);
        }
        return db.prepare(sql).all(...params);
    }
}
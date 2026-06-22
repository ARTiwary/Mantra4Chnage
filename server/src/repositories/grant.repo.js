import db from '../../db/connection.js';

export class GrantRepository {
    static getAllProfiles() {
        return db.prepare(`SELECT DISTINCT grant_id, donor, grant_name FROM grant_performance`).all();
    }

    static getPerformanceById(grantId, month) {
        let sql = `SELECT * FROM grant_performance WHERE grant_id = ?`;
        const params = [grantId];
        if (month) {
            sql += ` AND reporting_month = ?`;
            params.push(month);
        }
        return db.prepare(sql).all(params);
    }

    static getFinancesById(grantId, month) {
        let sql = `SELECT * FROM grant_finances WHERE grant_id = ?`;
        const params = [grantId];
        if (month) {
            sql += ` AND reporting_month = ?`;
            params.push(month);
        }
        return db.prepare(sql).all(params);
    }

    static getMediaAssets(grantId, month) {
        let sql = `SELECT * FROM evidence_media_index WHERE grant_id = ?`;
        const params = [grantId];
        if (month) {
            sql += ` AND reporting_month = ?`;
            params.push(month);
        }
        return db.prepare(sql).all(params);
    }
}
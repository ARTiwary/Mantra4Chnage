import { Database } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'pbl.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

// Ensure database file connection is established cleanly
const db = new Database(dbPath);

// Run initialization to ensure table execution structures are up-to-date
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

// node:sqlite executes statements sequentially via single strings
db.exec(schemaSql);

export default db;
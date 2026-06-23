import sqlite from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'pbl.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

// Establish the connection using Node's built-in SQLite module.
// Chosen over better-sqlite3 to avoid native compilation entirely — this
// works on any machine with Node >= 22.5.0, no build tools required.
const db = new sqlite.DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Run schema on every startup. All statements use CREATE TABLE/INDEX IF NOT
// EXISTS, so this is idempotent and safe to run against an existing database.
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

export default db;
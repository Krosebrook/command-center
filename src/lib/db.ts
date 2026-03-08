
import fs from "fs";
import path from "path";
import { logger } from "./logger";

// We'll use a local db file instead of Postgres
const DB_DIR = path.resolve("D:\\.command-center");
const DB_PATH = path.join(DB_DIR, "metrics.db");

let dbInstance: any = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // Require better-sqlite3 inside the function to avoid NEXT_RUNTIME edge cases on the edge
    const sqlite3 = require('better-sqlite3');
    dbInstance = new sqlite3(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');

    // Make sure tables exist
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        totalSize INTEGER NOT NULL,
        totalFiles INTEGER NOT NULL,
        folderCount INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS project_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id INTEGER NOT NULL,
        project_name TEXT NOT NULL,
        has_changes BOOLEAN NOT NULL,
        unpushed BOOLEAN NOT NULL,
        FOREIGN KEY(scan_id) REFERENCES scan_history(id)
      );

      CREATE TABLE IF NOT EXISTS project_embeddings (
        id TEXT PRIMARY KEY,
        project_name TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding TEXT NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS automation_jobs (
        id TEXT PRIMARY KEY,
        script_path TEXT NOT NULL,
        status TEXT NOT NULL,   -- 'pending', 'running', 'completed', 'failed'
        output TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    logger.info("Initialized local SQLite metrics database");
  } catch (error) {
    logger.error("Failed to initialize SQLite database", { error });
  }

  return dbInstance;
}

export function logScanMetrics(totalSize: number, totalFiles: number, folderCount: number) {
  const db = getDb();
  if (!db) return null;

  try {
    const stmt = db.prepare(`
      INSERT INTO scan_history (timestamp, totalSize, totalFiles, folderCount)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(new Date().toISOString(), totalSize, totalFiles, folderCount);
    return info.lastInsertRowid;
  } catch (err: any) {
    logger.error("Failed to log scan metrics", { error: err.message });
    return null;
  }
}

export function getScanHistory(days: number = 30) {
  const db = getDb();
  if (!db) return [];

  // Get records from the last X days, roughly
  const dateStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  try {
    const stmt = db.prepare(`SELECT * FROM scan_history WHERE timestamp > ? ORDER BY timestamp ASC`);
    return stmt.all(dateStr);
  } catch (err) {
    return [];
  }
}

// --- Automation Job Queue Functions ---

export function createJob(id: string, scriptPath: string) {
  const db = getDb();
  if (!db) return;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO automation_jobs (id, script_path, status, output, created_at, updated_at)
    VALUES (?, ?, 'pending', '', ?, ?)
  `).run(id, scriptPath, now, now);
}

export function updateJobStatus(id: string, status: 'running' | 'completed' | 'failed', outputAppend?: string) {
  const db = getDb();
  if (!db) return;
  const now = new Date().toISOString();
  
  if (outputAppend !== undefined) {
    // Append to existing output
    const job = getJob(id);
    const newOutput = (job?.output || '') + outputAppend;
    db.prepare(`UPDATE automation_jobs SET status = ?, output = ?, updated_at = ? WHERE id = ?`)
      .run(status, newOutput, now, id);
  } else {
    db.prepare(`UPDATE automation_jobs SET status = ?, updated_at = ? WHERE id = ?`)
      .run(status, now, id);
  }
}

export function getJob(id: string) {
  const db = getDb();
  if (!db) return null;
  return db.prepare(`SELECT * FROM automation_jobs WHERE id = ?`).get(id) as {
    id: string;
    script_path: string;
    status: string;
    output: string;
    created_at: string;
    updated_at: string;
  } | undefined;
}

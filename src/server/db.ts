import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cardforge.db');

async function loadOrCreateDB() {
  if (!SQL) {
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
    SQL = await initSqlJs({ locateFile: () => wasmPath });
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    const buf = fs.readFileSync(DB_FILE);
    db = new SQL!.Database(new Uint8Array(buf));
  } else {
    db = new SQL!.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        rarity TEXT,
        type TEXT,
        collection TEXT,
        imageUrl TEXT,
        imagePrompt TEXT,
        variant TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);
    persist();
  }
}

export async function initDB() {
  if (!db) await loadOrCreateDB();
}

export function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

export function all<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows as T[];
  } finally {
    stmt.free();
  }
}

export function run(sql: string, params: any[] = []) {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
  } finally {
    stmt.free();
  }
  persist();
}

import initSqlJs, { type Database, type SqlJsStatic } from "sql.js"

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let initializationPromise: Promise<void> | null = null

const STORAGE_KEY = "cardforge_sqlite_db"

function toUint8Array(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export async function initDB() {
  // Prevent multiple simultaneous initialization attempts
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = initializeDatabase()
  return initializationPromise
}

async function initializeDatabase() {
  if (!SQL) {
    try {
      SQL = await initSqlJs({
        locateFile: (file) => {
          if (file.endsWith(".wasm")) {
            return "/sql-wasm.wasm"
          }
          return file
        },
      })
    } catch (error) {
      console.error("Failed to initialize sql.js:", error)
      throw new Error("SQLite WebAssembly module failed to load. Please refresh the page.")
    }
  }
  
  if (!db) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        db = new SQL!.Database(toUint8Array(saved))
      } else {
        db = new SQL!.Database()
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
        `)
        persist()
      }
    } catch (error) {
      console.error("Failed to create database:", error)
      throw new Error("Failed to initialize SQLite database")
    }
  }
}

export function getDB(): Database {
  if (!db) throw new Error("SQLite DB not initialized")
  return db
}

export function persist() {
  if (!db) return
  const data = db.export()
  localStorage.setItem(STORAGE_KEY, toBase64(data))
}

export function all<T = any>(sql: string, params: any[] = []): T[] {
  const database = getDB()
  const stmt = database.prepare(sql)
  try {
    stmt.bind(params)
    const rows: any[] = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    return rows as T[]
  } finally {
    stmt.free()
  }
}

export function run(sql: string, params: any[] = []) {
  const database = getDB()
  const stmt = database.prepare(sql)
  try {
    stmt.bind(params)
    stmt.step()
  } finally {
    stmt.free()
  }
  persist()
}

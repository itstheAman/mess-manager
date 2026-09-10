import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "adarsha_mess.sqlite");

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error("Error reading existing database file, creating fresh one:", err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("Failed to persist database to disk:", err);
  }
}

function initTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS messes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL, -- 6-digit invitation / room code (e.g. "842915")
      creator_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT', -- 'SUPER_ADMIN', 'MANAGER', 'STUDENT'
      approved INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      room_number TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(mess_id, phone)
    );

    CREATE TABLE IF NOT EXISTS monthly_periods (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      name TEXT NOT NULL, -- e.g. "সেপ্টেম্বর ২০২৬"
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'ARCHIVED'
      active_student_count INTEGER NOT NULL DEFAULT 0,
      fixed_curry_meals REAL NOT NULL DEFAULT 56.0,
      morning_meal_value REAL NOT NULL DEFAULT 0.5,
      lunch_meal_value REAL NOT NULL DEFAULT 1.0,
      dinner_meal_value REAL NOT NULL DEFAULT 1.0,
      include_bran_in_rice_calculation INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_records (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      month_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      morning INTEGER NOT NULL DEFAULT 1,
      lunch INTEGER NOT NULL DEFAULT 1,
      dinner INTEGER NOT NULL DEFAULT 1,
      total REAL NOT NULL DEFAULT 2.5,
      note TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(month_id, student_id, date)
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      month_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS curry_expenses (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      month_id TEXT NOT NULL,
      date TEXT NOT NULL,
      person_id TEXT NOT NULL,
      category TEXT NOT NULL, -- 'সবজি', 'মাছ', 'মাংস', 'মসলা', 'তেল', 'পেঁয়াজ', 'আলু', 'অন্যান্য'
      amount REAL NOT NULL,
      description TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rice_expenses (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      month_id TEXT NOT NULL,
      date TEXT NOT NULL,
      person_id TEXT NOT NULL,
      rice_amount REAL NOT NULL,
      bran_amount REAL NOT NULL DEFAULT 0,
      note TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS extra_expenses (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      month_id TEXT NOT NULL,
      date TEXT NOT NULL,
      person_id TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS manager_assignments (
      id TEXT PRIMARY KEY,
      mess_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      month_id TEXT NOT NULL,
      assigned_by TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, month_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      mess_id TEXT,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      mess_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (mess_id, key)
    );
  `);
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error("Database not initialized");
  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const all = queryAll<T>(sql, params);
  return all.length > 0 ? all[0] : null;
}

export function runQuery(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error("Database not initialized");
  dbInstance.run(sql, params);
  saveDb();
}

/**
 * Generate a 6-digit numeric room / invitation code (e.g. "842915")
 * Ensures code uniqueness across messes.
 */
export function generateUniqueRoomCode(): string {
  let code = "";
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 100) {
    attempts++;
    // Generate 6-digit number between 100000 and 999999
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const row = queryOne("SELECT id FROM messes WHERE code = ?", [code]);
    if (!row) {
      exists = false;
    }
  }
  return code;
}

export function clearMessTransactions(messId: string): void {
  if (!dbInstance) return;
  dbInstance.run(
    `
    DELETE FROM audit_logs WHERE mess_id = ?;
    DELETE FROM extra_expenses WHERE mess_id = ?;
    DELETE FROM rice_expenses WHERE mess_id = ?;
    DELETE FROM curry_expenses WHERE mess_id = ?;
    DELETE FROM deposits WHERE mess_id = ?;
    DELETE FROM meal_records WHERE mess_id = ?;
  `,
    [messId, messId, messId, messId, messId, messId]
  );
  saveDb();
}

export function resetAllData(): void {
  if (!dbInstance) return;
  dbInstance.run(`
    DELETE FROM audit_logs;
    DELETE FROM extra_expenses;
    DELETE FROM rice_expenses;
    DELETE FROM curry_expenses;
    DELETE FROM deposits;
    DELETE FROM meal_records;
    DELETE FROM manager_assignments;
    DELETE FROM monthly_periods;
    DELETE FROM users;
    DELETE FROM messes;
    DELETE FROM system_settings;
  `);
  saveDb();
}

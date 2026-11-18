import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const SEED_USERS = [
  [1, 'ravi', 'Ravi', 'employee'],
  [2, 'priya', 'Priya', 'employee'],
  [3, 'sam', 'Sam', 'support'],
];

const SEED_TICKETS = [
  [1, 'Laptop not charging', 'My laptop shows 0% even when plugged in', 'Hardware', 'High', 'Open', 1, '2026-11-18T09:00:00.000Z', '2026-11-18T09:00:00.000Z'],
  [2, 'Cannot log in to VPN', 'VPN client rejects my password after the password reset', 'Network', 'High', 'In Progress', 1, '2026-11-18T09:15:00.000Z', '2026-11-18T10:05:00.000Z'],
  [3, 'Need access to the shared project folder', 'Please add me to the Shared Projects group', 'Access', 'Medium', 'Open', 2, '2026-11-18T11:20:00.000Z', '2026-11-18T11:20:00.000Z'],
  [4, 'Excel keeps crashing on startup', 'Excel closes immediately after the splash screen', 'Software', 'Medium', 'Resolved', 2, '2026-11-18T12:10:00.000Z', '2026-11-18T14:30:00.000Z'],
  [5, 'Request a second monitor', 'Would like a second monitor for the desk', 'Hardware', 'Low', 'Closed', 1, '2026-11-18T15:00:00.000Z', '2026-11-18T16:00:00.000Z'],
];

const SEED_COMMENTS = [
  [1, 2, 3, 'Checked the VPN gateway logs; waiting on an account reset from IT.', '2026-11-18T10:05:00.000Z'],
  [2, 4, 2, 'It started after the latest update this morning.', '2026-11-18T13:00:00.000Z'],
  [3, 4, 3, 'Reinstalled Office and marked this resolved. Please reopen if it returns.', '2026-11-18T14:30:00.000Z'],
];

/** Create (or open) the SQLite database, apply the schema and seed demo data. */
export function createDatabase(filename = resolve(process.cwd(), 'data', 'tickets.db')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('employee', 'support'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 100),
      description TEXT NOT NULL CHECK (length(trim(description)) > 0),
      category TEXT NOT NULL CHECK (category IN ('Hardware', 'Software', 'Network', 'Access', 'Other')),
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
    CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
  `);
  seed(db);
  return db;
}

function seed(db) {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, display_name, role) VALUES (?, ?, ?, ?)');
    for (const user of SEED_USERS) insertUser.run(...user);

    const ticketCount = db.prepare('SELECT COUNT(*) AS n FROM tickets').get().n;
    if (ticketCount === 0) {
      const insertTicket = db.prepare(`
        INSERT INTO tickets (id, title, description, category, priority, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const ticket of SEED_TICKETS) insertTicket.run(...ticket);

      const insertComment = db.prepare(`
        INSERT INTO comments (id, ticket_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)
      `);
      for (const comment of SEED_COMMENTS) insertComment.run(...comment);
    }
    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

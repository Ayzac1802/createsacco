/**
 * sqliteAdapter.example.js
 *
 * Example SQLite adapter shape. This is an example; adapt to your mobile SQLite API.
 *
 * The adapter expects a `db` object with methods:
 * - run(sql, params) -> Promise (executes statement)
 * - get(sql, params) -> Promise (returns single row)
 * - all(sql, params) -> Promise (returns rows array)
 * - transaction(fn) -> runs fn within a DB transaction
 *
 * On React Native you can implement these using expo-sqlite or react-native-sqlite-storage.
 *
 * Also included: SQL for schema creation.
 */

export const sqliteSchema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  suspended INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL,
  group_id TEXT,
  defector_resolved_at TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount INTEGER NOT NULL, -- cents
  currency TEXT NOT NULL DEFAULT 'UGX',
  type TEXT NOT NULL,
  description TEXT,
  related_payout_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_member_date ON transactions(member_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  week_index INTEGER,
  pool_amount INTEGER NOT NULL,
  recipient_member_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payout_method TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  created_by TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_payouts_group ON payouts(group_id, week_index);
CREATE INDEX IF NOT EXISTS idx_payouts_recipient ON payouts(recipient_member_id);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  title TEXT,
  note TEXT,
  date TEXT,
  created_by TEXT,
  created_at TEXT,
  last_edited_at TEXT,
  last_edited_by TEXT,
  important INTEGER DEFAULT 0,
  category TEXT
);

CREATE INDEX IF NOT EXISTS idx_notes_member ON notes(member_id);
`;

/*
Example adapter skeleton, adapt to your environment:

import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('sacco.db');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(sql, params,
        (_, result) => resolve(result),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

const adapter = {
  async get(sql, params=[]) { ... },
  async all(sql, params=[]) { ... },
  async run(sql, params=[]) { ... },
  async execTransaction(fn) { 
    // implement transaction wrapper that exposes get/all/run bound to tx
  }
};

export default adapter;
*/

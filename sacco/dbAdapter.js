/**
 * dbAdapter.js
 * Storage adapter interface (contract). Implement this for your platform.
 *
 * Required async methods:
 * - get(sql, params) -> single row or null
 * - all(sql, params) -> array of rows
 * - run(sql, params) -> execute statement (returns result metadata)
 * - execTransaction(fn) -> runs fn(transactionContext) inside a DB transaction
 *
 * transactionContext should expose same API: get, all, run
 *
 * This file only documents the interface — use sqliteAdapter.example.js as a concrete example.
 */

export const dbAdapterInterface = {
  async get(sql, params) {
    throw new Error('get() not implemented');
  },
  async all(sql, params) {
    throw new Error('all() not implemented');
  },
  async run(sql, params) {
    throw new Error('run() not implemented');
  },
  async execTransaction(fn) {
    throw new Error('execTransaction() not implemented');
  }
};

# SACCO Business Logic

This folder contains the core, storage-agnostic SACCO business logic modules designed for mobile/local-first usage. The modules are adapter-based — implement a small `dbAdapter` for your platform (SQLite, Realm, etc.) and wire into `createSaccoApi(dbAdapter)`.

Files:
- math.js — money helpers (store amounts as integer cents)
- validators.js — payload validators
- dbAdapter.js — adapter interface (documented)
- sqliteAdapter.example.js — example SQLite schema & adapter guidance
- memberLogic.js — member create/update
- transactionLogic.js — immutable transactions
- savingsLogic.js — calculate savings from transactions
- ledgerLogic.js — generate member ledger with running balance
- eligibilityLogic.js — rules engine (configurable)
- payoutLogic.js — create/resolve payouts (save vs cash)
- notesLogic.js — admin notes (not transactions)
- index.js — factory to create modules

Adapter

Implement the following async methods on your adapter and pass it into `createSaccoApi`:
- get(sql, params)
- all(sql, params)
- run(sql, params)
- execTransaction(fn) — runs fn inside DB transaction and forwards a transaction-scoped adapter

SQLite

See `sqliteAdapter.example.js` for a SQL schema and example adapter blueprint for Expo/React Native.

/**
 * index.js
 * High-level factory to create modules wired to a dbAdapter.
 *
 * Example usage:
 * const adapter = require('./sqliteAdapter'); // your platform adapter implementing get/all/run/execTransaction
 * const api = require('./index').createSaccoApi(adapter);
 *
 * api.transaction.createTransaction({...})
 * api.savings.calculateMemberSavings(memberId)
 */

import { createMemberModule } from './memberLogic.js';
import { createTransactionModule } from './transactionLogic.js';
import { createSavingsModule } from './savingsLogic.js';
import { createLedgerModule } from './ledgerLogic.js';
import { createEligibilityModule } from './eligibilityLogic.js';
import { createPayoutModule } from './payoutLogic.js';
import { createNotesModule } from './notesLogic.js';

export function createSaccoApi(dbAdapter, options = {}) {
  const members = createMemberModule(dbAdapter);
  const transactions = createTransactionModule(dbAdapter);
  const savings = createSavingsModule(dbAdapter);
  const ledger = createLedgerModule(dbAdapter);
  const eligibility = createEligibilityModule(dbAdapter);
  const payouts = createPayoutModule(dbAdapter, options);
  const notes = createNotesModule(dbAdapter, options);

  return {
    members,
    transactions,
    savings,
    ledger,
    eligibility,
    payouts,
    notes
  };
}

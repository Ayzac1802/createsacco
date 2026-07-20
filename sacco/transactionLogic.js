/**
 * transactionLogic.js
 * Create and query transactions (immutable records).
 */

import { validateTransactionPayload } from './validators.js';
import { toCents } from './math.js';

export function createTransactionModule(dbAdapter) {
  return {
    /**
     * Create a transaction record (no approvals, immediate).
     * payload must include: id, memberId, date, amount, type, description, createdBy
     */
    async createTransaction(payload) {
      validateTransactionPayload(payload);
      const amount = toCents(payload.amount);
      const now = new Date().toISOString();
      const sql = `INSERT INTO transactions (id, member_id, date, amount, currency, type, description, related_payout_id, created_by, created_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        payload.id,
        payload.memberId,
        payload.date,
        amount,
        payload.currency || 'UGX',
        payload.type,
        payload.description || null,
        payload.relatedPayoutId || null,
        payload.createdBy,
        now,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ];
      await dbAdapter.run(sql, params);
      // Return canonical transaction record as stored
      return {
        ...payload,
        amount,
        currency: payload.currency || 'UGX',
        createdAt: now
      };
    },

    async getTransactionById(id) {
      return dbAdapter.get(`SELECT * FROM transactions WHERE id = ?`, [id]);
    },

    async getTransactionsByMember(memberId, { fromDate, toDate, types } = {}) {
      const parts = ['member_id = ?'];
      const params = [memberId];
      if (fromDate) { parts.push('date >= ?'); params.push(fromDate); }
      if (toDate) { parts.push('date <= ?'); params.push(toDate); }
      if (types && types.length) { parts.push(`type IN (${types.map(()=>'?').join(',')})`); params.push(...types); }
      const sql = `SELECT * FROM transactions WHERE ${parts.join(' AND ')} ORDER BY date ASC, created_at ASC`;
      return dbAdapter.all(sql, params);
    },

    async queryTransactions({ where = '', params = [], orderBy = 'date ASC' } = {}) {
      const sql = `SELECT * FROM transactions ${where ? 'WHERE ' + where : ''} ORDER BY ${orderBy}`;
      return dbAdapter.all(sql, params);
    }
  };
}

/**
 * payoutLogic.js
 * Create payout events and resolve them. Resolving a payout will create a transaction immediately.
 *
 * No approvals — resolving creates transactions directly.
 */

import { toCents } from './math.js';
import { v4 as uuidv4 } from 'uuid'; // if using UUIDs; on mobile you can supply ids externally

export function createPayoutModule(dbAdapter, { generateId = () => uuidv4() } = {}) {
  return {
    async createPayoutEvent({ id, groupId, weekIndex, poolAmount, recipientMemberId, createdBy, notes }) {
      const now = new Date().toISOString();
      const pid = id || generateId();
      const sql = `INSERT INTO payouts (id, group_id, week_index, pool_amount, recipient_member_id, status, created_at, created_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [pid, groupId || null, weekIndex == null ? null : weekIndex, toCents(poolAmount), recipientMemberId, 'PENDING', now, createdBy || null, notes || null];
      await dbAdapter.run(sql, params);
      return { id: pid, groupId, weekIndex, poolAmount: toCents(poolAmount), recipientMemberId, status: 'PENDING', createdAt: now };
    },

    /**
     * Resolve payout: method = 'CASH' | 'SAVE'
     * - If CASH: create transaction type PAYOUT_CASH (reduces member savings)
     * - If SAVE: create transaction type SAVED_PAYOUT (increases member savings)
     *
     * This function runs inside DB transaction to avoid races.
     */
    async resolvePayout(payoutId, { method, actedBy, transactionId }) {
      if (!['CASH', 'SAVE'].includes(method)) throw new Error('invalid payout method');
      return dbAdapter.execTransaction(async (tx) => {
        const p = await tx.get(`SELECT * FROM payouts WHERE id = ?`, [payoutId]);
        if (!p) throw new Error('payout not found');
        if (p.status !== 'PENDING') throw new Error('payout already resolved');
        const resolvedAt = new Date().toISOString();
        const payoutAmount = Number(p.pool_amount || 0);
        const txnId = transactionId || generateId();
        // Create transaction
        const txnType = method === 'CASH' ? 'PAYOUT_CASH' : 'SAVED_PAYOUT';
        const txnSql = `INSERT INTO transactions (id, member_id, date, amount, currency, type, description, related_payout_id, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const txnParams = [
          txnId,
          p.recipient_member_id,
          resolvedAt,
          method === 'CASH' ? payoutAmount : payoutAmount, // both stored as positive value; ledger treats Payout cash as debit
          'UGX',
          txnType,
          method === 'CASH' ? `Pool payout (cash) week ${p.week_index}` : `Pool payout saved week ${p.week_index}`,
          payoutId,
          actedBy || null,
          resolvedAt
        ];
        await tx.run(txnSql, txnParams);
        // Update payout
        const updateSql = `UPDATE payouts SET status = ?, payout_method = ?, resolved_at = ? WHERE id = ?`;
        await tx.run(updateSql, [method === 'CASH' ? 'PAID' : 'SAVED', method, resolvedAt, payoutId]);
        return { payoutId, txnId, resolvedAt, method, payoutAmount };
      });
    }
  };
}

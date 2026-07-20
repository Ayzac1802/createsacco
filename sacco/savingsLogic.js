/**
 * savingsLogic.js
 * Calculate member savings from transactions.
 *
 * Savings = Σ Contributions + Σ Saved Payouts + Σ Deposits/Adjustments(positive) - Σ Withdrawals - Σ Adjustments(negative)
 *
 * Transaction types considered:
 * - WEEKLY_CONTRIBUTION (credit)
 * - SAVED_PAYOUT (credit)
 * - WITHDRAWAL (debit)
 * - ADJUSTMENT (sign determined by amount sign)
 * - FINE (debit)
 * - INTEREST (credit)
 */

import { sumCents } from './math.js';

export function createSavingsModule(dbAdapter) {
  return {
    async calculateMemberSavings(memberId, { upToDate } = {}) {
      const parts = ['member_id = ?'];
      const params = [memberId];
      if (upToDate) { parts.push('date <= ?'); params.push(upToDate); }
      const sql = `SELECT * FROM transactions WHERE ${parts.join(' AND ')} ORDER BY date ASC, created_at ASC`;
      const transactions = await dbAdapter.all(sql, params);

      const credits = transactions.filter(t => ['WEEKLY_CONTRIBUTION', 'SAVED_PAYOUT', 'INTEREST'].includes(t.type));
      const debits = transactions.filter(t => ['WITHDRAWAL', 'FINE'].includes(t.type));
      // ADJUSTMENT can be positive or negative
      const adjustments = transactions.filter(t => t.type === 'ADJUSTMENT');

      const creditSum = sumCents(credits, t => Number(t.amount || 0));
      const debitSum = sumCents(debits, t => Number(t.amount || 0));
      const adjustmentSum = sumCents(adjustments, t => Number(t.amount || 0)); // positive or negative

      const total = creditSum - debitSum + adjustmentSum;
      return {
        memberId,
        totalSavings: total,
        breakdown: {
          credits: creditSum,
          debits: debitSum,
          adjustments: adjustmentSum,
          transactionCount: transactions.length
        },
        transactions
      };
    }
  };
}

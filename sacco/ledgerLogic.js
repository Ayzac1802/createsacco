/**
 * ledgerLogic.js
 * Generate member ledger entries with running balance.
 *
 * Each ledger entry: { date, type, debit, credit, balance, description, transactionId }
 */

export function createLedgerModule(dbAdapter) {
  return {
    async generateMemberLedger(memberId, { fromDate, toDate } = {}) {
      const parts = ['member_id = ?'];
      const params = [memberId];
      if (fromDate) { parts.push('date >= ?'); params.push(fromDate); }
      if (toDate) { parts.push('date <= ?'); params.push(toDate); }
      const sql = `SELECT * FROM transactions WHERE ${parts.join(' AND ')} ORDER BY date ASC, created_at ASC`;
      const rows = await dbAdapter.all(sql, params);

      let running = 0;
      const entries = rows.map(row => {
        // Determine delta: positive amounts for credits (increase savings), negative for debits
        const creditTypes = ['WEEKLY_CONTRIBUTION', 'SAVED_PAYOUT', 'INTEREST'];
        const debitTypes = ['WITHDRAWAL', 'FINE'];
        let delta = 0;
        if (creditTypes.includes(row.type)) delta = Number(row.amount || 0);
        else if (debitTypes.includes(row.type)) delta = -Number(row.amount || 0);
        else if (row.type === 'ADJUSTMENT') delta = Number(row.amount || 0); // adjustments carry sign
        else if (row.type === 'PAYOUT_CASH') delta = -Number(row.amount || 0); // payout cash reduces savings
        else delta = Number(row.amount || 0); // default assume credit

        const debit = delta < 0 ? -delta : 0;
        const credit = delta > 0 ? delta : 0;
        running = running + delta;
        return {
          transactionId: row.id,
          date: row.date,
          type: row.type,
          description: row.description,
          debit,
          credit,
          balance: running
        };
      });

      return {
        memberId,
        ledger: entries,
        openingBalance: entries.length ? (entries[0].balance - (entries[0].credit - entries[0].debit)) : 0,
        closingBalance: running
      };
    }
  };
}

/**
 * eligibilityLogic.js
 * Rules engine for member eligibility. Rules are functions returning { pass, reason, severity }.
 *
 * Built-in rules included: isActive, notSuspended, noMissedPayments (requires context.expectedWeekIds)
 */

export function createEligibilityModule(dbAdapter) {
  const rules = new Map();

  function registerRule(ruleId, fn, { severity = 'ERROR', description = '' } = {}) {
    rules.set(ruleId, { fn, severity, description });
  }

  async function evaluate(member, context = {}) {
    if (!member) throw new Error('member required');
    const results = [];
    for (const [id, meta] of rules) {
      try {
        const res = await meta.fn({ member, dbAdapter, context });
        const passed = Boolean(res && res.pass);
        results.push({
          id,
          description: meta.description,
          severity: meta.severity,
          pass: passed,
          reason: res && res.reason,
          details: res && res.details
        });
      } catch (err) {
        results.push({ id, description: meta.description, severity: meta.severity, pass: false, reason: 'rule error: ' + err.message });
      }
    }

    const failedRules = results.filter(r => !r.pass && r.severity === 'ERROR');
    const warnings = results.filter(r => !r.pass && r.severity === 'WARNING');
    const eligible = failedRules.length === 0;
    const reasons = failedRules.map(r => r.reason).filter(Boolean);
    const warningReasons = warnings.map(r => r.reason).filter(Boolean);

    return {
      eligible,
      reasons,
      failedRules,
      warnings: warningReasons,
      ruleResults: results
    };
  }

  // Built-in rules

  registerRule('isActive', async ({ member }) => {
    return { pass: !!member.active, reason: member.active ? null : 'Member is inactive' };
  }, { severity: 'ERROR', description: 'Member must be active' });

  registerRule('notSuspended', async ({ member }) => {
    return { pass: !member.suspended, reason: member.suspended ? 'Member is suspended' : null };
  }, { severity: 'ERROR', description: 'Member must not be suspended' });

  // noMissedPayments expects context.expectedWeekIds: array of week identifiers,
  // and expects transactions for the member with type WEEKLY_CONTRIBUTION and relatedWeek in that list.
  registerRule('noMissedPayments', async ({ member, dbAdapter, context }) => {
    const expected = Array.isArray(context.expectedWeekIds) ? context.expectedWeekIds : [];
    if (expected.length === 0) return { pass: true, reason: null };
    // Fetch contributions for the member where relatedWeek is in expected
    const placeholders = expected.map(()=>'?').join(',');
    const sql = `SELECT related_payout_id, metadata, type, date FROM transactions WHERE member_id = ? AND type = 'WEEKLY_CONTRIBUTION' AND json_extract(metadata, '$.relatedWeek') IN (${placeholders})`;
    // Note: json_extract usage depends on SQLite; many mobile SQLite builds include it. If not, adapt to use metadata text matching.
    const params = [member.id, ...expected];
    const rows = await dbAdapter.all(sql, params);
    // Create set of weeks paid
    const paidWeeks = new Set(rows.map(r => {
      try {
        const m = r.metadata ? JSON.parse(r.metadata) : {};
        return m.relatedWeek || null;
      } catch(e) { return null; }
    }).filter(Boolean));
    const missing = expected.filter(w => !paidWeeks.has(w));
    if (missing.length === 0) return { pass: true };
    return { pass: false, reason: `Missing contributions for weeks: ${missing.join(', ')}`, details: { missing } };
  }, { severity: 'ERROR', description: 'No missed required contributions' });

  return {
    registerRule,
    evaluate
  };
}

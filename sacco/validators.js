/**
 * validators.js
 * Basic validation helpers for payloads.
 */

import { toCents } from './math.js';

export function validateTransactionPayload(payload) {
  if (!payload) throw new Error('Transaction payload required');
  const { id, memberId, date, amount, type, description, createdBy } = payload;
  if (!id) throw new Error('transaction.id required');
  if (!memberId) throw new Error('transaction.memberId required');
  if (!date) throw new Error('transaction.date required');
  if (amount == null) throw new Error('transaction.amount required');
  // Ensure amount can be converted to integer cents
  const cents = toCents(amount);
  if (!Number.isFinite(cents)) throw new Error('transaction.amount invalid');
  if (!type) throw new Error('transaction.type required');
  if (!createdBy) throw new Error('transaction.createdBy required');
  return true;
}

export function validateMemberPayload(member) {
  if (!member) throw new Error('member required');
  if (!member.id) throw new Error('member.id required');
  if (!member.name) throw new Error('member.name required');
  return true;
}

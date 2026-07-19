(function (root) {
  function getDefectorStatus(member, columns, payments) {
    if (!member) {
      return { isDefector: false, missedCount: 0, resolved: false };
    }

    const missedCount = (Array.isArray(columns) ? columns : []).reduce((count, column) => {
      const payment = payments?.[member.id]?.[column.id];
      return count + (payment && payment.paid === false ? 1 : 0);
    }, 0);

    const resolved = Boolean(member.defectorResolved);
    return {
      isDefector: missedCount > 0 && !resolved,
      missedCount,
      resolved
    };
  }

  function isMemberDefector(member, columns, payments) {
    return getDefectorStatus(member, columns, payments).isDefector;
  }

  function getMemberEligibility(member, columns, payments, savings) {
    if (!member) {
      return { eligible: false, label: 'No member', reason: 'No member was selected.' };
    }

    const defectorStatus = getDefectorStatus(member, columns, payments);
    if (defectorStatus.isDefector) {
      return {
        eligible: false,
        label: 'Defector',
        reason: 'This member has missed at least one payment.'
      };
    }

    const paidCount = (Array.isArray(columns) ? columns : []).reduce((count, column) => {
      const payment = payments?.[member.id]?.[column.id];
      return count + (payment && payment.paid ? 1 : 0);
    }, 0);

    const totalSavings = Number(savings?.[member.id] || 0);
    if (paidCount === 0 && totalSavings === 0) {
      return {
        eligible: false,
        label: 'No activity',
        reason: 'No payments or savings have been recorded yet.'
      };
    }

    return {
      eligible: true,
      label: 'Eligible',
      reason: 'Payments and savings are in good standing.'
    };
  }

  function getPayoutEligibility(member, columns, payments, savings, weekIndex) {
    const baseEligibility = getMemberEligibility(member, columns, payments, savings);
    if (!baseEligibility.eligible) return baseEligibility;

    const column = Array.isArray(columns) ? columns[weekIndex] : null;
    if (!column) {
      return {
        eligible: false,
        label: 'No week',
        reason: 'Select a week before calculating the payout.'
      };
    }

    const payment = payments?.[member.id]?.[column.id];
    if (!payment || payment.paid !== true) {
      return {
        eligible: false,
        label: 'Pending payment',
        reason: `Payment for ${column.name} is still outstanding.`
      };
    }

    return baseEligibility;
  }

  const api = {
    isMemberDefector,
    getDefectorStatus,
    getMemberEligibility,
    getPayoutEligibility
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SaccoLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

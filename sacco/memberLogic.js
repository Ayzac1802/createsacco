/**
 * memberLogic.js
 * Member creation and simple management (storage via dbAdapter).
 */

import { validateMemberPayload } from './validators.js';

export function createMemberModule(dbAdapter) {
  return {
    async createMember(member) {
      validateMemberPayload(member);
      const now = new Date().toISOString();
      const sql = `INSERT INTO members (id, name, active, suspended, joined_at, group_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const params = [member.id, member.name, member.active ? 1 : 0, member.suspended ? 1 : 0, member.joinedAt || now, member.groupId || null, JSON.stringify(member.metadata || {})];
      await dbAdapter.run(sql, params);
      return { ...member, joinedAt: member.joinedAt || now };
    },

    async getMemberById(id) {
      return dbAdapter.get(`SELECT * FROM members WHERE id = ?`, [id]);
    },

    async updateMember(id, patch) {
      const parts = [];
      const params = [];
      if (patch.name !== undefined) { parts.push('name = ?'); params.push(patch.name); }
      if (patch.active !== undefined) { parts.push('active = ?'); params.push(patch.active ? 1 : 0); }
      if (patch.suspended !== undefined) { parts.push('suspended = ?'); params.push(patch.suspended ? 1 : 0); }
      if (patch.defectorResolvedAt !== undefined) { parts.push('defector_resolved_at = ?'); params.push(patch.defectorResolvedAt); }
      if (patch.groupId !== undefined) { parts.push('group_id = ?'); params.push(patch.groupId); }
      if (patch.metadata !== undefined) { parts.push('metadata = ?'); params.push(JSON.stringify(patch.metadata)); }
      if (parts.length === 0) return this.getMemberById(id);
      const sql = `UPDATE members SET ${parts.join(', ')} WHERE id = ?`;
      params.push(id);
      await dbAdapter.run(sql, params);
      return this.getMemberById(id);
    }
  };
}

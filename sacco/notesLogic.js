/**
 * notesLogic.js
 * Admin notes for members. Not transactions.
 */

import { v4 as uuidv4 } from 'uuid';

export function createNotesModule(dbAdapter, { generateId = () => uuidv4() } = {}) {
  return {
    async addNote({ id, memberId, title, note, date, createdBy, important = false, category = 'General' }) {
      const nid = id || generateId();
      const now = new Date().toISOString();
      const sql = `INSERT INTO notes (id, member_id, title, note, date, created_by, created_at, important, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [nid, memberId, title || null, note || null, date || now, createdBy || null, now, important ? 1 : 0, category];
      await dbAdapter.run(sql, params);
      return { id: nid, memberId, title, note, date: date || now, createdBy, important, category, createdAt: now };
    },

    async editNote(id, { title, note, important, category, lastEditedBy }) {
      const now = new Date().toISOString();
      const parts = [];
      const params = [];
      if (title !== undefined) { parts.push('title = ?'); params.push(title); }
      if (note !== undefined) { parts.push('note = ?'); params.push(note); }
      if (important !== undefined) { parts.push('important = ?'); params.push(important ? 1 : 0); }
      if (category !== undefined) { parts.push('category = ?'); params.push(category); }
      if (parts.length === 0) return this.getNoteById(id);
      parts.push('last_edited_at = ?'); params.push(now);
      parts.push('last_edited_by = ?'); params.push(lastEditedBy || null);
      const sql = `UPDATE notes SET ${parts.join(', ')} WHERE id = ?`;
      params.push(id);
      await dbAdapter.run(sql, params);
      return this.getNoteById(id);
    },

    async deleteNote(id) {
      // Soft delete could be implemented — here we hard delete
      await dbAdapter.run(`DELETE FROM notes WHERE id = ?`, [id]);
      return { id, deleted: true };
    },

    async getNoteById(id) {
      return dbAdapter.get(`SELECT * FROM notes WHERE id = ?`, [id]);
    },

    async searchNotes({ memberId, query, category, important, limit = 50, offset = 0 } = {}) {
      const parts = [];
      const params = [];
      if (memberId) { parts.push('member_id = ?'); params.push(memberId); }
      if (category) { parts.push('category = ?'); params.push(category); }
      if (important !== undefined) { parts.push('important = ?'); params.push(important ? 1 : 0); }
      if (query) { parts.push('(title LIKE ? OR note LIKE ?)'); params.push(`%${query}%`, `%${query}%`); }
      const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
      const sql = `SELECT * FROM notes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      return dbAdapter.all(sql, params);
    }
  };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CrmTeamMember } from '@real-estate/types/crm';

export function TeamRoster() {
  const [members, setMembers] = useState<CrmTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('agent');
  const [newLeadCap, setNewLeadCap] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/team');
        const data = await res.json();
        if (data.ok) setMembers(data.members || []);
      } catch {
        // Fetch failed
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName.trim()) return;

      setSaving(true);
      try {
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName.trim(),
            email: newEmail.trim() || null,
            role: newRole,
            leadCap: newLeadCap ? Number(newLeadCap) : null,
          }),
        });
        const data = await res.json();
        if (data.ok && data.member) {
          setMembers((prev) => [...prev, data.member]);
          setShowAddForm(false);
          setNewName('');
          setNewEmail('');
          setNewRole('agent');
          setNewLeadCap('');
        }
      } catch {
        // Save failed
      } finally {
        setSaving(false);
      }
    },
    [newName, newEmail, newRole, newLeadCap]
  );

  const toggleActive = useCallback(async (memberId: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', memberId, isActive: !isActive }),
      });
      const data = await res.json();
      if (data.ok && data.member) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? data.member : m)));
      }
    } catch {
      // Toggle failed
    }
  }, []);

  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="crm-team-roster">
      <div className="crm-team-roster-header">
        <div>
          <h4>Team Management</h4>
          <span className="crm-muted">
            {activeCount} active member{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
        <button type="button" className="crm-secondary-button" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {showAddForm && (
        <form className="crm-team-add-form" onSubmit={handleAdd}>
          <div className="crm-team-add-row">
            <label className="crm-field">
              Name
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jane Smith" required />
            </label>
            <label className="crm-field">
              Email
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jane@example.com" />
            </label>
          </div>
          <div className="crm-team-add-row">
            <label className="crm-field">
              Role
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="assistant">Assistant</option>
              </select>
            </label>
            <label className="crm-field">
              Lead Cap
              <input
                type="number"
                min="0"
                value={newLeadCap}
                onChange={(e) => setNewLeadCap(e.target.value)}
                placeholder="No limit"
              />
            </label>
          </div>
          <button type="submit" className="crm-primary-button" disabled={saving}>
            {saving ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="crm-muted" style={{ padding: '1rem', textAlign: 'center' }}>Loading team...</p>
      ) : members.length === 0 ? (
        <p className="crm-muted" style={{ padding: '1rem', textAlign: 'center' }}>
          No team members yet. Add your first team member above.
        </p>
      ) : (
        <div className="crm-team-list">
          {members.map((member) => (
            <div
              key={member.id}
              className={`crm-team-member-card ${!member.isActive ? 'crm-team-member-inactive' : ''}`}
            >
              <div className="crm-team-member-info">
                <strong>{member.name}</strong>
                <span className="crm-chip">{member.role}</span>
                {member.leadCap !== null && (
                  <span className="crm-muted">Cap: {member.leadCap}</span>
                )}
              </div>
              {member.email && <span className="crm-muted">{member.email}</span>}
              <button
                type="button"
                className="crm-secondary-button"
                onClick={() => toggleActive(member.id, member.isActive)}
              >
                {member.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

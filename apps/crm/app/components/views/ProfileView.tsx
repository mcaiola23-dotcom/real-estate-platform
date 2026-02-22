import type { Dispatch, SetStateAction } from 'react';
import type { CrmLead } from '@real-estate/types/crm';
import Image from 'next/image';
import type { AgentProfile } from '../../lib/crm-types';
import { getBrandInitials } from '../../lib/crm-brand-theme';
import { passthroughImageLoader } from '../../lib/crm-formatters';

interface ProfileViewProps {
  agentProfile: AgentProfile;
  setAgentProfile: Dispatch<SetStateAction<AgentProfile>>;
  leads: CrmLead[];
  brandInitials: string;
}

export function ProfileView({ agentProfile, setAgentProfile, leads, brandInitials }: ProfileViewProps) {
  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <h3>My Profile</h3>
        <span className="crm-muted">Manage your agent profile and see your performance at a glance.</span>
      </div>
      <div className="crm-profile-layout">
        <aside className="crm-profile-card">
          <div className="crm-profile-headshot-wrap">
            {agentProfile.headshotUrl ? (
              <Image
                loader={passthroughImageLoader}
                src={agentProfile.headshotUrl}
                alt={agentProfile.fullName || 'Agent headshot'}
                width={120}
                height={120}
                unoptimized
                style={{ borderRadius: '50%', objectFit: 'cover', width: 120, height: 120 }}
              />
            ) : (
              <span className="crm-profile-initials">{agentProfile.fullName ? getBrandInitials(agentProfile.fullName) : brandInitials}</span>
            )}
          </div>
          <h4>{agentProfile.fullName || 'Your Name'}</h4>
          <p className="crm-muted">{agentProfile.brokerage || 'Your Brokerage'}</p>
          {agentProfile.licenseNumber && <p className="crm-muted" style={{ fontSize: '0.75rem' }}>License #{agentProfile.licenseNumber}</p>}
          <div className="crm-profile-stats">
            <div className="crm-profile-stat">
              <strong>{leads.length}</strong>
              <span>Total Leads</span>
            </div>
            <div className="crm-profile-stat">
              <strong>{leads.length > 0 ? `${Math.round((leads.filter((l) => l.status === 'won').length / leads.length) * 100)}%` : '0%'}</strong>
              <span>Win Rate</span>
            </div>
            <div className="crm-profile-stat">
              <strong>{leads.filter((l) => l.status === 'new' || l.status === 'qualified' || l.status === 'nurturing').length}</strong>
              <span>Active</span>
            </div>
          </div>
        </aside>
        <div className="crm-profile-form">
          <article>
            <h4>Agent Information</h4>
            <label className="crm-field">
              Full Name
              <input
                type="text"
                value={agentProfile.fullName}
                placeholder="Jane Doe"
                onChange={(event) => setAgentProfile((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </label>
            <label className="crm-field">
              Email
              <input
                type="email"
                value={agentProfile.email}
                placeholder="jane@example.com"
                onChange={(event) => setAgentProfile((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label className="crm-field">
              Phone
              <input
                type="tel"
                value={agentProfile.phone}
                placeholder="(203) 555-0100"
                onChange={(event) => setAgentProfile((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </label>
            <label className="crm-field">
              Brokerage
              <input
                type="text"
                value={agentProfile.brokerage}
                placeholder="Luxury Properties Group"
                onChange={(event) => setAgentProfile((prev) => ({ ...prev, brokerage: event.target.value }))}
              />
            </label>
            <label className="crm-field">
              License Number
              <input
                type="text"
                value={agentProfile.licenseNumber}
                placeholder="RES.0123456"
                onChange={(event) => setAgentProfile((prev) => ({ ...prev, licenseNumber: event.target.value }))}
              />
            </label>
          </article>
          <article>
            <h4>Headshot & Bio</h4>
            <label className="crm-field">
              Headshot URL
              <input
                type="url"
                value={agentProfile.headshotUrl}
                placeholder="https://example.com/headshot.jpg"
                onChange={(event) => setAgentProfile((prev) => ({ ...prev, headshotUrl: event.target.value }))}
              />
            </label>
            <label className="crm-field">
              Bio
              <textarea
                value={agentProfile.bio}
                placeholder="A brief description of your experience and specialties..."
                rows={4}
                onChange={(event) => setAgentProfile((prev) => ({ ...prev, bio: event.target.value }))}
              />
            </label>
          </article>
        </div>
      </div>
    </section>
  );
}

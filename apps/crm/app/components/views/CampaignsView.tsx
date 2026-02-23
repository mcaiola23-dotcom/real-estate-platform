'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CrmCampaign } from '@real-estate/types/crm';
import { DripCampaignBuilder } from '../shared/DripCampaignBuilder';

export function CampaignsView() {
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CrmCampaign | undefined>();

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.ok) setCampaigns(data.campaigns || []);
    } catch {
      // Fetch failed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCampaigns(); }, [fetchCampaigns]);

  const handleSave = useCallback(
    (campaign: CrmCampaign) => {
      setCampaigns((prev) => {
        const existing = prev.findIndex((c) => c.id === campaign.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = campaign;
          return updated;
        }
        return [campaign, ...prev];
      });
      setShowBuilder(false);
      setEditingCampaign(undefined);
    },
    []
  );

  const handleStatusChange = useCallback(async (campaignId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', campaignId, status: newStatus }),
      });
      const data = await res.json();
      if (data.ok && data.campaign) {
        setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? data.campaign : c)));
      }
    } catch {
      // Status update failed
    }
  }, []);

  const getStepCount = (campaign: CrmCampaign) => {
    try {
      return JSON.parse(campaign.stepsJson).length;
    } catch {
      return 0;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'crm-status-qualified';
      case 'paused': return 'crm-status-nurturing';
      case 'completed': return 'crm-status-won';
      default: return 'crm-status-new';
    }
  };

  if (showBuilder) {
    return (
      <section className="crm-panel">
        <DripCampaignBuilder
          campaign={editingCampaign}
          onSave={handleSave}
          onCancel={() => {
            setShowBuilder(false);
            setEditingCampaign(undefined);
          }}
        />
      </section>
    );
  }

  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <div>
          <h3>Campaigns</h3>
          <span className="crm-muted">Automated email sequences for lead nurturing.</span>
        </div>
        <button
          type="button"
          className="crm-primary-button"
          onClick={() => {
            setEditingCampaign(undefined);
            setShowBuilder(true);
          }}
        >
          + New Campaign
        </button>
      </div>

      {loading ? (
        <p className="crm-muted" style={{ padding: '2rem', textAlign: 'center' }}>Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p className="crm-muted">No campaigns yet.</p>
          <p className="crm-muted">Create your first drip campaign to automate follow-ups.</p>
        </div>
      ) : (
        <div className="crm-campaigns-list">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="crm-campaign-card">
              <div className="crm-campaign-card-header">
                <strong>{campaign.name}</strong>
                <span className={`crm-status-badge ${getStatusBadgeClass(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="crm-campaign-card-meta">
                <span className="crm-muted">{getStepCount(campaign)} steps</span>
                <span className="crm-muted">
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="crm-campaign-card-actions">
                <button
                  type="button"
                  className="crm-secondary-button"
                  onClick={() => {
                    setEditingCampaign(campaign);
                    setShowBuilder(true);
                  }}
                >
                  Edit
                </button>
                {campaign.status === 'draft' && (
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => handleStatusChange(campaign.id, 'active')}
                  >
                    Activate
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => handleStatusChange(campaign.id, 'paused')}
                  >
                    Pause
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <button
                    type="button"
                    className="crm-secondary-button"
                    onClick={() => handleStatusChange(campaign.id, 'active')}
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

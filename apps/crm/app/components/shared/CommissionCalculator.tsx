'use client';

import { useMemo, useState } from 'react';

interface CommissionCalculatorProps {
  salePrice?: number;
  defaultCommPct?: number;
  defaultBrokerageSplitPct?: number;
  defaultMarketingFee?: number;
  defaultReferralFee?: number;
  onSave?: (data: {
    salePrice: number;
    commPct: number;
    brokerageSplitPct: number;
    marketingFees: number;
    referralFees: number;
    netAmount: number;
  }) => void;
  readOnly?: boolean;
}

export function CommissionCalculator({
  salePrice: initialSalePrice,
  defaultCommPct = 3,
  defaultBrokerageSplitPct = 70,
  defaultMarketingFee = 0,
  defaultReferralFee = 0,
  onSave,
  readOnly = false,
}: CommissionCalculatorProps) {
  const [salePrice, setSalePrice] = useState(initialSalePrice || 0);
  const [commPct, setCommPct] = useState(defaultCommPct);
  const [brokerageSplitPct, setBrokerageSplitPct] = useState(defaultBrokerageSplitPct);
  const [marketingFees, setMarketingFees] = useState(defaultMarketingFee);
  const [referralFees, setReferralFees] = useState(defaultReferralFee);

  const breakdown = useMemo(() => {
    const grossComm = salePrice * (commPct / 100);
    const agentShare = grossComm * (brokerageSplitPct / 100);
    const brokerageShare = grossComm - agentShare;
    const netAmount = agentShare - marketingFees - referralFees;

    return {
      grossComm: Math.round(grossComm),
      agentShare: Math.round(agentShare),
      brokerageShare: Math.round(brokerageShare),
      netAmount: Math.round(netAmount),
    };
  }, [salePrice, commPct, brokerageSplitPct, marketingFees, referralFees]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents);
  };

  return (
    <div className="crm-commission-calc">
      <div className="crm-commission-inputs">
        <label className="crm-field">
          Sale Price
          <input
            type="number"
            value={salePrice || ''}
            onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
            placeholder="450000"
            disabled={readOnly}
          />
        </label>

        <div className="crm-commission-row">
          <label className="crm-field">
            Commission %
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={commPct}
              onChange={(e) => setCommPct(Number(e.target.value) || 0)}
              disabled={readOnly}
            />
          </label>
          <label className="crm-field">
            Your Split %
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={brokerageSplitPct}
              onChange={(e) => setBrokerageSplitPct(Number(e.target.value) || 0)}
              disabled={readOnly}
            />
          </label>
        </div>

        <div className="crm-commission-row">
          <label className="crm-field">
            Marketing Fees
            <input
              type="number"
              value={marketingFees || ''}
              onChange={(e) => setMarketingFees(Number(e.target.value) || 0)}
              placeholder="0"
              disabled={readOnly}
            />
          </label>
          <label className="crm-field">
            Referral Fees
            <input
              type="number"
              value={referralFees || ''}
              onChange={(e) => setReferralFees(Number(e.target.value) || 0)}
              placeholder="0"
              disabled={readOnly}
            />
          </label>
        </div>
      </div>

      <div className="crm-commission-breakdown">
        <div className="crm-commission-line">
          <span>Gross Commission</span>
          <span className="crm-commission-value">{formatCurrency(breakdown.grossComm)}</span>
        </div>
        <div className="crm-commission-line">
          <span>Brokerage ({100 - brokerageSplitPct}%)</span>
          <span className="crm-commission-value crm-muted">-{formatCurrency(breakdown.brokerageShare)}</span>
        </div>
        <div className="crm-commission-line">
          <span>Your Share ({brokerageSplitPct}%)</span>
          <span className="crm-commission-value">{formatCurrency(breakdown.agentShare)}</span>
        </div>
        {marketingFees > 0 && (
          <div className="crm-commission-line">
            <span>Marketing</span>
            <span className="crm-commission-value crm-muted">-{formatCurrency(marketingFees)}</span>
          </div>
        )}
        {referralFees > 0 && (
          <div className="crm-commission-line">
            <span>Referral</span>
            <span className="crm-commission-value crm-muted">-{formatCurrency(referralFees)}</span>
          </div>
        )}
        <div className="crm-commission-line crm-commission-net">
          <span>Net to You</span>
          <span className="crm-commission-value">{formatCurrency(breakdown.netAmount)}</span>
        </div>
      </div>

      {onSave && !readOnly && salePrice > 0 && (
        <button
          type="button"
          className="crm-primary-button"
          onClick={() =>
            onSave({
              salePrice,
              commPct,
              brokerageSplitPct,
              marketingFees,
              referralFees,
              netAmount: breakdown.netAmount,
            })
          }
        >
          Save Commission
        </button>
      )}
    </div>
  );
}

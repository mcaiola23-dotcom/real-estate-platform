'use client';

import { useState, type FormEvent } from 'react';

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    listingAddress: string;
    source: string;
    leadType: 'buyer' | 'seller';
    notes: string;
    timeframe: string;
    propertyType: string;
    priceMin: string;
    priceMax: string;
    beds: string;
    baths: string;
    sqft: string;
    assignedTo: string;
    referredBy: string;
  }) => void;
  isMutating: boolean;
}

export function NewLeadModal({ open, onClose, onSubmit, isMutating }: NewLeadModalProps) {
  const [address, setAddress] = useState('');
  const [source, setSource] = useState('crm_manual');
  const [leadType, setLeadType] = useState<'buyer' | 'seller'>('buyer');
  const [notes, setNotes] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [referredBy, setReferredBy] = useState('');

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    onSubmit({
      listingAddress: address.trim(),
      source,
      leadType,
      notes: notes.trim(),
      timeframe: timeframe.trim(),
      propertyType,
      priceMin: priceMin.trim(),
      priceMax: priceMax.trim(),
      beds: beds.trim(),
      baths: baths.trim(),
      sqft: sqft.trim(),
      assignedTo: assignedTo.trim(),
      referredBy: referredBy.trim(),
    });
    // Reset
    setAddress(''); setNotes(''); setTimeframe(''); setPriceMin(''); setPriceMax('');
    setBeds(''); setBaths(''); setSqft(''); setAssignedTo(''); setReferredBy('');
  }

  return (
    <>
      <div className="crm-slide-over-overlay" onClick={onClose} />
      <aside className="crm-slide-over" aria-label="New Lead">
        <div className="crm-slide-over__header">
          <h3>New Lead</h3>
          <button type="button" className="crm-icon-button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="crm-slide-over__body" onSubmit={handleSubmit}>
          <label className="crm-field">
            Listing Address *
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Fairfield, CT" autoFocus />
          </label>
          <div className="crm-slide-over__row">
            <label className="crm-field">
              Lead Type
              <select value={leadType} onChange={(e) => setLeadType(e.target.value as 'buyer' | 'seller')}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </label>
            <label className="crm-field">
              Source
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="crm_manual">Manual Entry</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="cold_call">Cold Call</option>
                <option value="open_house">Open House</option>
              </select>
            </label>
          </div>
          <label className="crm-field">
            Property Type
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
              <option value="">Not specified</option>
              <option value="single-family">Single Family</option>
              <option value="condo">Condo</option>
              <option value="multi-family">Multi-Family</option>
              <option value="townhouse">Townhouse</option>
              <option value="land">Land</option>
            </select>
          </label>
          <div className="crm-slide-over__row">
            <label className="crm-field">
              Price Min
              <input type="text" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="250000" />
            </label>
            <label className="crm-field">
              Price Max
              <input type="text" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="500000" />
            </label>
          </div>
          <div className="crm-slide-over__row">
            <label className="crm-field">
              Beds
              <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" />
            </label>
            <label className="crm-field">
              Baths
              <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" />
            </label>
            <label className="crm-field">
              Sqft
              <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="2000" />
            </label>
          </div>
          <label className="crm-field">
            Timeframe
            <input type="text" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} placeholder="e.g. 3-6 months" />
          </label>
          <div className="crm-slide-over__row">
            <label className="crm-field">
              Assigned To
              <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Agent name" />
            </label>
            <label className="crm-field">
              Referred By
              <input type="text" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Referral source" />
            </label>
          </div>
          <label className="crm-field">
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Initial notes about this lead..." rows={3} />
          </label>
          <div className="crm-slide-over__footer">
            <button type="button" className="crm-secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="crm-primary-button" disabled={!address.trim() || isMutating}>
              {isMutating ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

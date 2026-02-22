'use client';

import { memo, useCallback, useState } from 'react';

type DescriptionTone = 'luxury' | 'family-friendly' | 'investment-focused' | 'first-time-buyer';

interface ListingDescriptionResult {
  description: string;
  wordCount: number;
  tone: DescriptionTone;
  provenance: { source: string; latencyMs: number };
}

const TONES: { value: DescriptionTone; label: string }[] = [
  { value: 'luxury', label: 'Luxury' },
  { value: 'family-friendly', label: 'Family-Friendly' },
  { value: 'investment-focused', label: 'Investment' },
  { value: 'first-time-buyer', label: 'First-Time Buyer' },
];

const COMMON_FEATURES = [
  'Updated kitchen', 'Pool', 'Waterfront', 'Garage', 'Fireplace',
  'Hardwood floors', 'Open floor plan', 'New roof', 'Finished basement',
  'Central air', 'Deck', 'Patio', 'Walk-in closet', 'Smart home',
  'Home office', 'Mudroom', 'Wine cellar', 'Solar panels',
];

interface ListingDescriptionGeneratorProps {
  onClose: () => void;
  pushToast: (kind: 'success' | 'error', message: string) => void;
}

export const ListingDescriptionGenerator = memo(function ListingDescriptionGenerator({
  onClose,
  pushToast,
}: ListingDescriptionGeneratorProps) {
  // Form state
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState('single-family');
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [sqft, setSqft] = useState(2000);
  const [lotAcres, setLotAcres] = useState('');
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [agentNotes, setAgentNotes] = useState('');
  const [tone, setTone] = useState<DescriptionTone>('luxury');

  // Result state
  const [result, setResult] = useState<ListingDescriptionResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleFeature = useCallback((feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!address.trim()) {
      pushToast('error', 'Address is required.');
      return;
    }

    setGenerating(true);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch('/api/ai/listing-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          propertyType,
          beds,
          baths,
          sqft,
          lotAcres: lotAcres ? parseFloat(lotAcres) : null,
          price: price ? parseInt(price.replace(/,/g, ''), 10) : null,
          features,
          agentNotes: agentNotes.trim() || null,
          tone,
        }),
      });

      if (!res.ok) {
        pushToast('error', 'Failed to generate description.');
        return;
      }

      const data = (await res.json()) as { ok: boolean; result?: ListingDescriptionResult };
      if (data.ok && data.result) {
        setResult(data.result);
      } else {
        pushToast('error', 'Failed to generate description.');
      }
    } catch {
      pushToast('error', 'Network error.');
    } finally {
      setGenerating(false);
    }
  }, [address, propertyType, beds, baths, sqft, lotAcres, price, features, agentNotes, tone, pushToast]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.description).then(() => {
      setCopied(true);
      pushToast('success', 'Description copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result, pushToast]);

  return (
    <div className="crm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="crm-listing-desc-modal">
        <div className="crm-listing-desc-modal__header">
          <h2>
            <span className="crm-ai-glyph">◆</span> AI Listing Description Generator
          </h2>
          <button className="crm-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="crm-listing-desc-modal__body">
          {/* Left: Form */}
          <div className="crm-listing-desc-modal__form">
            <div className="crm-form-group">
              <label className="crm-label">Address *</label>
              <input
                className="crm-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street, City, ST 00000"
              />
            </div>

            <div className="crm-form-row">
              <div className="crm-form-group">
                <label className="crm-label">Property Type</label>
                <select className="crm-select" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="single-family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi-family">Multi-Family</option>
                  <option value="land">Land</option>
                </select>
              </div>
              <div className="crm-form-group">
                <label className="crm-label">Price</label>
                <input
                  className="crm-input"
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500000"
                />
              </div>
            </div>

            <div className="crm-form-row">
              <div className="crm-form-group">
                <label className="crm-label">Beds</label>
                <input className="crm-input" type="number" min={0} value={beds} onChange={(e) => setBeds(Number(e.target.value))} />
              </div>
              <div className="crm-form-group">
                <label className="crm-label">Baths</label>
                <input className="crm-input" type="number" min={0} step={0.5} value={baths} onChange={(e) => setBaths(Number(e.target.value))} />
              </div>
              <div className="crm-form-group">
                <label className="crm-label">Sqft</label>
                <input className="crm-input" type="number" min={0} value={sqft} onChange={(e) => setSqft(Number(e.target.value))} />
              </div>
              <div className="crm-form-group">
                <label className="crm-label">Lot (acres)</label>
                <input className="crm-input" type="text" value={lotAcres} onChange={(e) => setLotAcres(e.target.value)} placeholder="0.5" />
              </div>
            </div>

            {/* Tone selector */}
            <div className="crm-form-group">
              <label className="crm-label">Tone</label>
              <div className="crm-listing-desc-modal__tones">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`crm-listing-desc-modal__tone ${tone === t.value ? 'crm-listing-desc-modal__tone--active' : ''}`}
                    onClick={() => setTone(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="crm-form-group">
              <label className="crm-label">Features</label>
              <div className="crm-listing-desc-modal__features">
                {COMMON_FEATURES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`crm-listing-desc-modal__feature ${features.includes(f) ? 'crm-listing-desc-modal__feature--active' : ''}`}
                    onClick={() => toggleFeature(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent notes */}
            <div className="crm-form-group">
              <label className="crm-label">Agent Notes (optional)</label>
              <textarea
                className="crm-textarea"
                rows={3}
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="Any specific details to include..."
              />
            </div>

            <button
              className="crm-btn crm-btn-primary"
              onClick={handleGenerate}
              disabled={generating || !address.trim()}
            >
              {generating ? 'Generating...' : 'Generate Description'}
            </button>
          </div>

          {/* Right: Result */}
          <div className="crm-listing-desc-modal__result">
            {!result && !generating && (
              <div className="crm-listing-desc-modal__placeholder">
                <span className="crm-ai-glyph" style={{ fontSize: '2rem', opacity: 0.3 }}>◆</span>
                <p className="crm-muted">Fill in property details and click Generate to create an MLS-ready description.</p>
              </div>
            )}

            {generating && (
              <div className="crm-listing-desc-modal__placeholder">
                <div className="crm-properties-loading__shimmer" />
                <div className="crm-properties-loading__shimmer" style={{ width: '80%' }} />
                <div className="crm-properties-loading__shimmer" style={{ width: '60%' }} />
              </div>
            )}

            {result && !generating && (
              <>
                <div className="crm-listing-desc-modal__result-header">
                  <span className="crm-listing-desc-modal__word-count">{result.wordCount} words</span>
                  <span className="crm-listing-desc-modal__provenance">
                    {result.provenance.source === 'ai' ? 'AI-generated' : 'Auto-generated'} · {result.provenance.latencyMs}ms
                  </span>
                </div>
                <div className="crm-listing-desc-modal__description">
                  {result.description}
                </div>
                <div className="crm-listing-desc-modal__result-actions">
                  <button className="crm-btn crm-btn-primary" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                  <button className="crm-btn crm-btn-ghost" onClick={handleGenerate}>
                    Regenerate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

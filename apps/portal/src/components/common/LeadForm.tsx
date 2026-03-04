'use client';

import { useState } from 'react';
import { trackLeadSubmitted, trackCTAClicked } from '@/lib/analytics';

const API_BASE = '/api/portal';

interface LeadFormProps {
    listingId?: string;
    parcelId?: string;
    address?: string;
    onSuccess?: () => void;
    title?: string;
    className?: string;
}

export default function LeadForm({
    listingId,
    parcelId,
    address,
    onSuccess,
    title = "Contact Agent",
    className = ""
}: LeadFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: 'I am interested in this property and would like to schedule a tour or get more information.',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');

        try {
            const payload = {
                ...formData,
                listing_id_str: listingId,
                parcel_id: parcelId,
                property_address: address,
                intent: 'inquiry',
                source: 'property_detail_modal',
                meta_data: {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            };

            const res = await fetch(`${API_BASE}/leads/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to submit lead');

            setStatus('success');
            setFormData(prev => ({ ...prev, message: '' })); // Clear message but keep contact info? Or clear all?

            // Track successful lead submission
            trackLeadSubmitted({
                intent: 'inquiry',
                source: 'property_detail_modal',
                listing_id: listingId,
                parcel_id: parcelId,
                has_phone: !!formData.phone,
                has_message: !!formData.message,
            });

            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === 'success') {
        return (
            <div className={`p-6 bg-emerald-50 rounded-lg text-center ${className}`}>
                <h3 className="text-lg font-bold text-emerald-700 mb-2">Message Sent!</h3>
                <p className="text-emerald-700">A local expert will contact you shortly.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-sm text-emerald-600 hover:underline"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <div className={`bg-white p-6 rounded-xl border border-stone-200 shadow-sm ${className}`}>
            <h3 className="text-xl font-bold text-stone-900 mb-4">{title}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Name</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-500"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your Name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-500"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Phone (Optional)</label>
                    <input
                        type="tel"
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-500"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(203) 555-0123"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">Message</label>
                    <textarea
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-stone-500"
                        value={formData.message}
                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Sending...' : 'Contact Agent'}
                </button>

                {status === 'error' && (
                    <p className="text-sm text-red-600 text-center">
                        Something went wrong. Please try again.
                    </p>
                )}

                <p className="text-xs text-center text-stone-500">
                    By submitting, you agree to being contacted about your real estate needs.
                </p>
            </form>
        </div>
    );
}

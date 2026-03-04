'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, MapPin, Users, Phone, ExternalLink } from 'lucide-react';

const API_BASE = '/api/portal';

interface School {
  school_id: number;
  name: string;
  school_type: string;
  address: string | null;
  city: string;
  state: string;
  zip_code: string | null;
  rating: number | null;
  enrollment: number | null;
  student_teacher_ratio: number | null;
  grades: string | null;
  website: string | null;
  phone: string | null;
  distance_miles: number | null;
  latitude: number | null;
  longitude: number | null;
}

interface District {
  district_id: number;
  name: string;
  county: string | null;
  state: string;
  overall_rating: number | null;
  website: string | null;
  phone: string | null;
}

interface SchoolsData {
  parcel_id: string | null;
  elementary_school: School | null;
  middle_school: School | null;
  high_school: School | null;
  district: District | null;
  message?: string;
}

interface SchoolsSectionProps {
  listingId?: number;
  parcelId?: string;
}

export default function SchoolsSection({ listingId, parcelId }: SchoolsSectionProps) {
  const [schoolsData, setSchoolsData] = useState<SchoolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      setError(null);

      try {
        let url: string;
        if (listingId) {
          url = `${API_BASE}/api/properties/${listingId}/schools`;
        } else if (parcelId) {
          const encodedParcelId = encodeURIComponent(parcelId);
          url = `${API_BASE}/api/properties/${encodedParcelId}/schools-by-parcel`;
        } else {
          setError('No property identifier provided');
          setLoading(false);
          return;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch schools data');
        setSchoolsData(await response.json());
      } catch {
        setError('Failed to load school information');
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [listingId, parcelId]);

  const renderRating = (rating: number | null) => {
    if (!rating) return <span className="text-stone-400 text-sm">Not Rated</span>;
    const ratingNum = Math.round(rating);
    let style = 'bg-stone-100 text-stone-700';
    if (ratingNum >= 8) style = 'bg-teal-50 text-teal-700';
    else if (ratingNum >= 6) style = 'bg-amber-50 text-amber-700';
    else if (ratingNum >= 4) style = 'bg-amber-50 text-amber-700';
    else style = 'bg-rose-50 text-rose-700';

    return (
      <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${style}`}>
        {ratingNum}/10
      </span>
    );
  };

  const renderSchoolCard = (school: School | null, type: string) => {
    if (!school) {
      return (
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 text-center">
          <p className="text-stone-400 italic text-sm">No {type.toLowerCase()} school assigned</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-5 border border-stone-200 hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="text-stone-600 flex-shrink-0" size={16} />
              <span className="text-xs font-semibold text-stone-500 uppercase">{type}</span>
            </div>
            <h3 className="text-sm font-bold text-stone-900 leading-tight">{school.name}</h3>
            {school.grades && (
              <p className="text-xs text-stone-500 mt-0.5">Grades: {school.grades}</p>
            )}
          </div>
          <div className="flex-shrink-0 ml-2">{renderRating(school.rating)}</div>
        </div>

        <div className="space-y-1.5 text-xs">
          {school.address && (
            <div className="flex items-start gap-1.5 text-stone-500">
              <MapPin size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                {school.address}, {school.city}, {school.state} {school.zip_code}
              </span>
            </div>
          )}
          {school.distance_miles !== null && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <MapPin size={13} />
              <span>{school.distance_miles} miles away</span>
            </div>
          )}
          {school.enrollment && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <Users size={13} />
              <span>{school.enrollment.toLocaleString()} students</span>
            </div>
          )}
          {school.student_teacher_ratio && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <Users size={13} />
              <span>Student-Teacher Ratio: {school.student_teacher_ratio}:1</span>
            </div>
          )}
          {school.phone && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <Phone size={13} />
              <a href={`tel:${school.phone}`} className="text-stone-700 hover:underline">
                {school.phone}
              </a>
            </div>
          )}
          {school.website && (
            <div className="mt-2">
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 text-xs font-medium"
              >
                Visit Website
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 border-t-stone-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!schoolsData) {
    return (
      <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 text-center">
        <p className="text-stone-500 text-sm">No school data available</p>
      </div>
    );
  }

  if (schoolsData.message) {
    return (
      <div className="bg-stone-50 rounded-xl p-8 border border-stone-200 text-center">
        <GraduationCap size={40} className="mx-auto text-stone-300 mb-4" />
        <h3 className="text-base font-semibold text-stone-900 mb-2">School Information</h3>
        <p className="text-stone-500 text-sm">{schoolsData.message}</p>
        <p className="text-xs text-stone-400 mt-3">
          We&apos;re working on importing school data for this area. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* District */}
      {schoolsData.district && (
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 mb-0.5">
                {schoolsData.district.name}
              </h2>
              <p className="text-xs text-stone-500">
                {schoolsData.district.county ? `${schoolsData.district.county} County, ` : ''}
                {schoolsData.district.state}
              </p>
            </div>
            {schoolsData.district.overall_rating && (
              <div className="text-center">
                {renderRating(schoolsData.district.overall_rating)}
                <p className="text-[10px] text-stone-400 mt-1">District</p>
              </div>
            )}
          </div>

          {(schoolsData.district.phone || schoolsData.district.website) && (
            <div className="flex flex-wrap gap-4 text-xs">
              {schoolsData.district.phone && (
                <div className="flex items-center gap-1.5 text-stone-500">
                  <Phone size={13} />
                  <a
                    href={`tel:${schoolsData.district.phone}`}
                    className="text-stone-700 hover:underline"
                  >
                    {schoolsData.district.phone}
                  </a>
                </div>
              )}
              {schoolsData.district.website && (
                <a
                  href={schoolsData.district.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-medium"
                >
                  District Website
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assigned Schools */}
      <div>
        <h2 className="text-base font-bold text-stone-900 mb-3">Assigned Schools</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {renderSchoolCard(schoolsData.elementary_school, 'Elementary')}
          {renderSchoolCard(schoolsData.middle_school, 'Middle')}
          {renderSchoolCard(schoolsData.high_school, 'High')}
        </div>
      </div>

      <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
        <p className="text-[11px] text-stone-400">
          <strong>Note:</strong> School assignments are based on property address and district
          boundaries. Please verify with the school district as boundaries may change. Ratings are
          from GreatSchools and may not reflect the most current information.
        </p>
      </div>
    </div>
  );
}

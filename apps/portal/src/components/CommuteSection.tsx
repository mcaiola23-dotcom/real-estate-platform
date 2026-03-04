'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Train, Clock, TrendingUp, Loader2 } from 'lucide-react';

const API_BASE = '/api/portal';

interface CommuteData {
  destination: string;
  destination_address: string;
  drive_time_min: number | null;
  drive_time_peak_min: number | null;
  distance_miles: number | null;
  cached: boolean;
  nearest_station_name: string | null;
  estimated_train_time_min: number | null;
}

interface CommuteSectionProps {
  listingId?: number;
  parcelId?: string;
  accessToken?: string | null;
}

interface SavedLocation {
  id: number;
  location_type: string;
  label: string | null;
  address: string;
  lat: number;
  lng: number;
  commute_mode: string;
  is_primary: boolean;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

export default function CommuteSection({ listingId, parcelId, accessToken }: CommuteSectionProps) {
  const [grandCentralData, setGrandCentralData] = useState<CommuteData | null>(null);
  const [trainStationData, setTrainStationData] = useState<CommuteData | null>(null);
  const [savedLocationData, setSavedLocationData] = useState<Map<number, CommuteData>>(new Map());
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [customDestination, setCustomDestination] = useState('');
  const [customData, setCustomData] = useState<CommuteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customLoading, setCustomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const propertyId = listingId ? listingId.toString() : parcelId;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/places/autocomplete?input=${encodeURIComponent(query)}&types=address`
      );
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data.predictions || []);
      setShowSuggestions((data.predictions || []).length > 0);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomDestination(newValue);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => fetchSuggestions(newValue), 300);
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    const selectedAddress = suggestion.description;
    setCustomDestination(selectedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    if (!propertyId) return;
    setCustomLoading(true);
    setCustomError(null);
    setCustomData(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/properties/${encodeURIComponent(propertyId)}/calculate-commute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: selectedAddress }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate commute');
      }
      setCustomData(await response.json());
    } catch (err: any) {
      setCustomError(err.message || 'Unable to calculate commute.');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (!propertyId) return;

    const fetchPresetCommutes = async () => {
      setLoading(true);
      setError(null);

      try {
        const readErrorDetail = async (response: Response): Promise<string | null> => {
          try {
            const payload = await response.json();
            if (typeof payload?.detail === 'string' && payload.detail.trim()) return payload.detail;
          } catch {
            // ignore
          }
          return null;
        };

        const [gcResponse, trainResponse] = await Promise.all([
          fetch(
            `${API_BASE}/api/properties/${encodeURIComponent(propertyId)}/calculate-commute`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ destination: 'nyc_grand_central' }),
            }
          ),
          fetch(
            `${API_BASE}/api/properties/${encodeURIComponent(propertyId)}/calculate-commute`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ destination: 'nearest_train' }),
            }
          ),
        ]);

        if (!gcResponse.ok && !trainResponse.ok) {
          const [gcErr, trainErr] = await Promise.all([
            readErrorDetail(gcResponse),
            readErrorDetail(trainResponse),
          ]);
          setError(
            gcErr || trainErr || 'Commute estimates are currently unavailable for this property.'
          );
          return;
        }

        if (gcResponse.ok) setGrandCentralData(await gcResponse.json());
        if (trainResponse.ok) setTrainStationData(await trainResponse.json());
      } catch {
        setError('Failed to load commute information');
      } finally {
        setLoading(false);
      }
    };

    fetchPresetCommutes();
  }, [propertyId]);

  // Saved locations
  useEffect(() => {
    if (!accessToken || !propertyId) return;

    const fetchSavedLocations = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/locations`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const locations: SavedLocation[] = await response.json();
          setSavedLocations(locations);

          const results = await Promise.all(
            locations.map(async (loc) => {
              try {
                const res = await fetch(
                  `${API_BASE}/api/properties/${encodeURIComponent(propertyId)}/calculate-commute`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destination: loc.address }),
                  }
                );
                if (res.ok) return { id: loc.id, data: await res.json() };
              } catch {
                // skip
              }
              return null;
            })
          );

          const map = new Map<number, CommuteData>();
          results.forEach((r) => { if (r) map.set(r.id, r.data); });
          setSavedLocationData(map);
        }
      } catch {
        // not critical
      }
    };

    fetchSavedLocations();
  }, [accessToken, propertyId]);

  const handleCustomCommute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDestination.trim() || !propertyId) return;

    setCustomLoading(true);
    setCustomError(null);
    setCustomData(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/properties/${encodeURIComponent(propertyId)}/calculate-commute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: customDestination.trim() }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate commute');
      }
      setCustomData(await response.json());
    } catch (err: any) {
      setCustomError(err.message || 'Unable to calculate commute.');
    } finally {
      setCustomLoading(false);
    }
  };

  const renderCommuteCard = (
    data: CommuteData | null,
    icon: React.ReactNode,
    title: string,
    showBadge = false
  ) => {
    if (!data) {
      return (
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 text-center">
          <p className="text-stone-400 italic text-sm">Commute data unavailable</p>
        </div>
      );
    }

    const isDriveUnder60 = data.drive_time_min != null && data.drive_time_min < 60;

    return (
      <div className="bg-white rounded-xl p-5 border border-stone-200 hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h3 className="text-sm font-bold text-stone-900">{title}</h3>
              {data.nearest_station_name && (
                <p className="text-xs text-stone-500">{data.nearest_station_name}</p>
              )}
            </div>
          </div>
          {showBadge && isDriveUnder60 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
              &lt;60 min
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.drive_time_min !== null && (
            <div className="flex items-center gap-3">
              <div className="bg-stone-100 rounded-full p-2">
                <Clock size={18} className="text-stone-700" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Drive Time</p>
                <p className="text-base font-bold text-stone-900">{data.drive_time_min} min</p>
              </div>
            </div>
          )}
          {data.drive_time_peak_min !== null &&
            data.drive_time_peak_min !== data.drive_time_min && (
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 rounded-full p-2">
                  <TrendingUp size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Peak Hours</p>
                  <p className="text-base font-bold text-stone-900">
                    {data.drive_time_peak_min} min
                  </p>
                </div>
              </div>
            )}
          {data.estimated_train_time_min !== null && (
            <div className="flex items-center gap-3">
              <div className="bg-teal-50 rounded-full p-2">
                <Train size={18} className="text-teal-700" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Train to Grand Central</p>
                <p className="text-base font-bold text-stone-900">
                  ~{data.estimated_train_time_min} min
                </p>
              </div>
            </div>
          )}
          {data.distance_miles !== null && (
            <div className="flex items-center gap-3">
              <div className="bg-stone-100 rounded-full p-2">
                <MapPin size={18} className="text-stone-500" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Distance</p>
                <p className="text-base font-bold text-stone-900">{data.distance_miles} mi</p>
              </div>
            </div>
          )}
        </div>

        {data.cached && (
          <p className="text-[10px] text-stone-400 mt-3 italic">Cached &bull; Updated within 30 days</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-stone-50 rounded-xl p-12 border border-stone-200 text-center">
        <Loader2 className="animate-spin mx-auto text-stone-400 mb-3" size={40} />
        <p className="text-stone-500 text-sm">Loading commute information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-8 border border-red-200 text-center">
        <MapPin size={40} className="mx-auto text-red-300 mb-3" />
        <p className="text-red-800 font-semibold text-sm mb-1">Unable to load commute data</p>
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-semibold text-stone-900 mb-1">
          Commute & Transportation
        </h2>
        <p className="text-stone-500 text-sm">
          See how long it takes to reach key destinations from this property.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {renderCommuteCard(
          grandCentralData,
          <Train size={20} className="text-stone-700" />,
          'NYC Grand Central',
          true
        )}
        {renderCommuteCard(
          trainStationData,
          <Train size={20} className="text-teal-600" />,
          'Nearest Train Station'
        )}

        {savedLocations.length > 0 && (
          <>
            <div className="col-span-full mt-2 mb-1">
              <h3 className="text-sm font-semibold text-stone-800">Your Saved Locations</h3>
              <p className="text-xs text-stone-500">
                Commute times from this property to your saved destinations
              </p>
            </div>
            {savedLocations.map((location) => {
              const commuteData = savedLocationData.get(location.id);
              const iconColor =
                location.location_type === 'work'
                  ? 'text-stone-700'
                  : location.location_type === 'home'
                  ? 'text-teal-600'
                  : location.location_type === 'gym'
                  ? 'text-amber-600'
                  : 'text-stone-500';
              return (
                <div key={location.id}>
                  {renderCommuteCard(
                    commuteData || null,
                    <MapPin size={20} className={iconColor} />,
                    location.label ||
                      location.location_type.charAt(0).toUpperCase() +
                        location.location_type.slice(1)
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Custom destination */}
      <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
        <h3 className="text-sm font-bold text-stone-900 mb-2">Calculate Custom Commute</h3>
        <p className="text-xs text-stone-500 mb-3">
          Enter your workplace or any destination to see commute times.
        </p>

        <form onSubmit={handleCustomCommute} className="space-y-3">
          <div ref={wrapperRef} className="relative">
            <input
              type="text"
              value={customDestination}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Enter workplace address (e.g., 350 5th Ave, New York, NY)"
              className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={customLoading}
              autoComplete="off"
            />

            {suggestionsLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="animate-spin text-teal-600" size={18} />
              </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.place_id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`px-4 py-2.5 cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-teal-50' : 'hover:bg-stone-50'
                    } ${index !== suggestions.length - 1 ? 'border-b border-stone-100' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-teal-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {suggestion.main_text}
                        </p>
                        {suggestion.secondary_text && (
                          <p className="text-xs text-stone-500 truncate">
                            {suggestion.secondary_text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-stone-400 mt-1.5">
              Start typing for address suggestions
            </p>
          </div>

          <button
            type="submit"
            disabled={customLoading || !customDestination.trim()}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {customLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Calculating...
              </>
            ) : (
              <>
                <Clock size={16} />
                Calculate Commute
              </>
            )}
          </button>
        </form>

        {customError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-xs">{customError}</p>
          </div>
        )}

        {customData && (
          <div className="mt-3">
            {renderCommuteCard(
              customData,
              <MapPin size={20} className="text-teal-600" />,
              customData.destination
            )}
          </div>
        )}
      </div>

      <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
        <p className="text-[11px] text-stone-400">
          <strong>Note:</strong> Commute times are estimates based on current traffic patterns. Peak
          hours refer to weekday rush hour (7-9 AM, 5-7 PM). Transit times include walking to/from
          stations.
        </p>
      </div>
    </div>
  );
}

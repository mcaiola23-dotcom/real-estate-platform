import { useCallback } from 'react'

interface AddressSuggestion {
  value: string
  place_id?: string
}

interface OpenListingArgs {
  listingId: number
  parcelId?: string
  address?: string
  city?: string
  status?: string
}

interface OpenParcelArgs {
  parcelId: string
  address?: string
  city?: string
  status?: string
}

interface UseAddressSelectionOptions {
  apiBase?: string
  debugLog?: (...args: unknown[]) => void
  onSearchTermChange: (term: string) => void
  onOpenListing: (args: OpenListingArgs) => void
  onOpenParcel: (args: OpenParcelArgs) => void
}

export function useAddressSelection({
  apiBase = '/api/portal',
  debugLog = () => {},
  onSearchTermChange,
  onOpenListing,
  onOpenParcel,
}: UseAddressSelectionOptions) {
  return useCallback(async (suggestion: AddressSuggestion) => {
    debugLog('[Properties] onAddressSelect called with:', suggestion)
    onSearchTermChange(suggestion.value)

    try {
      debugLog('[Properties] Step 1: Trying database address lookup')
      const lookupRes = await fetch(
        `${apiBase}/api/autocomplete/lookup?address=${encodeURIComponent(suggestion.value)}`
      )

      if (lookupRes.ok) {
        const lookupData = await lookupRes.json()
        debugLog('[Properties] Lookup result:', lookupData)

        if (lookupData.found && lookupData.best_match) {
          const match = lookupData.best_match
          debugLog('[Properties] Found match via lookup:', match.address_full, 'similarity:', match.similarity)

          if (match.similarity > 0.6) {
            if (match.listing_id) {
              onOpenListing({
                listingId: match.listing_id,
                parcelId: match.parcel_id,
                address: match.address_full || suggestion.value,
                city: match.city,
                status: match.status,
              })
              return
            } else if (match.parcel_id) {
              onOpenParcel({
                parcelId: match.parcel_id,
                address: match.address_full || suggestion.value,
                city: match.city,
                status: match.status,
              })
              return
            }
          }
        }
      }

      debugLog('[Properties] Step 2: Trying search with coordinates')
      let lat: number | undefined
      let lng: number | undefined

      if (suggestion.place_id) {
        const detailsRes = await fetch(
          `${apiBase}/api/places/details?place_id=${suggestion.place_id}`
        )
        if (detailsRes.ok) {
          const details = await detailsRes.json()
          lat = details.location?.lat
          lng = details.location?.lng
          debugLog('[Properties] Got coordinates from place_id:', lat, lng)
        }
      }

      const response = await fetch(
        `${apiBase}/api/search/properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: suggestion.value,
            filters: {
              status: ['Active', 'Pending', 'Sold', 'Off-Market'],
            },
            page: 1,
            page_size: 5,
          }),
        }
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        let property = data.results[0]

        if (lat && lng && data.results.length > 1) {
          let minDist = Infinity
          for (const candidate of data.results) {
            if (candidate.latitude && candidate.longitude) {
              const dist = Math.abs(candidate.latitude - lat) + Math.abs(candidate.longitude - lng)
              if (dist < minDist) {
                minDist = dist
                property = candidate
              }
            }
          }
        }

        if (property.listing_id) {
          onOpenListing({
            listingId: property.listing_id,
            parcelId: property.parcel_id,
            address: property.address,
            city: property.city,
            status: property.status,
          })
          return
        } else if (property.parcel_id) {
          onOpenParcel({
            parcelId: property.parcel_id,
            address: property.address,
            city: property.city,
            status: property.status,
          })
          return
        }
      }

      if (lat && lng) {
        const searchLat = lat
        const searchLng = lng
        debugLog('[Properties] Step 3: Trying coordinate search at', searchLat, searchLng)

        const delta = 0.001
        const bbox = `${searchLng - delta},${searchLat - delta},${searchLng + delta},${searchLat + delta}`

        const parcelRes = await fetch(
          `${apiBase}/api/map/parcels?bbox=${bbox}&zoom=18&limit=10&attributes=core`
        )

        if (parcelRes.ok) {
          const parcelData = await parcelRes.json()
          debugLog('[Properties] Coordinate search results:', parcelData)

          if (parcelData.features && parcelData.features.length > 0) {
            let closestParcel = parcelData.features[0]
            let minDist = Infinity

            const getCentroid = (coords: any): [number, number] | null => {
              try {
                let points: number[][] = []
                if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                  points = coords[0]
                } else if (Array.isArray(coords[0])) {
                  points = coords
                } else {
                  return [coords[0], coords[1]]
                }
                let sumLng = 0
                let sumLat = 0
                for (const point of points) {
                  sumLng += point[0]
                  sumLat += point[1]
                }
                return [sumLng / points.length, sumLat / points.length]
              } catch {
                return null
              }
            }

            for (const feature of parcelData.features) {
              const centroid = feature.properties?.centroid
              let parcelLat: number | undefined
              let parcelLng: number | undefined

              if (centroid && Array.isArray(centroid) && centroid.length >= 2) {
                parcelLng = centroid[0]
                parcelLat = centroid[1]
              } else {
                const coords = feature.geometry?.coordinates
                if (coords) {
                  const calculatedCentroid = getCentroid(coords)
                  if (calculatedCentroid) {
                    parcelLng = calculatedCentroid[0]
                    parcelLat = calculatedCentroid[1]
                  }
                }
              }

              if (parcelLat && parcelLng) {
                const dist = Math.abs(parcelLat - searchLat) + Math.abs(parcelLng - searchLng)
                if (dist < minDist) {
                  minDist = dist
                  closestParcel = feature
                }
              }
            }

            const parcelId = closestParcel.properties?.parcel_id
            const listingId = closestParcel.properties?.listing_id

            debugLog('[Properties] Found closest parcel:', parcelId, 'listing:', listingId)

            if (listingId) {
              onOpenListing({
                listingId,
                parcelId,
                address: closestParcel.properties?.address || suggestion.value,
                city: closestParcel.properties?.city,
                status: closestParcel.properties?.status || closestParcel.properties?.listing_status,
              })
            } else if (parcelId) {
              onOpenParcel({
                parcelId,
                address: closestParcel.properties?.address || suggestion.value,
                city: closestParcel.properties?.city,
                status: closestParcel.properties?.status || closestParcel.properties?.listing_status,
              })
            }
          } else {
            debugLog('[Properties] No parcels found near coordinates')
          }
        }
      } else {
        debugLog('[Properties] No property found for address:', suggestion.value)
      }
    } catch (error) {
      console.error('[Properties] Error fetching property:', error)
    }
  }, [apiBase, debugLog, onOpenListing, onOpenParcel, onSearchTermChange])
}

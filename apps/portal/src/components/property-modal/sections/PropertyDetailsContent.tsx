import type { PropertyData } from '../types'
import { featureTags, formatDate } from '../utils'

interface NeighborhoodMapProps {
  latitude: number
  longitude: number
  parcelId: string
  address: string
  neighborhood?: string
  onPropertyClick?: (parcelId: string, listingId?: number) => void
}

interface PropertyDetailsContentProps {
  property: PropertyData
  onPropertyClick?: (parcelId: string, listingId?: number) => void
  NeighborhoodMapComponent: React.ComponentType<NeighborhoodMapProps>
}

export function PropertyDetailsContent({
  property,
  onPropertyClick,
  NeighborhoodMapComponent,
}: PropertyDetailsContentProps) {
  return (
    <>
      {/* Construction & Systems */}
      {(property.construction ||
        property.heating ||
        property.cooling ||
        property.flooring ||
        property.roof ||
        property.foundation ||
        property.water ||
        property.pool) && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            Construction & Systems
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {property.construction && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Construction</p>
                <p className="text-sm font-medium text-stone-900">{property.construction}</p>
              </div>
            )}
            {property.heating && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Heating</p>
                <p className="text-sm font-medium text-stone-900">{property.heating}</p>
              </div>
            )}
            {property.cooling && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Cooling</p>
                <p className="text-sm font-medium text-stone-900">{property.cooling}</p>
              </div>
            )}
            {property.flooring && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Flooring</p>
                <p className="text-sm font-medium text-stone-900">{property.flooring}</p>
              </div>
            )}
            {property.roof && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Roof</p>
                <p className="text-sm font-medium text-stone-900">{property.roof}</p>
              </div>
            )}
            {property.foundation && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Foundation</p>
                <p className="text-sm font-medium text-stone-900">{property.foundation}</p>
              </div>
            )}
            {property.water && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Water</p>
                <p className="text-sm font-medium text-stone-900">{property.water}</p>
              </div>
            )}
            {property.pool && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Pool</p>
                <p className="text-sm font-medium text-stone-900">{property.pool}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature tags */}
      {(property.interiorFeatures || property.exteriorFeatures) && (
        <div className="space-y-3">
          {property.interiorFeatures && (
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-2">
                Interior Features
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {featureTags(property.interiorFeatures).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {property.exteriorFeatures && (
            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-2">
                Exterior Features
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {featureTags(property.exteriorFeatures).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional details */}
      {(property.totalRooms != null ||
        property.condition ||
        property.effectiveArea != null ||
        property.zoning ||
        property.landUse ||
        property.parkingDescription ||
        property.fireplaces != null ||
        property.view) && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            Additional Details
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {property.totalRooms != null && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Total Rooms</p>
                <p className="text-sm font-medium text-stone-900">
                  {property.totalRooms}
                </p>
              </div>
            )}
            {property.condition && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Condition</p>
                <p className="text-sm font-medium text-stone-900">
                  {property.condition}
                </p>
              </div>
            )}
            {property.effectiveArea != null && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Effective Area</p>
                <p className="text-sm font-medium text-stone-900">
                  {property.effectiveArea.toLocaleString()} sqft
                </p>
              </div>
            )}
            {property.zoning && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Zoning</p>
                <p className="text-sm font-medium text-stone-900">{property.zoning}</p>
              </div>
            )}
            {property.landUse && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Land Use</p>
                <p className="text-sm font-medium text-stone-900">{property.landUse}</p>
              </div>
            )}
            {property.parkingDescription && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Parking</p>
                <p className="text-sm font-medium text-stone-900">
                  {property.parkingDescription}
                </p>
              </div>
            )}
            {property.fireplaces != null && property.fireplaces > 0 && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">Fireplaces</p>
                <p className="text-sm font-medium text-stone-900">
                  {property.fireplaces}
                </p>
              </div>
            )}
            {property.view && (
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <p className="text-xs text-stone-400">View</p>
                <p className="text-sm font-medium text-stone-900">{property.view}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment & Appraisal */}
      {(property.assessmentLand != null ||
        property.assessmentBuilding != null ||
        property.appraisedLand != null ||
        property.appraisedBuilding != null) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {(property.assessmentLand != null || property.assessmentBuilding != null) && (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                Assessment
              </h3>
              <div className="space-y-2">
                {property.assessmentLand != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Land</span>
                    <span className="font-medium text-stone-900">
                      ${property.assessmentLand.toLocaleString()}
                    </span>
                  </div>
                )}
                {property.assessmentBuilding != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Building</span>
                    <span className="font-medium text-stone-900">
                      ${property.assessmentBuilding.toLocaleString()}
                    </span>
                  </div>
                )}
                {property.assessmentTotal != null && (
                  <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                    <span className="font-semibold text-stone-900">Total</span>
                    <span className="font-bold text-stone-900">
                      ${property.assessmentTotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {(property.appraisedLand != null || property.appraisedBuilding != null) && (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                Appraisal
              </h3>
              <div className="space-y-2">
                {property.appraisedLand != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Land</span>
                    <span className="font-medium text-stone-900">
                      ${property.appraisedLand.toLocaleString()}
                    </span>
                  </div>
                )}
                {property.appraisedBuilding != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Building</span>
                    <span className="font-medium text-stone-900">
                      ${property.appraisedBuilding.toLocaleString()}
                    </span>
                  </div>
                )}
                {property.appraisedTotal != null && (
                  <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                    <span className="font-semibold text-stone-900">Total</span>
                    <span className="font-bold text-stone-900">
                      ${property.appraisedTotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sale history timeline */}
      {(property.lastSalePrice != null || property.priorSalePrice != null) && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Sale History</h3>
          <div className="space-y-2">
            {property.lastSalePrice != null && property.lastSalePrice > 0 && (
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-stone-500">Last Sale</p>
                  <p className="text-sm font-semibold text-stone-900">
                    ${property.lastSalePrice.toLocaleString()}
                  </p>
                </div>
                {property.lastSaleDate && (
                  <span className="text-xs text-stone-400">
                    {formatDate(property.lastSaleDate)}
                  </span>
                )}
              </div>
            )}
            {property.priorSalePrice != null && property.priorSalePrice > 0 && (
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-stone-500">Prior Sale</p>
                  <p className="text-sm font-semibold text-stone-900">
                    ${property.priorSalePrice.toLocaleString()}
                  </p>
                </div>
                {property.priorSaleDate && (
                  <span className="text-xs text-stone-400">
                    {formatDate(property.priorSaleDate)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HOA */}
      {property.hoaFee != null && property.hoaFee > 0 && (
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">HOA</h3>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Fee</span>
            <span className="font-medium text-stone-900">
              ${property.hoaFee.toLocaleString()}
              {property.hoaFrequency ? ` / ${property.hoaFrequency}` : ''}
            </span>
          </div>
          {property.hoaName && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-stone-500">Association</span>
              <span className="font-medium text-stone-900">{property.hoaName}</span>
            </div>
          )}
        </div>
      )}

      {/* Parcel ID */}
      <div className="text-xs text-stone-400 pt-2 border-t border-stone-100">
        Parcel ID: {property.parcelId}
      </div>

      {/* Neighborhood satellite map */}
      {property.latitude && property.longitude && (
        <div data-print-hide>
          <NeighborhoodMapComponent
            latitude={property.latitude}
            longitude={property.longitude}
            parcelId={property.parcelId}
            address={property.address}
            neighborhood={property.subdivision}
            onPropertyClick={onPropertyClick}
          />
        </div>
      )}
    </>
  )
}

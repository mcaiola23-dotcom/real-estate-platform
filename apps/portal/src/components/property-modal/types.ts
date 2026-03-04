export interface PropertyData {
  parcelId: string;
  listingId?: number;
  status: 'Active' | 'Pending' | 'Sold' | 'Off-Market';
  hasListing: boolean;

  address: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;

  listPrice?: number;
  originalListPrice?: number;
  soldPrice?: number;
  soldDate?: string;
  listDate?: string;
  daysOnMarket?: number;

  bedrooms?: number;
  bathrooms?: number;
  bathsFull?: number;
  bathsHalf?: number;
  squareFeet?: number;
  lotSizeAcres?: number;
  yearBuilt?: number;
  stories?: number;
  garageSpaces?: number;
  totalRooms?: number;
  condition?: string;
  effectiveArea?: number;

  propertyType?: string;
  style?: string;
  subdivision?: string;

  photos: string[];
  virtualTourUrl?: string;

  publicRemarks?: string;
  interiorFeatures?: string;
  exteriorFeatures?: string;
  construction?: string;
  heating?: string;
  cooling?: string;
  flooring?: string;
  roof?: string;
  foundation?: string;
  pool?: string;
  view?: string;
  water?: string;
  fireplaces?: number;
  parkingSpaces?: number;
  parkingDescription?: string;

  schoolElementary?: string;
  schoolMiddle?: string;
  schoolHigh?: string;
  schoolDistrict?: string;

  hoaFee?: number;
  hoaFrequency?: string;
  hoaName?: string;

  assessmentTotal?: number;
  assessmentLand?: number;
  assessmentBuilding?: number;
  appraisedTotal?: number;
  appraisedLand?: number;
  appraisedBuilding?: number;
  taxAnnualAmount?: number;
  estimatedTaxAnnual?: number;
  taxSource?: 'mls' | 'mill-rate';
  zoning?: string;
  landUse?: string;

  lastSalePrice?: number;
  lastSaleDate?: string;
  priorSalePrice?: number;
  priorSaleDate?: string;

  agent?: { name: string; email?: string; phone?: string };
  office?: { name: string; email?: string; phone?: string };
}

export interface AvmData {
  estimated_value: number;
  confidence_score: number;
  low_estimate: number;
  high_estimate: number;
  valuation_date: string;
  model_version?: string;
  feature_importance?: string[];
}

# Database Schema Design - SmartMLS AI Platform

**Status**: Ready for Implementation  
**Last Updated**: After CT GIS and SimplyRETS field analysis  
**Design Philosophy**: Parcel-centric architecture with MLS overlay

## Design Principles

1. **Parcel-Centric Foundation**: Every property has a parcel (complete market coverage)
2. **MLS Overlay**: Listings reference parcels (one parcel can have multiple listings over time)
3. **Data Source Preservation**: Store original IDs and data from both sources
4. **IDX Compliance**: Separate public/private fields, track attribution
5. **Spatial Support**: PostGIS geometry for parcel boundaries and spatial queries

## Schema Overview

### Core Tables
1. `parcels` - CT GIS foundation data
2. `listings` - SimplyRETS MLS data
3. `address_matches` - Matching tracking between sources
4. `agents` - Agent information (for IDX compliance)
5. `offices` - Office information (for IDX compliance)

---

## Table: `parcels`

**Purpose**: Foundation layer from CT GIS parcel data  
**Source**: CT GIS GeoJSON files  
**Primary Key**: `parcel_id` (from CT GIS `Parcel_ID` or `CAMA_Link`)

### Column Definitions

| Column | Type | Nullable | Source Field | Notes |
|--------|------|----------|--------------|-------|
| `parcel_id` | VARCHAR(50) | NO | `Parcel_ID` or `CAMA_Link` | PRIMARY KEY, unique identifier |
| `cama_link` | VARCHAR(50) | YES | `CAMA_Link` | Alternative identifier |
| `object_id` | INTEGER | YES | `OBJECTID` | CT GIS object ID |
| `town_name` | VARCHAR(50) | NO | `Town_Name` | Fairfield County town |
| `address_full` | VARCHAR(255) | YES | `Location` | Normalized full address |
| `address_number` | VARCHAR(20) | YES | Parsed from `Location` | Street number |
| `street_name` | VARCHAR(200) | YES | Parsed from `Location` | Street name |
| `city` | VARCHAR(100) | NO | `Property_City` | City name |
| `state` | VARCHAR(2) | NO | Default 'CT' | State |
| `zip_code` | VARCHAR(10) | YES | `Property_Zip` | ZIP code |
| `geometry` | GEOMETRY(POLYGON, 4326) | NO | `geometry` | PostGIS parcel boundary |
| `centroid` | GEOMETRY(POINT, 4326) | NO | Calculated | Center point for map markers |
| `lot_size_acres` | DECIMAL(10,4) | YES | `Land_Acres` | Lot size in acres |
| `lot_size_sqft` | INTEGER | YES | Calculated | Lot size in square feet |
| `zoning` | VARCHAR(50) | YES | `Zone` | Zoning classification |
| `land_use` | VARCHAR(50) | YES | `State_Use` | Land use code |
| `land_use_description` | VARCHAR(255) | YES | `State_Use_Description` | Land use description |
| `assessment_total` | DECIMAL(12,2) | YES | `Assessed_Total` | Total assessed value |
| `assessment_land` | DECIMAL(12,2) | YES | `Assessed_Land` | Land assessment |
| `assessment_building` | DECIMAL(12,2) | YES | `Assessed_Building` | Building assessment |
| `appraised_land` | DECIMAL(12,2) | YES | `Appraised_Land` | Appraised land value |
| `appraised_building` | DECIMAL(12,2) | YES | `Appraised_Building` | Appraised building value |
| `appraised_total` | DECIMAL(12,2) | YES | Calculated | Sum of appraised values |
| `tax_year` | INTEGER | YES | `Valuation_Year` | Assessment/tax year |
| `year_built` | INTEGER | YES | `EYB` or `AYB` | Year built (effective or actual) |
| `square_feet` | INTEGER | YES | `Living_Area` | Building square footage |
| `effective_area` | INTEGER | YES | `Effective_Area` | Effective area |
| `bedrooms` | INTEGER | YES | `Number_of_Bedroom` | Number of bedrooms |
| `bathrooms` | DECIMAL(3,1) | YES | Calculated | Total bathrooms |
| `baths_full` | INTEGER | YES | `Number_of_Baths` | Full bathrooms |
| `baths_half` | INTEGER | YES | `Number_of_Half_Baths` | Half bathrooms |
| `total_rooms` | INTEGER | YES | `Total_Rooms` | Total rooms |
| `property_type` | VARCHAR(50) | YES | `Parcel_Type` | Property type |
| `condition` | VARCHAR(50) | YES | `Condition` | Property condition |
| `model` | VARCHAR(100) | YES | `Model` | Property model |
| `last_sale_price` | DECIMAL(12,2) | YES | `Sale_Price` | Last sale price |
| `last_sale_date` | DATE | YES | `Sale_Date` | Last sale date |
| `prior_sale_price` | DECIMAL(12,2) | YES | `Prior_Sale_Price` | Prior sale price |
| `prior_sale_date` | DATE | YES | `Prior_Sale_Date` | Prior sale date |
| `collection_year` | VARCHAR(4) | YES | `Collection_year` | Data collection year |
| `fips_code` | VARCHAR(20) | YES | `FIPS` | FIPS code |
| `cog` | VARCHAR(50) | YES | `COG` | Council of Governments |
| `shape_area` | DECIMAL(15,6) | YES | `Shape__Area` | Original shape area |
| `shape_length` | DECIMAL(15,6) | YES | `Shape__Length` | Original shape length |
| `created_at` | TIMESTAMP | NO | Default NOW() | Record creation |
| `updated_at` | TIMESTAMP | YES | Default NOW() | Record update |

### Indexes
- PRIMARY KEY: `parcel_id`
- INDEX: `city`
- INDEX: `zip_code`
- INDEX: `zoning`
- SPATIAL INDEX: `geometry` (GIST)
- SPATIAL INDEX: `centroid` (GIST)

---

## Table: `listings`

**Purpose**: MLS listing data from SimplyRETS  
**Source**: SimplyRETS API  
**Primary Key**: `listing_id` (auto-increment)  
**Foreign Key**: `parcel_id` → `parcels.parcel_id` (nullable)

### Column Definitions

| Column | Type | Nullable | Source Field | Notes |
|--------|------|----------|--------------|-------|
| `listing_id` | SERIAL | NO | Auto-generated | PRIMARY KEY |
| `parcel_id` | VARCHAR(50) | YES | Matched | FOREIGN KEY to parcels |
| `mls_id` | INTEGER | NO | `mlsId` | SimplyRETS MLS ID |
| `listing_id_str` | VARCHAR(50) | NO | `listingId` | UNIQUE, string MLS listing ID |
| `status` | VARCHAR(20) | NO | `mls.status` | active, pending, sold, withdrawn, expired |
| `status_text` | VARCHAR(100) | YES | `mls.statusText` | Status text |
| `list_price` | DECIMAL(12,2) | NO | `listPrice` | Current list price |
| `original_list_price` | DECIMAL(12,2) | YES | `originalListPrice` | Original list price |
| `sold_price` | DECIMAL(12,2) | YES | `sales.closePrice` | Sale price |
| `sold_date` | DATE | YES | `sales.closeDate` | Closing date |
| `contract_date` | DATE | YES | `sales.contractDate` | Contract date |
| `list_date` | DATE | NO | `listDate` | Listing date |
| `days_on_market` | INTEGER | YES | `mls.daysOnMarket` | Days on market |
| `mls_area` | VARCHAR(100) | YES | `mls.area` | MLS area |
| `mls_area_minor` | VARCHAR(100) | YES | `mls.areaMinor` | MLS minor area |
| `address_full` | VARCHAR(255) | NO | `address.full` | Full address |
| `address_number` | VARCHAR(20) | YES | `address.streetNumberText` | Street number |
| `street_name` | VARCHAR(200) | YES | `address.streetName` | Street name |
| `unit` | VARCHAR(50) | YES | `address.unit` | Unit/apartment |
| `city` | VARCHAR(100) | NO | `address.city` | City |
| `state` | VARCHAR(2) | NO | `address.state` | State |
| `zip_code` | VARCHAR(10) | YES | `address.postalCode` | ZIP code |
| `cross_street` | VARCHAR(200) | YES | `address.crossStreet` | Cross street |
| `latitude` | DECIMAL(10,8) | YES | `geo.lat` | Latitude |
| `longitude` | DECIMAL(11,8) | YES | `geo.lng` | Longitude |
| `county` | VARCHAR(100) | YES | `geo.county` | County |
| `market_area` | VARCHAR(100) | YES | `geo.marketArea` | Market area |
| `directions` | TEXT | YES | `geo.directions` | Driving directions |
| `property_type` | VARCHAR(50) | YES | `property.type` | Property type code |
| `property_subtype` | VARCHAR(50) | YES | `property.subType` | Property subtype |
| `property_subtype_text` | VARCHAR(100) | YES | `property.subTypeText` | Subtype description |
| `bedrooms` | INTEGER | YES | `property.bedrooms` | Number of bedrooms |
| `bathrooms` | DECIMAL(3,1) | YES | Calculated | Total bathrooms |
| `baths_full` | INTEGER | YES | `property.bathsFull` | Full bathrooms |
| `baths_half` | INTEGER | YES | `property.bathsHalf` | Half bathrooms |
| `baths_three_quarter` | INTEGER | YES | `property.bathsThreeQuarter` | 3/4 bathrooms |
| `square_feet` | INTEGER | YES | `property.area` | Square footage |
| `area_source` | VARCHAR(100) | YES | `property.areaSource` | Area source |
| `lot_size` | VARCHAR(100) | YES | `property.lotSize` | Lot size description |
| `lot_size_area` | DECIMAL(12,2) | YES | `property.lotSizeArea` | Lot size numeric |
| `lot_size_area_units` | VARCHAR(20) | YES | `property.lotSizeAreaUnits` | Lot size units |
| `acres` | DECIMAL(10,4) | YES | `property.acres` | Lot size in acres |
| `year_built` | INTEGER | YES | `property.yearBuilt` | Year built |
| `stories` | INTEGER | YES | `property.stories` | Number of stories |
| `garage_spaces` | DECIMAL(5,2) | YES | `property.garageSpaces` | Garage spaces |
| `parking_spaces` | INTEGER | YES | `property.parking.spaces` | Parking spaces |
| `parking_description` | VARCHAR(255) | YES | `property.parking.description` | Parking description |
| `style` | VARCHAR(100) | YES | `property.style` | Architectural style |
| `subdivision` | VARCHAR(200) | YES | `property.subdivision` | Subdivision name |
| `view` | VARCHAR(200) | YES | `property.view` | View description |
| `construction` | VARCHAR(255) | YES | `property.construction` | Construction details |
| `roof` | VARCHAR(100) | YES | `property.roof` | Roof type |
| `foundation` | VARCHAR(100) | YES | `property.foundation` | Foundation type |
| `heating` | VARCHAR(100) | YES | `property.heating` | Heating system |
| `cooling` | VARCHAR(100) | YES | `property.cooling` | Cooling system |
| `water` | VARCHAR(100) | YES | `property.water` | Water source |
| `fireplaces` | INTEGER | YES | `property.fireplaces` | Number of fireplaces |
| `flooring` | VARCHAR(255) | YES | `property.flooring` | Flooring type |
| `pool` | VARCHAR(255) | YES | `property.pool` | Pool details |
| `accessibility` | VARCHAR(255) | YES | `property.accessibility` | Accessibility features |
| `interior_features` | TEXT | YES | `property.interiorFeatures` | Interior features |
| `exterior_features` | TEXT | YES | `property.exteriorFeatures` | Exterior features |
| `additional_rooms` | TEXT | YES | `property.additionalRooms` | Additional rooms |
| `laundry_features` | VARCHAR(255) | YES | `property.laundryFeatures` | Laundry features |
| `lot_description` | TEXT | YES | `property.lotDescription` | Lot description |
| `maintenance_expense` | DECIMAL(10,2) | YES | `property.maintenanceExpense` | Monthly maintenance |
| `photos` | JSONB | YES | `photos` | Array of photo URLs |
| `virtual_tour_url` | VARCHAR(500) | YES | `virtualTourUrl` | Virtual tour URL |
| `public_remarks` | TEXT | YES | `remarks` | Public remarks |
| `private_remarks` | TEXT | YES | `privateRemarks` | Private remarks (restricted) |
| `showing_instructions` | TEXT | YES | `showingInstructions` | Showing instructions |
| `showing_contact_name` | VARCHAR(200) | YES | `showingContactName` | Showing contact |
| `showing_contact_phone` | VARCHAR(20) | YES | `showingContactPhone` | Showing phone |
| `terms` | VARCHAR(100) | YES | `terms` | Financing terms |
| `agreement` | VARCHAR(100) | YES | `agreement` | Purchase agreement |
| `lease_type` | VARCHAR(50) | YES | `leaseType` | Lease type |
| `lease_term` | VARCHAR(100) | YES | `leaseTerm` | Lease term |
| `special_conditions` | VARCHAR(255) | YES | `specialListingConditions` | Special conditions |
| `disclaimer` | TEXT | YES | `disclaimer` | Standard disclaimer |
| `tax_id` | VARCHAR(50) | YES | `tax.id` | Tax ID (for matching) |
| `tax_year` | INTEGER | YES | `tax.taxYear` | Tax year |
| `tax_annual_amount` | DECIMAL(12,2) | YES | `tax.taxAnnualAmount` | Annual tax |
| `listing_agent_id` | VARCHAR(50) | YES | `agent.id` | Listing agent ID |
| `listing_office_id` | VARCHAR(50) | YES | `office.brokerid` | Listing office ID |
| `co_agent_id` | VARCHAR(50) | YES | `coAgent.id` | Co-agent ID |
| `school_elementary` | VARCHAR(200) | YES | `school.elementarySchool` | Elementary school |
| `school_middle` | VARCHAR(200) | YES | `school.middleSchool` | Middle school |
| `school_high` | VARCHAR(200) | YES | `school.highSchool` | High school |
| `school_district` | VARCHAR(200) | YES | `school.district` | School district |
| `hoa_name` | VARCHAR(200) | YES | `association.name` | HOA name |
| `hoa_fee` | DECIMAL(10,2) | YES | `association.fee` | HOA fee |
| `hoa_frequency` | VARCHAR(50) | YES | `association.frequency` | HOA frequency |
| `hoa_amenities` | TEXT | YES | `association.amenities` | HOA amenities |
| `internet_address_display` | BOOLEAN | YES | `internetAddressDisplay` | Display flag |
| `internet_entire_listing_display` | BOOLEAN | YES | `internetEntireListingDisplay` | Full display flag |
| `ownership` | VARCHAR(100) | YES | `ownership` | Ownership type |
| `originating_system` | VARCHAR(100) | YES | `mls.originatingSystemName` | Source system |
| `original_entry_timestamp` | TIMESTAMP | YES | `mls.originalEntryTimestamp` | Original entry |
| `modified` | TIMESTAMP | NO | `modified` | Last modified (from API) |
| `created_at` | TIMESTAMP | NO | Default NOW() | Record creation |
| `updated_at` | TIMESTAMP | YES | Default NOW() | Record update |

### Indexes
- PRIMARY KEY: `listing_id`
- UNIQUE: `listing_id_str`
- INDEX: `parcel_id`
- INDEX: `mls_id`
- INDEX: `status`
- INDEX: `city`
- INDEX: `zip_code`
- INDEX: `list_price`
- INDEX: `listing_agent_id`
- INDEX: `listing_office_id`
- SPATIAL INDEX: `latitude`, `longitude` (for proximity queries)

---

## Table: `address_matches`

**Purpose**: Track matching between CT GIS parcels and SimplyRETS listings  
**Primary Key**: `match_id`  
**Foreign Keys**: `parcel_id` → `parcels.parcel_id`, `listing_id` → `listings.listing_id`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `match_id` | SERIAL | NO | PRIMARY KEY |
| `parcel_id` | VARCHAR(50) | NO | FOREIGN KEY to parcels |
| `listing_id` | INTEGER | NO | FOREIGN KEY to listings |
| `match_confidence` | DECIMAL(3,2) | NO | 0.00 to 1.00 |
| `match_method` | VARCHAR(20) | NO | 'address', 'geospatial', 'tax_id', 'manual' |
| `match_details` | JSONB | YES | Additional matching metadata |
| `matched_at` | TIMESTAMP | NO | Default NOW() |
| `matched_by` | VARCHAR(50) | YES | 'system', 'admin', user ID |

**Constraints**:
- UNIQUE: `(parcel_id, listing_id)`
- INDEX: `parcel_id`
- INDEX: `listing_id`
- INDEX: `match_confidence` (for filtering low-confidence matches)

---

## Table: `agents`

**Purpose**: Agent information for IDX compliance  
**Source**: SimplyRETS `agent` and `coAgent` objects

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `agent_id` | VARCHAR(50) | NO | PRIMARY KEY, from `agent.id` |
| `first_name` | VARCHAR(100) | YES | `agent.firstName` |
| `last_name` | VARCHAR(100) | YES | `agent.lastName` |
| `office_mls_id` | VARCHAR(50) | YES | `agent.officeMlsId` |
| `email` | VARCHAR(255) | YES | `agent.contact.email` |
| `office_phone` | VARCHAR(20) | YES | `agent.contact.office` |
| `cell_phone` | VARCHAR(20) | YES | `agent.contact.cell` |
| `address` | VARCHAR(255) | YES | `agent.address` |
| `modified` | TIMESTAMP | YES | `agent.modified` |
| `created_at` | TIMESTAMP | NO | Default NOW() |
| `updated_at` | TIMESTAMP | YES | Default NOW() |

**Indexes**:
- PRIMARY KEY: `agent_id`
- INDEX: `office_mls_id`

---

## Table: `offices`

**Purpose**: Office information for IDX compliance  
**Source**: SimplyRETS `office` and `coOffice` objects

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `office_id` | VARCHAR(50) | NO | PRIMARY KEY, from `office.brokerid` |
| `name` | VARCHAR(200) | YES | `office.name` |
| `serving_name` | VARCHAR(200) | YES | `office.servingName` |
| `email` | VARCHAR(255) | YES | `office.contact.email` |
| `office_phone` | VARCHAR(20) | YES | `office.contact.office` |
| `cell_phone` | VARCHAR(20) | YES | `office.contact.cell` |
| `created_at` | TIMESTAMP | NO | Default NOW() |
| `updated_at` | TIMESTAMP | YES | Default NOW() |

**Indexes**:
- PRIMARY KEY: `office_id`

---

## Data Matching Strategy

### Primary Matching Methods (in order of preference)

1. **Tax ID Matching** (Highest Confidence)
   - Match `listings.tax_id` with `parcels.parcel_id` or `parcels.cama_link`
   - Confidence: 0.95-1.00

2. **Address Matching** (High Confidence)
   - Normalize addresses from both sources
   - Match: `address_number` + `street_name` + `city` + `zip_code`
   - Fuzzy matching for variations (St vs Street, Ave vs Avenue)
   - Confidence: 0.80-0.95

3. **Geospatial Matching** (Medium Confidence)
   - Check if `listings.latitude`/`longitude` falls within `parcels.geometry` polygon
   - Use PostGIS `ST_Contains` or `ST_Within`
   - Confidence: 0.70-0.85

4. **Manual Review** (Variable Confidence)
   - Flag for manual review if confidence < 0.70
   - Store in `address_matches` with `match_method = 'manual'`

### Matching Workflow

1. Import all CT GIS parcels
2. Import all SimplyRETS listings
3. Run matching algorithm:
   - Try tax_id match first
   - If no match, try address match
   - If no match, try geospatial match
   - If confidence < 0.70, flag for manual review
4. Store all matches in `address_matches` table
5. Update `listings.parcel_id` with matched `parcel_id`

---

## Migration from Existing Property Model

The current `Property` model is MLS-centric. Migration steps:

1. **Create new tables** (parcels, listings, address_matches, agents, offices)
2. **Import CT GIS data** into `parcels` table
3. **Import SimplyRETS data** into `listings` table
4. **Run matching** to link listings to parcels
5. **Migrate existing Property records**:
   - If Property has `mls_id`, find matching listing
   - If listing has matched parcel, use that parcel
   - If no match, create new parcel from Property data
   - Update Property records with new parcel_id
6. **Deprecate old Property model** (keep for backward compatibility during transition)
7. **Update API endpoints** to use new schema

---

## Notes for Implementation

### Data Type Decisions
- **Prices**: Use DECIMAL(12,2) for all monetary values (handles SimplyRETS integer prices)
- **Dates**: Use DATE for date-only fields, TIMESTAMP for datetime fields
- **Coordinates**: Use DECIMAL(10,8) for latitude, DECIMAL(11,8) for longitude
- **Text Fields**: Use VARCHAR with appropriate lengths, TEXT for longer content
- **JSONB**: Use for arrays (photos, virtual_tours) and complex nested data

### Nullability
- Most fields are nullable to handle missing data from either source
- Only critical fields are NOT NULL (parcel_id, listing_id_str, status, etc.)

### Indexing Strategy
- Index all foreign keys
- Index frequently queried fields (status, city, zip_code, price ranges)
- Use GIST indexes for spatial columns (geometry, centroid)
- Consider composite indexes for common query patterns

### IDX Compliance
- Store `private_remarks` but don't expose to public API
- Store agent/office information for attribution
- Track `disclaimer` and display appropriately
- Respect `internetAddressDisplay` and `internetEntireListingDisplay` flags


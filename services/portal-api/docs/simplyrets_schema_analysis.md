# SimplyRETS API Schema Analysis

This document contains the complete field structure from SimplyRETS API responses to inform our database schema design.

**Date**: Analysis completed from sandbox API
**Source**: SimplyRETS Development Sandbox (`https://api.simplyrets.com`)

## Top-Level Fields (33 fields total)

All fields are present in all properties (no variation):

### Core Identification
- `listingId` (string): Unique MLS listing identifier
- `mlsId` (integer): MLS system ID
- `modified` (string): ISO 8601 timestamp of last modification

### Address Object (`address`)
- `full` (string): Complete formatted address
- `streetNumber` (integer): Numeric street number
- `streetNumberText` (string): Street number as text
- `streetName` (string): Street name
- `unit` (string, nullable): Unit/apartment number
- `city` (string): City name
- `state` (string): State name
- `postalCode` (string): ZIP code
- `crossStreet` (string, nullable): Cross street reference
- `country` (string): Country (default: "United States")

### Geo Object (`geo`)
- `lat` (float): Latitude coordinate
- `lng` (float): Longitude coordinate
- `county` (string): County name
- `marketArea` (string): Market area designation
- `directions` (string, nullable): Driving directions

### Property Object (`property`) - 40+ fields
- `type` (string): Property type code (e.g., "RES")
- `subType` (string, nullable): Property subtype
- `subTypeText` (string, nullable): Property subtype description
- `bedrooms` (integer, nullable): Number of bedrooms
- `bathrooms` (integer, nullable): Total bathrooms (may be null if using bathsFull/bathsHalf)
- `bathsFull` (integer, nullable): Full bathrooms
- `bathsHalf` (integer, nullable): Half bathrooms
- `bathsThreeQuarter` (integer, nullable): Three-quarter bathrooms
- `area` (integer): Square footage
- `areaSource` (string, nullable): Source of area measurement
- `lotSize` (string, nullable): Lot size description (e.g., "127X146")
- `lotSizeArea` (float, nullable): Lot size in square units
- `lotSizeAreaUnits` (string, nullable): Units for lotSizeArea
- `acres` (float, nullable): Lot size in acres
- `yearBuilt` (integer, nullable): Year of construction
- `stories` (integer, nullable): Number of stories
- `garageSpaces` (float, nullable): Number of garage spaces
- `parking` (object): Parking details
  - `spaces` (integer): Number of parking spaces
  - `description` (string): Parking description
  - `leased` (boolean, nullable): Whether parking is leased
- `style` (string, nullable): Architectural style
- `subdivision` (string, nullable): Subdivision name
- `view` (string, nullable): View description
- `construction` (string, nullable): Construction details
- `roof` (string, nullable): Roof type
- `foundation` (string, nullable): Foundation type
- `heating` (string, nullable): Heating system
- `cooling` (string, nullable): Cooling system
- `water` (string, nullable): Water source/type
- `fireplaces` (integer, nullable): Number of fireplaces
- `flooring` (string, nullable): Flooring type
- `pool` (string, nullable): Pool details (comma-separated)
- `accessibility` (string, nullable): Accessibility features
- `interiorFeatures` (string, nullable): Interior features (comma-separated)
- `exteriorFeatures` (string, nullable): Exterior features (comma-separated)
- `additionalRooms` (string, nullable): Additional rooms (comma-separated)
- `laundryFeatures` (string, nullable): Laundry features (comma-separated)
- `lotDescription` (string, nullable): Lot description
- `occupantName` (string, nullable): Current occupant name
- `occupantType` (string, nullable): Occupant type
- `ownerName` (string, nullable): Owner name (may be restricted for IDX compliance)
- `maintenanceExpense` (float, nullable): Monthly maintenance expense

### Pricing & Listing
- `listPrice` (integer): Current list price
- `originalListPrice` (integer, nullable): Original list price
- `listDate` (string): ISO 8601 timestamp of listing date
- `terms` (string): Financing terms
- `leaseType` (string, nullable): Lease type (e.g., "FullServ")
- `leaseTerm` (string, nullable): Lease term
- `agreement` (string): Purchase agreement type

### MLS Status (`mls`)
- `status` (string): Listing status (e.g., "Active", "Pending", "Sold")
- `statusText` (string): Status text (may contain special characters)
- `daysOnMarket` (integer): Days on market
- `area` (string): MLS area
- `areaMinor` (string, nullable): Minor area
- `originatingSystemName` (string, nullable): Source system name
- `originalEntryTimestamp` (string, nullable): Original entry timestamp

### Agent & Office
- `agent` (object): Listing agent
  - `id` (string): Agent ID
  - `firstName` (string): First name
  - `lastName` (string): Last name
  - `officeMlsId` (string, nullable): Office MLS ID
  - `contact` (object): Contact information
    - `email` (string, nullable): Email address
    - `office` (string, nullable): Office phone
    - `cell` (string, nullable): Cell phone
  - `address` (string, nullable): Agent address
  - `modified` (string, nullable): Last modified timestamp
- `office` (object): Listing office
  - `name` (string, nullable): Office name
  - `servingName` (string, nullable): Serving name
  - `brokerid` (string, nullable): Broker ID
  - `contact` (object): Contact information
    - `email` (string, nullable): Email
    - `office` (string, nullable): Office phone
    - `cell` (string, nullable): Cell phone
- `coAgent` (object, nullable): Co-listing agent (same structure as `agent`)
- `coOffice` (object, nullable): Co-listing office (same structure as `office`)

### Sales Information (`sales`)
- `closePrice` (float, nullable): Sale price
- `closeDate` (string, nullable): ISO 8601 timestamp of closing date
- `contractDate` (string, nullable): ISO 8601 timestamp of contract date
- `agent` (object, nullable): Selling agent (same structure as listing agent)
- `office` (object, nullable): Selling office (same structure as listing office)

### School Information (`school`)
- `elementarySchool` (string, nullable): Elementary school name
- `middleSchool` (string, nullable): Middle school name
- `highSchool` (string, nullable): High school name
- `district` (string, nullable): School district

### Tax Information (`tax`)
- `taxYear` (integer): Tax year
- `taxAnnualAmount` (float): Annual tax amount
- `id` (string): Tax ID/parcel identifier

### Association (`association`)
- `name` (string, nullable): HOA/association name
- `fee` (float, nullable): Monthly/annual association fee
- `frequency` (string, nullable): Fee frequency (e.g., "Monthly", "Annual")
- `amenities` (string, nullable): Amenities (comma-separated list)

### Media & Content
- `photos` (array of strings): Array of photo URLs
- `virtualTourUrl` (string, nullable): Virtual tour URL
- `remarks` (string): Public remarks/description
- `privateRemarks` (string): Private agent remarks
- `showingInstructions` (string): Showing instructions
- `showingContactName` (string, nullable): Showing contact name
- `showingContactPhone` (string, nullable): Showing contact phone

### Other Fields
- `disclaimer` (string): Standard disclaimer text
- `specialListingConditions` (string, nullable): Special conditions
- `internetAddressDisplay` (boolean, nullable): Internet display flag
- `internetEntireListingDisplay` (boolean, nullable): Full listing display flag
- `ownership` (string, nullable): Ownership type

## Key Observations for Schema Design

### Fields Critical for Our Use Case
1. **Identification**: `listingId`, `mlsId` (use `listingId` as unique identifier)
2. **Location**: `address.*`, `geo.lat`, `geo.lng` (for map display and matching)
3. **Pricing**: `listPrice`, `originalListPrice`, `sales.closePrice`, `sales.closeDate`
4. **Status**: `mls.status`, `mls.daysOnMarket`
5. **Property Details**: `property.bedrooms`, `property.bathrooms`, `property.area`, `property.yearBuilt`, `property.lotSize`, `property.garageSpaces`
6. **Media**: `photos`, `virtualTourUrl`
7. **Agent/Office**: `agent.*`, `office.*` (for IDX compliance)
8. **Tax**: `tax.taxYear`, `tax.taxAnnualAmount`, `tax.id` (for matching with CT GIS)

### Data Quality Considerations
- Many fields are nullable - need robust null handling
- Some fields use different representations (e.g., `bathrooms` vs `bathsFull`/`bathsHalf`)
- `lotSize` is a string (e.g., "127X146") - may need parsing
- `photos` is an array - store as JSONB
- Dates are ISO 8601 strings - convert to DATE/TIMESTAMP
- Prices are integers (cents) or floats - standardize to DECIMAL

### Matching Strategy
- Use `tax.id` from SimplyRETS to match with CT GIS `Parcel_ID` or `CAMA_Link`
- Use `address.full` + `address.city` + `address.postalCode` for address matching
- Use `geo.lat`/`geo.lng` for geospatial matching with parcel boundaries

### IDX Compliance Notes
- `ownerName` and `occupantName` may be restricted for public display
- `privateRemarks` should not be displayed to public
- `agent` and `office` information required for attribution
- Need to track `disclaimer` and display appropriately

